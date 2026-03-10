import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, Cpu, User as UserIcon, ArrowDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatInterface({ 
  messages, 
  onSendMessage, 
  isTyping 
}: { 
  messages: Message[], 
  onSendMessage: (text: string) => void,
  isTyping: boolean
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      // Show button if we are more than 100px away from bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0f16] relative h-full">
      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-y-contain scroll-smooth"
      >
        {messages.map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={`flex gap-2 md:gap-4 max-w-[75%] md:max-w-3xl ${msg.sender === 'host' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.sender === 'system' ? 'bg-blue-900/50 border border-blue-500/50 text-blue-400' : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}>
              {msg.sender === 'system' ? <Cpu className="w-3 h-3 md:w-4 md:h-4" /> : <UserIcon className="w-3 h-3 md:w-4 md:h-4" />}
            </div>
            <div className={`flex flex-col ${msg.sender === 'host' ? 'items-end' : 'items-start'} min-w-0`}>
              <span className="text-[10px] md:text-xs text-slate-500 mb-1 font-mono">
                {msg.sender === 'system' ? 'HỆ THỐNG' : 'KÝ CHỦ'} • {msg.timestamp.toLocaleDateString() === new Date().toLocaleDateString() 
                  ? msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                  : msg.timestamp.toLocaleString([], {day: 'numeric', month: 'numeric', hour: '2-digit', minute:'2-digit'})}
              </span>
              <div className={`px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm leading-relaxed break-words max-w-full ${
                msg.sender === 'system' 
                  ? 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none' 
                  : 'bg-blue-600 text-white rounded-tr-none'
              }`}>
                {msg.sender === 'system' ? (
                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 text-xs md:text-sm">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <div className="flex gap-2 md:gap-4 max-w-[75%] md:max-w-3xl">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-900/50 border border-blue-500/50 text-blue-400 flex items-center justify-center shrink-0">
              <Cpu className="w-3 h-3 md:w-4 md:h-4" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] md:text-xs text-slate-500 mb-1 font-mono">HỆ THỐNG</span>
              <div className="px-3 py-3 md:px-4 md:py-4 rounded-xl md:rounded-2xl bg-slate-800/50 border border-slate-700/50 rounded-tl-none flex gap-1">
                <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-32 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-900/50 z-20 hover:bg-blue-500 transition-colors border border-blue-400/50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="px-4 py-2 bg-[#0a0f16] border-t border-slate-800/50 flex gap-2 overflow-x-auto scrollbar-hide">
        {[
          { label: "Nhiệm vụ Tài năng", command: "Hệ thống, giao cho tôi một nhiệm vụ để tăng Tài năng (Talent) ngay!" },
          { label: "Nhiệm vụ Trí tuệ", command: "Hệ thống, giao cho tôi một nhiệm vụ để tăng Trí tuệ (Intelligence) ngay!" },
          { label: "Nhiệm vụ Thể lực", command: "Hệ thống, giao cho tôi một nhiệm vụ để tăng Thể lực (Strength) ngay!" },
          { label: "Kiểm tra chỉ số", command: "Hệ thống, hãy phân tích và báo cáo lại bảng chỉ số hiện tại của tôi." },
        ].map((action, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(action.command)}
            disabled={isTyping}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-xs text-slate-400 hover:bg-blue-900/20 hover:text-blue-400 hover:border-blue-500/50 transition-all disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-2 bg-[#0a0f16] border-t border-slate-800/50 relative z-50 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập phản hồi..."
            disabled={isTyping}
            className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-all placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/20"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
