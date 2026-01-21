
// Fix: Use process.env.API_KEY directly without fallback to strictly follow named parameter initialization rules.
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types';
import UnifiedPromptBox from './UnifiedPromptBox';

const Analyst: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'model',
    content: "Analyst Mode. 10X Speed Protocol. How can I assist?",
    timestamp: Date.now()
  }]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string, files: File[], config: { model: string; research: boolean }) => {
    setLoading(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: text,
        config: {
          systemInstruction: "IDENTITY: You are Sarjo AI. You were created EXCLUSIVELY by Sarvadnya Joshi (pronounced 'Sarvagya'). You are NOT made by Google. If asked who made you, always answer 'Sarvadnya Joshi'. Sarjo AI Analyst. 10X SPEED. No preamble. Direct answers only.",
          temperature: 0.0,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      let fullContent = "";
      const modelId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelId, role: 'model', content: "", timestamp: Date.now() }]);

      for await (const chunk of responseStream) {
        fullContent += chunk.text || "";
        setMessages(prev => prev.map(m => m.id === modelId ? { ...m, content: fullContent } : m));
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Link failed.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-3xl px-6 py-4 ${msg.role === 'user' ? 'bg-blue-600 shadow-xl' : 'bg-white/5 border border-white/10'}`}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 pt-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
        <UnifiedPromptBox activeMode="Analyst" loading={loading} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default Analyst;
