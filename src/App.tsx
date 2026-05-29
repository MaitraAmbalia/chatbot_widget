import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Minus, Square } from 'lucide-react';

const CHAT_API_URL = '/chat';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isGenerating) {
      stopGeneration();
      return;
    }

    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setError(null);
    setIsLoading(true);
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    const empNo = localStorage.getItem('employeeNumber') || 'unknown';

    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeNumber: empNo, message: userMessage }),
        signal: abortControllerRef.current.signal
      });

      if (response.status === 401 || response.status === 403) {
        setError("Authorization failed.");
        setIsLoading(false);
        setIsGenerating(false);
        abortControllerRef.current = null;
        return;
      }

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setMessages(prev => [...prev, { role: 'bot', content: '' }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) {
        throw new Error('No readable stream available');
      }

      setIsLoading(false);

      let botMessageContent = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          if (buffer && buffer.startsWith('data: ')) {
            botMessageContent += buffer.slice(6);
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'bot', content: botMessageContent };
              return updated;
            });
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            botMessageContent += line.slice(6);
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'bot', content: botMessageContent };
              return updated;
            });
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'bot' && last.content === '') {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } else {
        console.error(err);
        setError("Something went wrong ...");
      }
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="font-sans antialiased">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3.5 shadow-2xl shadow-blue-500/30 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none ring-4 ring-blue-600/20 cursor-pointer"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      ) : (
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] w-[calc(100vw-2rem)] sm:w-[350px] h-[calc(100vh-5rem)] sm:h-[550px] max-h-[85vh] flex flex-col border border-white/60 overflow-hidden origin-bottom-right transition-all duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 flex justify-between items-center shadow-sm z-10">
            <div className="font-medium text-[15px] flex items-center gap-2.5">
              <div className="bg-white/20 p-1.5 rounded-lg text-white backdrop-blur-md">
                <MessageCircle size={18} />
              </div>
              <span className="tracking-tight">Support Chat</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/20 p-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
              aria-label="Minimize chat"
            >
              <Minus size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/50 scroll-smooth">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 mt-10 flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-white shadow-sm ring-1 ring-slate-900/5 rounded-2xl flex items-center justify-center text-blue-600">
                  <MessageCircle size={28} />
                </div>
                <p className="font-medium text-slate-600 text-[13px]">Hello! How can I help you today?</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-[14px] py-[8px] text-[13px] leading-relaxed shadow-sm transition-all duration-200 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-[16px] rounded-br-[4px]'
                      : 'bg-white border border-slate-100 text-slate-800 rounded-[16px] rounded-bl-[4px] shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200/60 ring-1 ring-slate-900/5 shadow-sm rounded-[16px] rounded-bl-[4px] px-4 py-3.5 flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {error && (
              <div className="text-center text-red-600 text-sm my-2 p-3 bg-red-50/80 backdrop-blur-sm rounded-xl border border-red-100 font-medium shadow-sm">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3.5 bg-white/90 backdrop-blur-xl border-t border-white/50 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-slate-50/80 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white border border-slate-200/60 focus:border-blue-500/30 transition-all shadow-inner text-[13px] placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!isGenerating && !inputValue.trim()}
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20 hover:shadow-lg active:scale-95 cursor-pointer flex-shrink-0"
                aria-label={isGenerating ? "Stop generation" : "Send message"}
              >
                {isGenerating ? <Square size={16} strokeWidth={2.5} className="fill-current" /> : <Send size={16} strokeWidth={2.5} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
