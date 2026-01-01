import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';
import { User, Bot } from 'lucide-react';
import { ThinkingExpander } from './ThinkingExpander';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  // Helper to parse thoughts from text if not already separated
  // We look for <think> tags which are common in thinking models
  const { displayThought, displayText } = useMemo(() => {
    let rawText = message.text || '';
    let thought = message.thought || '';

    // If message.thought is already populated (from our stream handler), use it.
    // Otherwise, try to extract from text.
    if (!thought) {
      const thinkMatch = rawText.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkMatch) {
        thought = thinkMatch[1].trim();
        rawText = rawText.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      }
    }

    return { displayThought: thought, displayText: rawText };
  }, [message.text, message.thought]);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] lg:max-w-[65%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-emerald-600 text-white'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
          
          <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
          }`}>
            
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {message.attachments.map((att, idx) => (
                  <div key={idx} className="relative group overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
                    {att.mimeType.startsWith('image/') ? (
                      <img 
                        src={`data:${att.mimeType};base64,${att.data}`} 
                        alt="attachment" 
                        className="max-h-48 object-cover"
                      />
                    ) : (
                      <div className="p-4 bg-slate-100 dark:bg-slate-700 flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs">FILE</span>
                        <span className="truncate max-w-[150px]">{att.mimeType}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Thoughts (Only for Model) */}
            {!isUser && displayThought && (
               <div className="w-full min-w-[300px]">
                 <ThinkingExpander thought={displayThought} />
               </div>
            )}

            {/* Main Text */}
            <div className={`markdown-body text-sm leading-relaxed overflow-hidden ${isUser ? 'text-white' : ''}`}>
               {displayText ? (
                  <ReactMarkdown 
                    components={{
                      // Custom styling for code blocks in markdown
                      code({node, className, children, ...props}) {
                         return (
                            <code className={`${className} ${isUser ? 'bg-blue-700' : 'bg-slate-100 dark:bg-slate-900'} rounded px-1`} {...props}>
                              {children}
                            </code>
                         )
                      }
                    }}
                  >
                    {displayText}
                  </ReactMarkdown>
               ) : (
                 /* Loading indicator if no text yet and streaming */
                 message.isStreaming && !displayThought ? (
                   <span className="animate-pulse">Thinking...</span>
                 ) : null
               )}
            </div>
          </div>
          
          {/* Timestamp */}
          <span className="text-[10px] text-slate-400 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};