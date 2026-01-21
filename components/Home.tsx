
import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 relative overflow-hidden bg-[#0a0a0a]">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '60px 60px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center text-center space-y-12 animate-in fade-in zoom-in duration-1000">
        
        {/* Greeting Section */}
        <div className="space-y-1 animate-in slide-in-from-top-8 duration-700 delay-200">
           <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
             Hello <span className="text-blue-500">User</span>
           </h1>
           <div className="h-1 w-24 bg-blue-500 mx-auto rounded-full mt-4"></div>
        </div>

        {/* Central Logo Image */}
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity duration-700"></div>
          <img 
            src="https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/sarjo-logo.png" 
            alt="Sarjo AI Studio Logo" 
            className="w-80 h-auto relative z-10 drop-shadow-[0_0_50px_rgba(59,130,246,0.3)] transform hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              // Fallback to local logo.png if the external link doesn't work in user's environment
              e.currentTarget.src = 'logo.png';
            }}
          />
        </div>

        {/* Studio Info */}
        <div className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <p className="text-blue-500 font-mono text-xs font-black uppercase tracking-[0.6em] animate-pulse">Neural Workspace v5.0</p>
          </div>

          <div className="h-px w-32 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto"></div>

          <p className="text-slate-400 text-lg font-medium italic leading-relaxed">
            Welcome to the high-performance, multi-modal creative engine. 
            Engineered by <span className="text-white font-black underline decoration-blue-500 underline-offset-4">Sarvadnya Joshi</span>, 
            this studio provides the world's most direct path from imagination to digital reality.
          </p>
        </div>

        {/* Label Footer */}
        <div className="pt-12">
          <div className="px-10 py-3 rounded-full border border-white/10 glass bg-white/5 backdrop-blur-md">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[1em]">Home Screen</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1">
        <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Public Domain Core</span>
        <span className="text-[9px] font-mono text-slate-800 uppercase tracking-widest">OS_IDENT_SJ_2026</span>
      </div>
    </div>
  );
};

export default Home;
