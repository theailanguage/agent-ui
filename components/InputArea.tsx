import React, { useState, useRef, ChangeEvent } from 'react';
import { Send, Paperclip, X, Image as ImageIcon } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: File[]) => void;
  isLoading: boolean;
  onClearChat: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading, onClearChat }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((!text.trim() && files.length === 0) || isLoading) return;
    onSendMessage(text, files);
    setText('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-all">
      <div className="max-w-4xl mx-auto">
        
        {/* File Preview */}
        {files.length > 0 && (
          <div className="flex gap-3 mb-3 overflow-x-auto py-2">
            {files.map((file, i) => (
              <div key={i} className="relative group flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 w-24 h-24 flex flex-col items-center justify-center">
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                {file.type.startsWith('image/') ? (
                   <ImageIcon className="text-slate-400 mb-1" size={24} />
                ) : (
                   <Paperclip className="text-slate-400 mb-1" size={24} />
                )}
                <span className="text-[10px] text-slate-500 truncate w-full text-center">{file.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-end gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
          
          <button
            onClick={onClearChat}
            className="p-3 text-slate-400 hover:text-red-500 transition-colors"
            title="Clear Chat"
          >
             <span className="text-xs font-bold uppercase tracking-wider">Clear</span>
          </button>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 my-auto"></div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Attach File"
          >
            <Paperclip size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none max-h-[150px] py-3 text-sm"
            rows={1}
            disabled={isLoading}
          />

          <button
            onClick={handleSend}
            disabled={(!text.trim() && files.length === 0) || isLoading}
            className={`p-3 rounded-lg transition-all ${
              (!text.trim() && files.length === 0) || isLoading
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
        
        <div className="text-center mt-2">
           <p className="text-[10px] text-slate-400">Gemini can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
};