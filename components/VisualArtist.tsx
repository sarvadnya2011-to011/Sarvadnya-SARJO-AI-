
// Fix: Use process.env.API_KEY directly without fallback as per API Key selection rules.
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const VisualArtist: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const generateImage = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setImages([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Step 1: Instant Refined Prompt
      const refinerResponse = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest', // Fastest for refinement
        contents: `Refine for high-fidelity image: "${prompt}". Return ONLY the prompt string.`,
        config: {
          temperature: 0.0,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      const betterPrompt = refinerResponse.text || prompt;
      setRefinedPrompt(betterPrompt);

      // Step 2: Generate Image
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: betterPrompt }],
        },
        config: {
          imageConfig: { aspectRatio: '1:1' }
        }
      });

      const imageUrls: string[] = [];
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrls.push(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
      setImages(imageUrls);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 p-8 rounded-3xl border border-blue-500/10">
        <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Visual Artist</h2>
        <p className="text-slate-400 max-w-2xl text-sm font-medium">10X Neural Rendering Active. Instant refinement and generation.</p>
        
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a visual concept..."
            className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-all text-lg font-medium"
          />
          <button
            onClick={generateImage}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest text-xs"
          >
            {loading ? 'Rendering...' : 'Generate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-6 rounded-3xl min-h-[400px] flex items-center justify-center relative">
          {images.length > 0 ? (
            <img src={images[0]} alt="Generated" className="w-full h-full object-cover rounded-2xl shadow-2xl" />
          ) : (
            <div className="text-center text-slate-500">
              <div className="text-6xl mb-4 opacity-20">🖼️</div>
              <p className="font-bold uppercase tracking-widest text-xs">Neural Canvas Waiting</p>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-blue-400 font-mono text-xs animate-pulse tracking-widest font-bold">INSTANT_RENDER_v2</p>
            </div>
          )}
        </div>

        <div className="glass p-6 rounded-3xl">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Refined Engine Data</h3>
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs text-blue-300 min-h-[100px] leading-relaxed">
            {refinedPrompt || "Awaiting neural processing..."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualArtist;
