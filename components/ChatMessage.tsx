import React from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  // Simple markdown-like formatting for bold text
  const formatContent = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}> 
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-lg ${
          isUser
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
            : 'bg-slate-700/50 backdrop-blur-sm text-slate-100 border border-slate-600/50'
        }`}
      >
        <div className={`text-xs font-medium mb-2 flex items-center gap-2 ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}> 
          {isUser ? (
            <> 
              <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">👤</span>
              You
            </>
          ) : (
            <> 
              <span className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-[10px]">🚁</span>
              Skylark AI
            </>
          )}
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap"> 
          {formatContent(content)}
        </div>
      </div>
    </div>
  );
}