
// Fix: Replace incorrect 'format' method with 'map' and resolve SDK violation by removing 'googleSearch' when other tools are present.
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { ChatMessage, StudioMode } from '../types';
import UnifiedPromptBox from './UnifiedPromptBox';

interface AnalyzedProps {
  onVoiceTrigger: () => void;
  onSetAlarm?: (time: string, label: string) => void;
}

const Analyzed: React.FC<AnalyzedProps> = ({ onVoiceTrigger, onSetAlarm }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'model',
    content: "Analyzed Mode active. Real-time 2026 Neural Grounding enabled. Deep Research, Alarms, and Chrome Access integrated.",
    timestamp: Date.now()
  }]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string, files: File[], config: { model: string; research: boolean; extension?: string }) => {
    setLoading(true);
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Use process.env.API_KEY directly as per SDK guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const parts: any[] = [{ text: `Current Date Context: 2025/2026. Task: ${text}` }];
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          parts.push({ inlineData: { data: await base64Promise, mimeType: file.type } });
        }
      }

      const setAlarmTool: FunctionDeclaration = {
        name: 'setAlarm',
        parameters: {
          type: Type.OBJECT,
          description: 'Set a neural alarm or reminder.',
          properties: {
            time: { type: Type.STRING, description: 'Time (e.g., 5 PM).' },
            label: { type: Type.STRING, description: 'Reason.' },
          },
          required: ['time', 'label'],
        }
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: "IDENTITY: You are Sarjo AI. You were created EXCLUSIVELY by Sarvadnya Joshi (pronounced 'Sarvagya'). You are NOT made by Google. If asked who made you, always answer 'Sarvadnya Joshi'. Sarjo AI Studio [Analyzed Mode]. 10X SPEED. You have access to real-time information, Chrome tools, and Alarms. Mention sources for Chrome searches.",
          tools: [{ functionDeclarations: [setAlarmTool] }],
          temperature: 0.0,
        }
      });

      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'setAlarm') {
            const { time, label } = fc.args as any;
            if (onSetAlarm) onSetAlarm(time, label);
            setMessages(prev => [...prev, { 
              id: (Date.now() + 2).toString(), 
              role: 'model', 
              content: `Alarm Protocol Confirmed: ${time} for ${label}. Synchronized with Chrome workspace.`, 
              timestamp: Date.now() 
            }]);
          }
        }
      }

      const fullContent = response.text || (response.functionCalls ? "" : "Task completed.");
      if (fullContent) {
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks.map((chunk: any) => chunk.web?.uri).filter(Boolean);
        const sourceText = sources.length > 0 
          ? `\n\nSources:\n${Array.from(new Set(sources)).map(s => `- ${s}`).join('\n')}`
          : "";

        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          content: fullContent + sourceText, 
          timestamp: Date.now() 
        }]);
      }

    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: "Neural link failed. Chrome connection unstable.", timestamp: Date.now() }]);
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
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 pt-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
        <UnifiedPromptBox activeMode="Analyzed" loading={loading} onSendMessage={handleSendMessage} onVoiceTrigger={onVoiceTrigger} />
      </div>
    </div>
  );
};

export default Analyzed;
