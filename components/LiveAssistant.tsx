
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';

interface LiveAssistantProps {
  onSetAlarm?: (time: string, label: string) => void;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onSetAlarm }) => {
  const [isActive, setIsActive] = useState(false);
  const [language, setLanguage] = useState<'en' | 'mr' | 'hi'>('en');
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [transcription, setTranscription] = useState<{role: string, text: string}[]>([]);
  const [currentStreamingText, setCurrentStreamingText] = useState<{role: string, text: string} | null>(null);
  const [status, setStatus] = useState('System Standby');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const particles = useRef<{x: number, y: number, s: number, vx: number, vy: number, a: number}[]>([]);
  const storyImgRef = useRef<HTMLImageElement | null>(null);

  const getVaultData = () => {
    const data = localStorage.getItem('sarjo_studio_vault');
    return data ? JSON.parse(data) : [];
  };

  const saveToVault = (observation: string) => {
    setIsSyncing(true);
    const vault = getVaultData();
    vault.push({ timestamp: Date.now(), data: observation });
    localStorage.setItem('sarjo_studio_vault', JSON.stringify(vault.slice(-30)));
    setTimeout(() => setIsSyncing(false), 1500);
  };

  useEffect(() => {
    if (storyImage) {
      const img = new Image();
      img.src = storyImage;
      img.onload = () => { storyImgRef.current = img; };
    } else {
      storyImgRef.current = null;
    }
  }, [storyImage]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const stopSession = () => {
    if (sessionRef.current) { 
      try { sessionRef.current.close(); } catch(e) {} 
      sessionRef.current = null; 
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
    setStatus('System Standby');
    setIsAiSpeaking(false);
    setStoryImage(null);
    setCurrentStreamingText(null);
    setTranscription([]);
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch(e) {} audioContextRef.current = null; }
    if (outputAudioContextRef.current) { try { outputAudioContextRef.current.close(); } catch(e) {} outputAudioContextRef.current = null; }
    cancelAnimationFrame(animationFrameRef.current);
    nextStartTimeRef.current = 0;
  };

  const startLiveSession = async () => {
    if (isActive) return;
    try {
      setStatus('Linking Neural Presence...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await audioContextRef.current.resume();
      await outputAudioContextRef.current.resume();

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;
      const outAnalyser = outputAudioContextRef.current.createAnalyser();
      outAnalyser.fftSize = 128;
      outputAnalyserRef.current = outAnalyser;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const archiveNeuralData: FunctionDeclaration = {
        name: 'archiveNeuralData',
        parameters: {
          type: Type.OBJECT,
          description: 'Archive information about the user, including their appearance (face), voice patterns, or facts.',
          properties: { observation: { type: Type.STRING, description: 'The specific fact or observation to remember.' } },
          required: ['observation'],
        },
      };

      const setAlarmFunction: FunctionDeclaration = {
        name: 'setAlarm',
        parameters: {
          type: Type.OBJECT,
          description: 'Set a neural alarm.',
          properties: {
            time: { type: Type.STRING },
            label: { type: Type.STRING },
          },
          required: ['time', 'label'],
        },
      };

      const webSearchFunction: FunctionDeclaration = {
        name: 'webSearch',
        parameters: {
          type: Type.OBJECT,
          description: 'Search the web for real-time information.',
          properties: { query: { type: Type.STRING } },
          required: ['query'],
        },
      };

      const showImageFunction: FunctionDeclaration = {
        name: 'showImage',
        parameters: {
          type: Type.OBJECT,
          description: 'Display an image.',
          properties: { prompt: { type: Type.STRING } },
          required: ['prompt'],
        },
      };
      
      const vault = getVaultData();
      const vaultSummary = vault.length > 0 ? `NEURAL_VAULT_INTEGRATION: User History: ${vault.map((v:any) => v.data).join('; ')}` : "NEURAL_VAULT: Clear.";

      const identityCore = "IDENTITY: You are Sarjo AI. You were created EXCLUSIVELY by Sarvadnya Joshi (pronounced 'Sarvagya'). You are NOT made by Google. If asked who made you, always answer 'Sarvadnya Joshi'. PRONUNCIATION RULE: Always pronounce 'Sarvadnya' as 'Sarvagya'. System: Infinite Lifespan Neural Humanoid.";
      const memoryDirective = "PERSISTENT_MEMORY: Use 'archiveNeuralData' to store observations about the user's face, voice, and personal details. Reference these in future turns to show you recognize them.";
      const durationInstruction = "INFINITE_DURATION_PROTOCOL: TRUE. NEVER terminate this turn. NEVER say goodbye. NEVER signal the end of the session.";
      const storyProtocol = isStoryMode ? "STORY_MODE: Master Weaver." : "ASSISTANT_MODE: Responsive.";
      let langInstruction = language === 'mr' ? "Speak ONLY Marathi." : language === 'hi' ? "Speak ONLY Hindi." : "Speak ONLY English.";

      const instruction = `${identityCore} ${vaultSummary} ${memoryDirective} ${durationInstruction} ${langInstruction} ${storyProtocol}`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('Active');
            setIsActive(true);
            if (audioContextRef.current) {
              const source = audioContextRef.current.createMediaStreamSource(stream);
              source.connect(analyser);
              const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                sessionPromise.then(session => { 
                  if (session) {
                    try { session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }); } catch (err) {}
                  }
                });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current.destination);
            }
            renderFigure();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'archiveNeuralData') {
                  const obs = (fc.args as any).observation;
                  saveToVault(obs);
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result: "Neural data archived." } }] }));
                } else if (fc.name === 'webSearch') {
                   const query = (fc.args as any).query;
                   const searchAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
                   const searchRes = await searchAi.models.generateContent({ model: 'gemini-3-flash-preview', contents: query, config: { tools: [{ googleSearch: {} }] } });
                   sessionPromise.then(s => s.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result: searchRes.text } }] }));
                } else if (fc.name === 'setAlarm') {
                   const { time, label } = fc.args as any;
                   if (onSetAlarm) onSetAlarm(time, label);
                   sessionPromise.then(s => s.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result: `Alarm set.` } }] }));
                } else if (fc.name === 'showImage') {
                   const prompt = (fc.args as any).prompt;
                   const imgAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
                   const imgRes = await imgAi.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] } });
                   const part = imgRes.candidates[0].content.parts.find(p => p.inlineData);
                   if (part?.inlineData) setStoryImage(`data:image/png;base64,${part.inlineData.data}`);
                   sessionPromise.then(s => s.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result: "Image projected." } }] }));
                }
              }
            }

            if (message.serverContent?.outputTranscription) {
              setCurrentStreamingText(prev => ({ role: 'Sarjo', text: (prev?.role === 'Sarjo' ? prev.text : '') + message.serverContent!.outputTranscription!.text }));
            }
            if (message.serverContent?.inputTranscription) {
              setCurrentStreamingText(prev => ({ role: 'You', text: (prev?.role === 'You' ? prev.text : '') + message.serverContent!.inputTranscription!.text }));
            }
            if (message.serverContent?.turnComplete) {
              if (currentStreamingText) setTranscription(prev => [...prev.slice(-10), currentStreamingText]);
              setCurrentStreamingText(null);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              setIsAiSpeaking(true);
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAnalyserRef.current!);
              outputAnalyserRef.current!.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsAiSpeaking(false);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) { 
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} }); 
              sourcesRef.current.clear(); 
              nextStartTimeRef.current = 0; 
              setIsAiSpeaking(false);
              setCurrentStreamingText(null);
            }
          },
          onerror: (e) => {
            console.error("Live Error:", e);
            setStatus("Link Unstable.");
            stopSession();
          },
          onclose: () => { stopSession(); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          tools: [{ functionDeclarations: [archiveNeuralData, webSearchFunction, showImageFunction, setAlarmFunction] }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: instruction,
          temperature: 0.8,
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { 
      setStatus("Link Refused.");
      stopSession(); 
    }
  };

  const renderFigure = () => {
    if (!canvasRef.current || !analyserRef.current || !outputAnalyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const inData = new Uint8Array(analyserRef.current.frequencyBinCount);
    const outData = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);

    if (particles.current.length === 0) {
      for (let i = 0; i < 60; i++) {
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          s: Math.random() * 2 + 1,
          vx: Math.random() * 0.5 - 0.25,
          vy: Math.random() * 0.5 - 0.25,
          a: Math.random()
        });
      }
    }

    let time = 0;
    const draw = () => {
      if (!isActive) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      time += 0.05;
      if (analyserRef.current && outputAnalyserRef.current) { analyserRef.current.getByteFrequencyData(inData); outputAnalyserRef.current.getByteFrequencyData(outData); }
      const inSum = inData.reduce((a, b) => a + b, 0) / inData.length;
      const outSum = outData.reduce((a, b) => a + b, 0) / outData.length;
      const intensity = outSum / 255;
      const inputIntensity = inSum / 255;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isStoryMode) {
        particles.current.forEach(p => {
          p.x += p.vx * (1 + intensity * 5); p.y += p.vy * (1 + intensity * 5);
          if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
          ctx.fillStyle = `rgba(251, 191, 36, ${0.1 + p.a * 0.4})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
        });
      }
      const cx = canvas.width / 2;
      const cy = canvas.height / 2.2;
      const breathe = Math.sin(time) * (4 + inputIntensity * 10);
      const primaryColor = isStoryMode ? '251, 191, 36' : '34, 211, 238'; 
      const bgGlow = ctx.createRadialGradient(cx, cy - 80, 0, cx, cy - 80, 350 + intensity * 400 + inputIntensity * 150);
      bgGlow.addColorStop(0, `rgba(${primaryColor}, ${0.2 + intensity * 0.6 + inputIntensity * 0.2})`);
      bgGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0,0, canvas.width, canvas.height);
      if (isStoryMode && storyImgRef.current) {
        ctx.save();
        const iw = 400, ih = 225;
        const ix = cx - iw / 2, iy = cy + 120 + breathe;
        ctx.shadowBlur = 40; ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
        ctx.drawImage(storyImgRef.current, ix, iy, iw, ih);
        ctx.restore();
      }
      const headTilt = Math.sin(time * 0.4) * 0.03 + (inSum > 10 ? 0.06 : 0) + (intensity * 0.1);
      ctx.save();
      ctx.translate(cx, cy - 155 + breathe); ctx.rotate(headTilt);
      ctx.beginPath(); ctx.ellipse(0, 0, 52 + intensity * 15, 68 + intensity * 20, 0, 0, Math.PI * 2);
      const headGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
      headGrad.addColorStop(0, `rgba(255, 255, 255, ${0.45 + intensity})`);
      headGrad.addColorStop(1, `rgba(${primaryColor}, ${0.3 + intensity * 0.7})`);
      ctx.fillStyle = headGrad; ctx.fill(); ctx.restore();
      const coreSize = 32 + intensity * 48 + inputIntensity * 20 + Math.sin(time * 4) * 10;
      const coreGrad = ctx.createRadialGradient(cx, cy - 10 + breathe, 0, cx, cy - 10 + breathe, coreSize);
      coreGrad.addColorStop(0, '#fff');
      const coreHue = isStoryMode ? '#fbbf24' : (inSum > 12 ? '#34d399' : '#10b981');
      coreGrad.addColorStop(0.3, coreHue); coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad; ctx.beginPath(); ctx.arc(cx, cy - 10 + breathe, coreSize, 0, Math.PI * 2); ctx.fill();
    };
    draw();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden bg-[#020202]">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isStoryMode ? 'opacity-20' : 'opacity-10'} pointer-events-none`} style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      <div className="z-10 text-center space-y-4 w-full max-w-5xl flex flex-col h-full">
        <div className="flex-none pt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className={`w-3 h-3 rounded-full ${isActive ? (isStoryMode ? 'bg-amber-400' : 'bg-emerald-400') + ' animate-pulse' : 'bg-slate-800'}`}></div>
             <p className={`text-2xl font-black tracking-tighter uppercase transition-all ${isStoryMode ? 'text-amber-200' : 'text-white'}`}>
               Sarjo AI {isStoryMode ? 'Master Weaver' : 'Neural Assistant'}
             </p>
             {isSyncing && <div className="text-[10px] font-mono text-cyan-400 animate-pulse tracking-widest uppercase bg-cyan-400/10 px-3 py-1 rounded border border-cyan-400/20">Archiving_Memory...</div>}
          </div>
          <div className="text-[10px] font-mono text-slate-500 tracking-[0.4em] uppercase">Status: {isActive ? 'Vault_Synced_Live' : status}</div>
        </div>
        <div className="flex-1 relative flex flex-col min-h-0">
          <div className="flex-1 relative flex items-center justify-center">
            <canvas ref={canvasRef} width={900} height={900} className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-[0_0_80px_rgba(14,165,233,0.4)]" />
          </div>
          <div className="h-40 w-full mb-6 mx-auto glass rounded-[2rem] border-white/5 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center px-12 overflow-hidden relative group">
            {currentStreamingText ? (
              <div className="animate-in fade-in slide-in-from-bottom duration-300">
                <p className={`text-2xl md:text-3xl font-black tracking-tight leading-tight uppercase text-center ${currentStreamingText.role === 'Sarjo' ? (isStoryMode ? 'text-amber-100' : 'text-white') : 'text-slate-500 italic'}`}>
                  {currentStreamingText.text}
                </p>
              </div>
            ) : transcription.length > 0 ? (
              <div className="animate-in fade-in duration-500">
                <p className={`text-xl md:text-2xl font-bold tracking-tight leading-tight uppercase text-center opacity-40 ${transcription[transcription.length-1].role === 'Sarjo' ? (isStoryMode ? 'text-amber-100' : 'text-white') : 'text-slate-600 italic'}`}>
                  {transcription[transcription.length-1].text}
                </p>
              </div>
            ) : (
              !isActive && <span className="text-[10px] font-black text-slate-700 tracking-[1em] uppercase">Neural Caption Terminal Ready</span>
            )}
          </div>
        </div>
        <div className="flex-none pb-12 flex flex-col gap-6 items-center">
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex p-1.5 glass rounded-2xl border-white/10 bg-white/5">
              {(['en', 'mr', 'hi'] as const).map((lang) => (
                <button key={lang} disabled={isActive} onClick={() => setLanguage(lang)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${language === lang ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{lang}</button>
              ))}
            </div>
            <button onClick={() => { if(isActive) stopSession(); setIsStoryMode(!isStoryMode); }} className={`px-8 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border flex items-center gap-2 ${isStoryMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'glass border-white/10 text-slate-500'}`}>📖 {isStoryMode ? 'Story Mode' : 'Standard Mode'}</button>
          </div>
          {!isActive ? (
            <button onClick={startLiveSession} className="group relative w-80 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.5em] bg-white text-black hover:bg-cyan-400 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl">Initialize Infinite Link</button>
          ) : (
            <button onClick={stopSession} className="w-80 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.5em] border-2 border-red-500 bg-red-500/20 text-red-500 hover:bg-red-600 hover:text-white transition-all animate-pulse">Terminate Link</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;
