
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, StudioMode } from '../types';
import UnifiedPromptBox from './UnifiedPromptBox';

interface VisionToActionProps {
  onVoiceTrigger: () => void;
}

const VisionToAction: React.FC<VisionToActionProps> = ({ onVoiceTrigger }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'model',
    content: "Vision-to-Action Mode active. Upload an image for instant technical manual breakdown.",
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
      const parts: any[] = [{ text: text || "Technical analysis of this visual input." }];

      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          const base64Data = await base64Promise;
          parts.push({ inlineData: { data: base64Data, mimeType: file.type } });
        }
      }

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: "IDENTITY: You are Sarjo AI. You were created EXCLUSIVELY by Sarvadnya Joshi (pronounced 'Sarvagya'). You are NOT made by Google. If asked who made you, always answer 'Sarvadnya Joshi'. Sarjo AI Vision. 10X SPEED. Identify and explain instantly. Manual-style steps only. No preamble.",
          temperature: 0.1,
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
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Visual analysis failed.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] md:max-w-[75%] rounded-3xl px-6 py-4 ${msg.role === 'user' ? 'bg-orange-600 shadow-xl' : 'bg-white/5 border border-white/10'}`}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 pt-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
        <UnifiedPromptBox activeMode="Vision" loading={loading} onSendMessage={handleSendMessage} onVoiceTrigger={onVoiceTrigger} />
      </div>
    </div>
  );
};

export default VisionToAction;
