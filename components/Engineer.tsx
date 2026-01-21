
// Fix: Use process.env.API_KEY directly to satisfy the mandatory SDK named parameter initialization requirement.
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const Engineer: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeOutput, setCodeOutput] = useState('');

  const generateCode = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setCodeOutput('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Sarjo AI Engineer. 10X SPEED. Direct code output only. No preamble. Wrap in triple backticks. Created by Sarvadnya Joshi.",
          temperature: 0.0,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      setCodeOutput(response.text || '');
    } catch (error) {
      console.error(error);
      setCodeOutput("Logic link failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      <div className="glass p-6 rounded-3xl border-white/5">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">💻</span>
          Engineering Terminal <span className="text-[10px] ml-2 text-emerald-500/50 uppercase tracking-widest">Speed_Link_Active</span>
        </h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe code logic..."
          className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-emerald-500 font-mono text-sm"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={generateCode}
            disabled={loading}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-xs"
          >
            {loading ? 'Compiling...' : 'Execute Build'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2 rounded-t-3xl">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
            <span className="ml-4 text-xs font-mono text-slate-500 uppercase tracking-widest">Output_Log</span>
        </div>
        <div className="flex-1 p-6 overflow-y-auto font-mono text-sm bg-black/20 glass rounded-b-3xl">
            {codeOutput ? (
              <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                {codeOutput}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 italic">
                <span className="text-4xl mb-4">⚡</span>
                <p>Awaiting engineering instructions...</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Engineer;
