
// Fix: Use process.env.API_KEY directly without fallback to ensure the correct project key is used for video generation.
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const Director: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const generateVideo = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setVideoUrl('');
    setStatus('Initializing cinematic sequence...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      setStatus('Simulating physics and motion...');
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        setStatus(`Rendering frames... ${new Date().toLocaleTimeString()}`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const fetchRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await fetchRes.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.error(error);
      alert("Video production failed. Check your project permissions and quota.");
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-8 rounded-3xl border border-purple-500/10">
        <h2 className="text-3xl font-bold mb-2">Director Mode</h2>
        <p className="text-slate-400 max-w-2xl">Cinematic video generation with temporal consistency. Describe a scene with motion cues and let the engine direct.</p>
        
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A low-angle tracking shot of a dragon landing in a snowy mountain peak..."
            className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 transition-all text-lg"
          />
          <button
            onClick={generateVideo}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-purple-600/20"
          >
            {loading ? 'Production Active' : 'Start Production'}
          </button>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden min-h-[500px] flex items-center justify-center relative">
        {videoUrl ? (
          <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain bg-black" />
        ) : (
          <div className="text-center text-slate-500 p-8">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-lg mb-2">Director awaits your script</p>
            <p className="text-sm opacity-60">High-fidelity 1080p generation can take 2-3 minutes.</p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{status}</h3>
            <p className="text-slate-400 text-sm max-w-md">Our neural render farm is processing your request. Please do not close this window.</p>
            <div className="mt-8 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 animate-[loading_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Director;
