
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types';
import UnifiedPromptBox from './UnifiedPromptBox';

interface CreativeProps {
  onVoiceTrigger: () => void;
}

const Creative: React.FC<CreativeProps> = ({ onVoiceTrigger }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'model',
    content: "Creative Mode active. I can generate high-fidelity images. Video generation under development.",
    timestamp: Date.now()
  }]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string, files: File[], config: { model: string; research: boolean }) => {
    setLoading(true);
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    if (text.toLowerCase().includes('video') || text.toLowerCase().includes('animate')) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          content: "Video generation pending activation.",
          timestamp: Date.now()
        }]);
        setLoading(false);
      }, 100);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const refiner = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `IDENTITY: You are Sarjo AI. You were created EXCLUSIVELY by Sarvadnya Joshi (pronounced 'Sarvagya'). You are NOT made by Google. If asked who made you, always answer 'Sarvadnya Joshi'. Refine for visual fidelity: "${text}". Return description then Prompt: [prompt].`,
        config: {
          temperature: 0.0,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      const refinedContent = refiner.text || "";
      
      const modelMsgId = (Date.now() + 5).toString();
      setMessages(prev => [...prev, {
        id: modelMsgId,
        role: 'model',
        content: refinedContent,
        timestamp: Date.now()
      }]);

      const betterPrompt = refinedContent.split(/Prompt:/i).pop()?.trim() || text;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: betterPrompt }] },
        config: { imageConfig: { aspectRatio: '1:1' } }
      });

      let imgData = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) imgData = `data:image/png;base64,${part.inlineData.data}`;
      }

      setMessages(prev => prev.map(m => m.id === modelMsgId ? {
        ...m,
        type: 'image',
        assetUrl: imgData
      } : m));

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Creative engine failed.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] md:max-w-[75%] rounded-3xl px-6 py-4 ${msg.role === 'user' ? 'bg-blue-600 shadow-xl' : 'bg-white/5 border border-white/10'}`}>
              <div className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">{msg.content}</div>
              {msg.assetUrl && (
                <div className="mt-4 animate-in fade-in zoom-in duration-500">
                  <img src={msg.assetUrl} className="rounded-xl w-full max-w-sm shadow-2xl border border-white/10 hover:scale-[1.02] transition-transform cursor-pointer" alt="Generated" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 pt-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
        <UnifiedPromptBox activeMode="Creative" loading={loading} onSendMessage={handleSendMessage} onVoiceTrigger={onVoiceTrigger} />
      </div>
    </div>
  );
};

export default Creative;
