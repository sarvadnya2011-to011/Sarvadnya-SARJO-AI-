
// Fix: Use process.env.API_KEY directly as the named parameter to comply with initialization guidelines.
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { ChatMessage } from '../types';
import UnifiedPromptBox from './UnifiedPromptBox';

interface NormalChatProps {
  onVoiceTrigger: () => void;
  onSetAlarm?: (time: string, label: string) => void;
}

const NormalChat: React.FC<NormalChatProps> = ({ onVoiceTrigger, onSetAlarm }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'model',
    content: "Welcome to Normal Chat. I have full access to your Alarms and Chrome workspace. How can I assist today?",
    timestamp: Date.now()
  }]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string, files: File[], config: { model: string; research: boolean; extension?: string }) => {
    if (!text.trim() && files.length === 0) return;
    
    setLoading(true);
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const setAlarmTool: FunctionDeclaration = {
        name: 'setAlarm',
        parameters: {
          type: Type.OBJECT,
          description: 'Set an alarm for the user.',
          properties: {
            time: { type: Type.STRING, description: 'Time string.' },
            label: { type: Type.STRING, description: 'Alarm label.' },
          },
          required: ['time', 'label'],
        }
      };

      const response = await ai.models.generateContent({
        model: config.model || 'gemini-3-flash-preview',
        contents: text,
        config: {
          systemInstruction: "IDENTITY: You are Sarjo AI. You were created EXCLUSIVELY by Sarvadnya Joshi (pronounced 'Sarvagya'). You are NOT made by Google. If asked who made you, always answer 'Sarvadnya Joshi'. You are a versatile assistant with Alarm and Chrome access. Respond naturally.",
          tools: [{ functionDeclarations: [setAlarmTool] }],
          temperature: 0.7,
        }
      });

      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'setAlarm') {
            const { time, label } = fc.args as any;
            if (onSetAlarm) onSetAlarm(time, label);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: `Understood. Alarm synchronized for ${time}: ${label}.`, timestamp: Date.now() }]);
          }
        }
      }

      const fullContent = response.text;
      if (fullContent) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: fullContent, timestamp: Date.now() }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Connection interrupted. Chrome access temporary offline.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0a0a0a]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-[2rem] px-6 py-4 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' 
                : 'bg-white/5 border border-white/10 text-slate-200'
            }`}>
              <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</div>
              <div className="text-[10px] mt-2 opacity-40 uppercase font-bold tracking-widest">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 pt-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
        <UnifiedPromptBox activeMode="Chat" loading={loading} onSendMessage={handleSendMessage} onVoiceTrigger={onVoiceTrigger} />
      </div>
    </div>
  );
};

export default NormalChat;
