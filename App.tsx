import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message, Role, ChatSession, AppView } from './types';
import { streamChatResponse, AVAILABLE_MODELS, DEFAULT_MODEL } from './services/geminiService';
import { MessageItem } from './components/MessageItem';
import { InputArea } from './components/InputArea';
import { saveSessionsToStorage, loadSessionsFromStorage } from './utils/localStorage';
import { Sidebar } from './components/Sidebar';
import { ImageGenView } from './components/ImageGenView';
import { Sparkles, ChevronDown, Menu } from 'lucide-react';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const createNewSession = (): ChatSession => ({
  id: Date.now().toString(),
  title: 'New Chat',
  messages: [],
  timestamp: Date.now(),
});

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('chat');
  
  // Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
      // Default to dark mode preferred if system says so, else light
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    const loaded = loadSessionsFromStorage();
    if (loaded && loaded.length > 0) {
      setSessions(loaded);
      // Select the most recent one by default
      const mostRecent = loaded.sort((a, b) => b.timestamp - a.timestamp)[0];
      setCurrentSessionId(mostRecent.id);
    } else {
      // Create first session
      const newSession = createNewSession();
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
    }
  }, []);

  // Save on change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessionsToStorage(sessions);
    }
  }, [sessions]);

  // Derived state for current messages
  const currentSession = useMemo(
    () => sessions.find(s => s.id === currentSessionId), 
    [sessions, currentSessionId]
  );
  
  const messages = currentSession?.messages || [];

  // Scroll on new messages
  useEffect(() => {
    if (currentView === 'chat' && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, messages[messages.length - 1]?.text, messages[messages.length - 1]?.isStreaming, currentView]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreateSession = () => {
    const newSession = createNewSession();
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
    setCurrentView('chat'); // Switch back to chat if creating a new session
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, title: newTitle } : s
    ));
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      
      if (currentSessionId === id) {
        if (newSessions.length > 0) {
          setCurrentSessionId(newSessions[0].id);
        } else {
          // If deleted last one, create a new one
          const newSession = createNewSession();
          setSessions([newSession]);
          setCurrentSessionId(newSession.id);
        }
      }
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear this conversation?")) {
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [], timestamp: Date.now() };
        }
        return s;
      }));
    }
  };

  const updateCurrentSessionMessages = (updateFn: (msgs: Message[]) => Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { 
          ...s, 
          messages: updateFn(s.messages),
          timestamp: Date.now() 
        };
      }
      return s;
    }));
  };

  const handleSendMessage = async (text: string, files: File[]) => {
    if (isLoading || !currentSessionId) return;

    // Process files
    const attachments = await Promise.all(
      files.map(async (file) => ({
        mimeType: file.type,
        data: await fileToBase64(file),
      }))
    );

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text,
      attachments,
      timestamp: Date.now(),
    };

    // Update state with user message
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        // Generate title if it's the first message
        const newTitle = s.messages.length === 0 
          ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) || "Image Attachment"
          : s.title;

        return { 
          ...s, 
          title: newTitle,
          messages: [...s.messages, newUserMessage],
          timestamp: Date.now() 
        };
      }
      return s;
    }));

    setIsLoading(true);

    const tempBotMessageId = (Date.now() + 1).toString();
    const tempBotMessage: Message = {
      id: tempBotMessageId,
      role: Role.MODEL,
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    // Add placeholder bot message
    updateCurrentSessionMessages(msgs => [...msgs, tempBotMessage]);

    try {
      let accumulatedText = '';
      
      // We need to fetch the *latest* messages state for the API call
      const historyForApi = [...messages, newUserMessage];

      await streamChatResponse(
        historyForApi, 
        '', 
        [], 
        selectedModel,
        (chunk) => {
          accumulatedText += chunk;
          updateCurrentSessionMessages(msgs => 
            msgs.map(msg => 
              msg.id === tempBotMessageId 
                ? { ...msg, text: accumulatedText } 
                : msg
            )
          );
        }
      );

      // Finalize
      updateCurrentSessionMessages(msgs => 
        msgs.map(msg => 
          msg.id === tempBotMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );

    } catch (error) {
      console.error("Failed to generate response", error);
      updateCurrentSessionMessages(msgs => 
        msgs.map(msg => 
          msg.id === tempBotMessageId 
            ? { ...msg, text: "**Error:** Failed to generate response. Please check your API key and network connection.", isStreaming: false } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        currentView={currentView}
        onChangeView={setCurrentView}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full w-full relative">
        
        {/* Header (Different based on view) */}
        {currentView === 'chat' && (
          <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Menu size={20} />
              </button>
              <div className="p-1.5 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg shadow-lg text-white">
                <Sparkles size={18} />
              </div>
              <div>
                 <h1 className="font-bold text-base text-slate-800 dark:text-white leading-tight hidden sm:block">Gemini ThinkChat</h1>
                 <h1 className="font-bold text-base text-slate-800 dark:text-white leading-tight sm:hidden">Gemini</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <div className="relative group">
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors max-w-[150px] sm:max-w-none truncate"
                    disabled={isLoading}
                  >
                    {AVAILABLE_MODELS.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ChevronDown size={14} />
                  </div>
               </div>
            </div>
          </header>
        )}
        
        {/* Imagine Header (Simplified) */}
        {currentView === 'image-gen' && (
           <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
             <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsMobileMenuOpen(true)}
                 className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
               >
                 <Menu size={20} />
               </button>
               <span className="font-bold text-slate-800 dark:text-white">Imagine</span>
             </div>
           </header>
        )}

        {/* Content Body */}
        {currentView === 'chat' ? (
          <>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
              <div className="max-w-4xl mx-auto flex flex-col min-h-full">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60 mt-10">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <Sparkles size={32} className="text-blue-500" />
                    </div>
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">How can I help you today?</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageItem key={msg.id} message={msg} />
                  ))
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </main>

            <div className="flex-shrink-0">
              <InputArea 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
                onClearChat={handleClearChat}
              />
            </div>
          </>
        ) : (
          <ImageGenView />
        )}
      </div>
    </div>
  );
};

export default App;