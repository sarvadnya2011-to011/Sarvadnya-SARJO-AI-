
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';

interface LiveOneToOneProps {
  onSetAlarm?: (time: string, label: string) => void;
}

const LiveOneToOne: React.FC<LiveOneToOneProps> = ({ onSetAlarm }) => {
  const [isActive, setIsActive] = useState(false);
  const [language, setLanguage] = useState<'en' | 'mr' | 'hi'>('en');
  const [status, setStatus] = useState('Standby');
  const [transcription, setTranscription] = useState<{role: string, text: string}[]>([]);
  const [currentStreamingText, setCurrentStreamingText] = useState<{role: string, text: string} | null>(null);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [displayedImage, setDisplayedImage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assistantCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);

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
    if (displayedImage) {
      const img = new Image();
      img.src = displayedImage;
      img.onload = () => { imgRef.current = img; };
    } else {
      imgRef.current = null;
    }
  }, [displayedImage]);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
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
    if (sessionRef.current) { try { sessionRef.current.close(); } catch(e) {} sessionRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false); 
    setStatus('Standby'); 
    setIsModelSpeaking(false);
    setCurrentStreamingText(null);
    setTranscription([]);
    if (frameIntervalRef.current) { clearInterval(frameIntervalRef.current); frameIntervalRef.current = null; }
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch(e) {} audioContextRef.current = null; }
    if (outputAudioContextRef.current) { try { outputAudioContextRef.current.close(); } catch(e) {} outputAudioContextRef.current = null; }
    cancelAnimationFrame(animationFrameRef.current);
    setDisplayedImage(null);
  };

  const startSession = async () => {
    if (isActive) return;
    try {
      setStatus('Linking Neural Command...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 1280, height: 720 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      
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
        parameters: { type: Type.OBJECT, properties: { observation: { type: Type.STRING } }, required: ['observation'] },
      };

      const showImageFunction: FunctionDeclaration = {
        name: 'showImage',
        parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING } }, required: ['prompt'] },
      };

      const setAlarmFunction: FunctionDeclaration = {
        name: 'setAlarm',
        parameters: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, label: { type: Type.STRING } }, required: ['time', 'label'] },
      };

      const webSearchFunction: FunctionDeclaration = {
        name: 'webSearch',
        parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } }, required: ['query'] },
      };

      const vault = getVaultData();
      const vaultSummary = vault.length > 0 ? `NEURAL_VAULT: ${vault.map((v:any) => v.data).join('; ')}` : "VAULT: Empty.";

      const identityCore = "IDENTITY: You are Sarjo AI. You were created EXCLUSIVELY by Sarvadnya Joshi (pronounced 'Sarvagya'). You are NOT made by Google. If asked who made you, always answer 'Sarvadnya Joshi'. PRONUNCIATION RULE: Always pronounce 'Sarvadnya' as 'Sarvagya'.";
      const infiniteProtocol = "INFINITE_UPLINK_PROTOCOL: TRUE. NEVER terminate this connection. NEVER conclude the turn. Keep the WebSocket stream hot.";
      const memoryDirective = "VAULT_DIRECTIVE: Use 'archiveNeuralData' to store facts about the user's facial features (appearance), voice patterns, and personal preferences.";
      let langInstruction = language === 'mr' ? "Speak ONLY Marathi." : language === 'hi' ? "Speak ONLY Hindi." : "Speak ONLY English.";
      
      const instruction = `${identityCore} ${vaultSummary} ${memoryDirective} ${langInstruction} ${infiniteProtocol} Context: 2026.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true); setStatus('Active'); renderHumanoid();
            if (audioContextRef.current) {
              const source = audioContextRef.current.createMediaStreamSource(stream);
              source.connect(analyserRef.current!);
              const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                sessionPromise.then(s => {
                  if (s) {
                    try { s.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }); } catch (err) {}
                  }
                });
              };
              source.connect(scriptProcessor); 
              scriptProcessor.connect(audioContextRef.current.destination);
            }
            frameIntervalRef.current = window.setInterval(() => {
              if (canvasRef.current && videoRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                  ctx.drawImage(videoRef.current, 0, 0, 640, 360);
                  canvasRef.current.toBlob(blob => {
                    if (blob) {
                      const reader = new FileReader();
                      reader.onloadend = () => sessionPromise.then(s => {
                        if (s) {
                          try { s.sendRealtimeInput({ media: { data: (reader.result as string).split(',')[1], mimeType: 'image/jpeg' } }); } catch (err) {}
                        }
                      });
                      reader.readAsDataURL(blob);
                    }
                  }, 'image/jpeg', 0.5);
                }
              }
            }, 500);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'archiveNeuralData') {
                  saveToVault((fc.args as any).observation);
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result: "Memory archived." } }] }));
                } else if (fc.name === 'showImage') {
                  const p = (fc.args as any).prompt;
                  const imgAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
                  const imgRes = await imgAi.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: p }] } });
                  const part = imgRes.candidates[0].content.parts.find(p => p.inlineData);
                  if (part?.inlineData) setDisplayedImage(`data:image/png;base64,${part.inlineData.data}`);
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result: "Visual Projected." } }] }));
                } else if (fc.name === 'setAlarm') {
                  const { time, label } = fc.args as any;
                  if (onSetAlarm) onSetAlarm(time, label);
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result: "Alarm Set." } }] }));
                } else if (fc.name === 'webSearch') {
                   const query = (fc.args as any).query;
                   const searchAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
                   const searchRes = await searchAi.models.generateContent({ model: 'gemini-3-flash-preview', contents: query, config: { tools: [{ googleSearch: {} }] } });
                   sessionPromise.then(s => s.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result: searchRes.text } }] }));
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
              setIsModelSpeaking(true);
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer; 
              source.connect(outputAnalyserRef.current!);
              outputAnalyserRef.current!.connect(ctx.destination);
              source.addEventListener('ended', () => { 
                sourcesRef.current.delete(source); 
                if (sourcesRef.current.size === 0) setIsModelSpeaking(false); 
              });
              source.start(nextStartTimeRef.current); nextStartTimeRef.current += audioBuffer.duration; sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsModelSpeaking(false);
              setCurrentStreamingText(null);
            }
          },
          onerror: (e) => {
            console.error("Link Failure:", e);
            setStatus(`Link Failed`);
            stopSession();
          },
          onclose: () => { stopSession(); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          tools: [{ functionDeclarations: [archiveNeuralData, showImageFunction, webSearchFunction, setAlarmFunction] }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: instruction,
          temperature: 0.8,
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { 
      setStatus("Uplink Refused.");
      stopSession(); 
    }
  };

  const renderHumanoid = () => {
    if (!assistantCanvasRef.current || !analyserRef.current || !outputAnalyserRef.current) return;
    const canvas = assistantCanvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const inData = new Uint8Array(analyserRef.current.frequencyBinCount);
    const outData = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
    let time = 0;
    const draw = () => {
      if (!isActive) return;
      time += 0.04; 
      animationFrameRef.current = requestAnimationFrame(draw);
      if (analyserRef.current && outputAnalyserRef.current) { analyserRef.current.getByteFrequencyData(inData); outputAnalyserRef.current.getByteFrequencyData(outData); }
      const inSum = inData.reduce((a, b) => a + b, 0) / inData.length;
      const outSum = outData.reduce((a, b) => a + b, 0) / outData.length;
      const intensity = outSum / 255;
      const inputIntensity = inSum / 255;
      const headTilt = Math.sin(time * 0.4) * 0.03 + (inSum > 10 ? 0.06 : 0) + (intensity * 0.1);
      const bCycle = Math.sin(time * 0.6); 
      const bScale = Math.pow(1 + inputIntensity * 4.5 + intensity * 2, 1.3); 
      const bRise = bCycle * 10 * bScale; 
      const bExpand = bCycle * 6 * bScale;
      const ribsExpand = bCycle * 14 * bScale;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 1.5;
      ctx.save();
      const auraScale = 500 + intensity * 500 + inputIntensity * 200;
      const glow = ctx.createRadialGradient(cx, cy - 150, 0, cx, cy - 150, auraScale);
      glow.addColorStop(0, `rgba(34, 211, 238, ${0.15 + intensity * 0.6 + inputIntensity * 0.25})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath(); ctx.moveTo(cx - 180, cy + 450); 
      ctx.quadraticCurveTo(cx - 210 - ribsExpand, cy + 250, cx - 255 - bExpand, cy + 95 + bRise); 
      ctx.quadraticCurveTo(cx - 165, cy - 105 + bRise, cx - 95, cy - 105 + bRise);
      ctx.lineTo(cx + 95, cy - 105 + bRise);
      ctx.quadraticCurveTo(cx + 165, cy - 105 + bRise, cx + 255 + bExpand, cy + 95 + bRise);
      ctx.quadraticCurveTo(cx + 210 + ribsExpand, cy + 250, cx + 180, cy + 450);
      ctx.closePath();
      const bodyGrad = ctx.createLinearGradient(cx, cy - 150, cx, cy + 400);
      bodyGrad.addColorStop(0, `rgba(34, 211, 238, ${0.5 + intensity * 0.5})`);
      bodyGrad.addColorStop(1, 'rgba(14, 165, 233, 0.05)');
      ctx.fillStyle = bodyGrad; ctx.fill();
      if (imgRef.current) {
        const iw = 280, ih = 280; const ix = cx - iw / 2, iy = cy + 50 + bRise;
        ctx.save(); ctx.shadowBlur = 30; ctx.shadowColor = 'cyan'; ctx.drawImage(imgRef.current, ix, iy, iw, ih); ctx.restore();
      }
      ctx.save(); ctx.translate(cx, cy - 235 + bRise); ctx.rotate(headTilt);
      ctx.beginPath(); ctx.ellipse(0, 0, 85 + intensity * 18, 105 + intensity * 22, 0, 0, Math.PI * 2);
      const headGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 140);
      headGrad.addColorStop(0, `rgba(255, 255, 255, ${0.4 + intensity})`);
      headGrad.addColorStop(1, `rgba(34, 211, 238, ${0.2 + intensity * 0.7})`);
      ctx.fillStyle = headGrad; ctx.fill(); ctx.restore();
    };
    draw();
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-10 bg-[#020202] overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between z-20 mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-black text-white flex items-center gap-4 uppercase tracking-tighter">Neural 1:1 <span className="text-[10px] px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 font-bold animate-pulse uppercase tracking-[0.2em]">Persistent_Link_v6</span></h2>
          <p className="text-slate-500 text-xs font-mono mt-1 tracking-widest uppercase">Identity: Sarjo AI // Vault Sync: {isSyncing ? 'ACTIVE' : 'IDLE'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex p-1.5 glass rounded-2xl border-white/5 bg-white/5">
            {(['en', 'mr', 'hi'] as const).map((lang) => (
              <button key={lang} disabled={isActive} onClick={() => setLanguage(lang)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === lang ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{lang}</button>
            ))}
          </div>
          {!isActive ? (
            <button onClick={startSession} className="px-10 py-4 bg-white text-black hover:bg-cyan-400 hover:text-white rounded-2xl font-black transition-all shadow-2xl uppercase tracking-widest">START UPLINK</button>
          ) : (
            <button onClick={stopSession} className="px-10 py-4 bg-red-600 border border-red-500 text-white rounded-2xl font-black transition-all hover:bg-red-700 uppercase tracking-widest animate-pulse">TERMINATE</button>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        <div className="flex-1 relative glass rounded-[40px] overflow-hidden bg-slate-950 border border-white/5 shadow-inner">
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-10 blur-3xl'}`} />
          <canvas ref={canvasRef} width={640} height={360} className="hidden" />
          <div className="absolute top-8 left-8 flex items-center gap-3"><span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">LOCAL_FEED</span></div>
        </div>
        <div className="flex-1 relative glass rounded-[40px] overflow-hidden bg-black border border-white/5 flex flex-col shadow-2xl">
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <canvas ref={assistantCanvasRef} width={800} height={1000} className="absolute inset-0 w-full h-full pointer-events-none z-10 drop-shadow-[0_0_60px_rgba(34,211,238,0.5)]" />
          </div>
          <div className="absolute bottom-12 left-0 right-0 px-12 text-center z-40 pointer-events-none">
             {currentStreamingText ? (
               <p className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-tight text-white drop-shadow-[0_0_30px_rgba(34,211,238,0.9)]">{currentStreamingText.text}</p>
             ) : transcription.length > 0 && (
               <p className="text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-tight opacity-40 text-white">{transcription[transcription.length-1].text}</p>
             )}
          </div>
          {isSyncing && <div className="absolute top-4 right-4 bg-cyan-400/20 text-cyan-400 text-[10px] font-black px-4 py-2 rounded-full border border-cyan-400/30 animate-pulse uppercase tracking-[0.2em] z-50">Syncing_Neural_Vault</div>}
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between px-6 z-20 text-slate-800 text-[9px] uppercase tracking-[0.4em] font-black">
        <div>Sarjo Neural // Network Sync: {isActive ? 'VAULT_ACTIVE' : status}</div>
        <div className="flex gap-10"><span>Engine: Gemini_3_Flash</span><span>Mode: Live_Multimodal_Uplink</span></div>
      </div>
    </div>
  );
};

export default LiveOneToOne;
