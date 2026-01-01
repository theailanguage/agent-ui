import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Trash2, X, Pencil, Check, Sparkles, Image as ImageIcon, Sun, Moon } from 'lucide-react';
import { ChatSession, AppView } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  isOpenMobile,
  onCloseMobile,
  currentView,
  onChangeView,
  theme,
  toggleTheme
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingSessionId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingSessionId]);

  const startEditing = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const saveEditing = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveEditing(id);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:relative z-30 flex flex-col h-full w-64 bg-slate-900 text-slate-300 border-r border-slate-800
        transition-transform duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Main Navigation Tabs */}
        <div className="p-3 grid grid-cols-2 gap-2 border-b border-slate-800">
           <button
             onClick={() => { onChangeView('chat'); onCloseMobile(); }}
             className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all ${
                currentView === 'chat' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'hover:bg-slate-800 text-slate-400'
             }`}
           >
             <MessageSquare size={18} className="mb-1" />
             Chat
           </button>
           <button
             onClick={() => { onChangeView('image-gen'); onCloseMobile(); }}
             className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all ${
                currentView === 'image-gen' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'hover:bg-slate-800 text-slate-400'
             }`}
           >
             <ImageIcon size={18} className="mb-1" />
             Imagine
           </button>
        </div>

        {/* View Specific Content */}
        {currentView === 'chat' ? (
          <>
            {/* New Chat Button */}
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
              <button
                onClick={() => {
                  onCreateSession();
                  onCloseMobile();
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm border border-slate-700"
              >
                <Plus size={16} />
                <span>New Chat</span>
              </button>
              
              <button 
                onClick={onCloseMobile} 
                className="md:hidden p-2 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto py-2">
              {sessions.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-slate-500">
                  No chat history yet.
                </div>
              ) : (
                <div className="flex flex-col gap-1 px-2">
                  <div className="text-xs font-semibold text-slate-500 px-2 py-2 uppercase tracking-wider">
                    History
                  </div>
                  {sessions.sort((a,b) => b.timestamp - a.timestamp).map((session) => (
                    <div key={session.id} className="relative">
                      {editingSessionId === session.id ? (
                        <div className="flex items-center gap-1 px-2 py-2 bg-slate-800 rounded-lg border border-blue-500/50">
                          <input
                            ref={inputRef}
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, session.id)}
                            onBlur={() => saveEditing(session.id)}
                            className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-0"
                          />
                          <button 
                            onClick={() => saveEditing(session.id)}
                            className="p-1 text-green-400 hover:text-green-300"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            onMouseDown={(e) => {
                              e.preventDefault(); 
                              cancelEditing();
                            }}
                            className="p-1 text-slate-400 hover:text-slate-300"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            onSelectSession(session.id);
                            onCloseMobile();
                          }}
                          className={`
                            group relative flex items-center gap-3 px-3 py-3 text-sm rounded-lg text-left transition-colors w-full
                            ${session.id === currentSessionId 
                              ? 'bg-slate-800 text-white' 
                              : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'}
                          `}
                        >
                          <MessageSquare size={16} className="flex-shrink-0" />
                          <span className="truncate flex-1 pr-14">
                            {session.title || "Untitled Chat"}
                          </span>
                          
                          <div 
                            className={`
                              absolute right-2 flex items-center gap-1
                              ${session.id === currentSessionId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                              transition-opacity bg-slate-800/80 backdrop-blur-sm rounded
                            `}
                          >
                            <div
                              onClick={(e) => startEditing(e, session)}
                              className="p-1 rounded hover:bg-blue-500/20 hover:text-blue-400 cursor-pointer"
                              title="Rename"
                            >
                              <Pencil size={13} />
                            </div>
                            <div 
                              onClick={(e) => onDeleteSession(session.id, e)}
                              className="p-1 rounded hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-4">
             <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                <Sparkles size={32} className="text-purple-500" />
             </div>
             <div>
               <h3 className="text-white font-medium mb-1">Imagine Mode</h3>
               <p className="text-xs">Create visuals powered by Gemini Nano Banana Pro.</p>
             </div>
             
             {/* Close button for mobile inside view */}
             <button 
                onClick={onCloseMobile} 
                className="md:hidden mt-10 p-2 hover:bg-slate-800 rounded-lg text-slate-400 border border-slate-700"
              >
                Close Menu
              </button>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500">Local Storage Mode</p>
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </>
  );
};