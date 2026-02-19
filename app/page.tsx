'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '👋 Welcome to **Skylark Drones Operations Center**!\n\nI''m your AI-powered coordinator. I can help you with:\n\n🧑‍✈️ **Pilot Management** - Check availability, skills, certifications\n\n🚁 **Drone Fleet** - Track inventory, capabilities, maintenance\n\n📋 **Missions** - Assign pilots & drones, detect conflicts\n\n⚡ **Urgent Actions** - Handle reassignments quickly\n\nTry asking:\n- "Show me available pilots in Bangalore"\n- "Which drones can fly in rainy weather?"\n- "Assign the best team to PRJ001'\n    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message || 'Sorry, I encountered an error.',
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ Sorry, I encountered an error processing your request. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"> 
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white py-5 px-6 shadow-xl border-b border-indigo-500/30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <span className="text-2xl">🚁</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Skylark Drones</h1>
              <p className="text-sm text-indigo-200 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                AI Operations Coordinator
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-3">
            <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-sm">
              <span className="text-indigo-200">Pilots:</span> <span className="font-semibold">4</span>
            </div>
            <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-sm">
              <span className="text-indigo-200">Drones:</span> <span className="font-semibold">4</span>
            </div>
            <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-sm">
              <span className="text-indigo-200">Missions:</span> <span className="font-semibold">3</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} role={msg.role} content={msg.content} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-2xl px-5 py-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  <span className="text-slate-400 text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-slate-800/80 backdrop-blur-xl border-t border-slate-700/50 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
        <div className="text-center pb-3">
          <p className="text-xs text-slate-500">Powered by AI • Real-time Google Sheets Sync</p>
        </div>
      </div>
    </div>
  );
}