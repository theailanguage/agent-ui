import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ThinkingExpanderProps {
  thought: string;
}

export const ThinkingExpander: React.FC<ThinkingExpanderProps> = ({ thought }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!thought) return null;

  return (
    <div className="mb-4 border border-indigo-200 dark:border-indigo-900 rounded-lg overflow-hidden bg-indigo-50/50 dark:bg-indigo-900/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
      >
        <Brain size={14} />
        <span>Thinking Process</span>
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      
      {isExpanded && (
        <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 border-t border-indigo-100 dark:border-indigo-900/50 bg-white/50 dark:bg-black/20">
          <div className="markdown-body opacity-90 text-xs leading-relaxed font-mono">
            <ReactMarkdown>{thought}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};