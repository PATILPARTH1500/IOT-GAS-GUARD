import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, SensorData } from '../types';
import { chatWithAssistant } from '../lib/gemini';

interface AIChatProps {
  sensorData: SensorData;
}

export function AIChat({ sensorData }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm monitoring the gas levels. Ask me anything about the current status.", timestamp: new Date().toLocaleTimeString() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await chatWithAssistant(input, sensorData);
      const botMsg: ChatMessage = { role: 'assistant', content: reply, timestamp: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = { role: 'assistant', content: "Sorry, I'm having trouble connecting to the AI service.", timestamp: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-6 right-6 p-4 bg-blue-500 text-white rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] z-50 hover:scale-110 transition-transform"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] glass-panel flex flex-col z-50 border border-blue-500/30 shadow-2xl"
          >
            <div className="p-4 border-b border-[var(--glass-border)] bg-blue-500/10 flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-[var(--text-primary)]">Gas Guard Assistant</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-tr-none' 
                      : 'bg-[var(--glass-bg)] text-[var(--text-primary)] rounded-tl-none'
                  }`}>
                    <p>{msg.content}</p>
                    <span className="text-[10px] opacity-50 block mt-1 text-right">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--glass-bg)] p-3 rounded-xl rounded-tl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce delay-75" />
                    <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--glass-border)] flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about safety..."
                className="flex-1 bg-[var(--card-inner-bg)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                className="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
