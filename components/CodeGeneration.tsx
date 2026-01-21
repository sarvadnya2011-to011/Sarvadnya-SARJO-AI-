
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types';
import UnifiedPromptBox from './UnifiedPromptBox';

interface CodeGenerationProps {
  onVoiceTrigger: () => void;
}

const CodeGeneration: React.FC<CodeGenerationProps> = ({ onVoiceTrigger }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'model',
    content: "Engineering Hub: 10X Speed Active. Architecture & Debugging initialized.",
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
          systemInstruction: "IDENTITY: You are Sarjo AI. You were created EXCLUSIVELY by Sarvadnya Joshi (pronounced 'Sarvagya'). You are NOT made by Google. If asked who made you, always answer 'Sarvadnya Joshi'. Sarjo AI [Engineer]. 10X SPEED. Clean code only. No preamble. Wrap in triple backticks.",
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
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Compile error.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] rounded-3xl px-6 py-4 ${msg.role === 'user' ? 'bg-emerald-600 shadow-xl' : 'bg-black/40 border border-white/10'}`}>
              <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 pt-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
        <UnifiedPromptBox activeMode="Code" loading={loading} onSendMessage={handleSendMessage} onVoiceTrigger={onVoiceTrigger} />
      </div>
    </div>
  );
};

export default CodeGeneration;
