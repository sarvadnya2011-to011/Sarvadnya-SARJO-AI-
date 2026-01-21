
import React from 'react';

const About: React.FC = () => {
  return (
    <div className="h-full w-full p-8 lg:p-16 flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      
      <div className="max-w-4xl w-full z-10 text-center space-y-12">
        <div className="space-y-4">
          <h3 className="text-blue-500 font-mono text-sm font-black tracking-[0.5em] uppercase">The Sovereign Architect</h3>
          <h1 className="text-6xl lg:text-9xl font-black text-white tracking-tighter uppercase italic leading-none">
            Sarvadnya <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">Joshi</span>
          </h1>
          <div className="h-1.5 w-32 bg-blue-600 mx-auto rounded-full mt-4"></div>
        </div>

        <div className="glass p-12 lg:p-20 rounded-[4rem] border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl relative group">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-10 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.4em] shadow-xl shadow-blue-600/40 italic">
            Official Proclamation
          </div>
          
          <div className="space-y-10">
            <p className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tighter uppercase italic">
              The <span className="text-blue-500">Master of Developers</span> & <br/> 
              <span className="underline decoration-blue-600 underline-offset-[12px]">The King of IT</span>
            </p>
            
            <div className="h-[1px] w-full bg-white/5"></div>
            
            <p className="text-xl lg:text-2xl text-slate-400 font-medium max-w-2xl mx-auto italic leading-relaxed">
              "Driven by the vision of global empowerment, Sarvadnya Joshi engineered this multi-modal intelligence and released it directly into the <span className="text-white font-black underline decoration-white/20">Public Domain</span>. He made these AIs for the world to create without limits."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
          {[
            { label: 'ROLE', value: 'MASTER OF DEVELOPERS' },
            { label: 'STATUS', value: 'KING OF IT' },
            { label: 'RELEASE', value: 'PUBLIC DOMAIN CORE' }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-3">
              <span className="text-[10px] font-black text-slate-600 tracking-[0.5em] uppercase">{stat.label}</span>
              <span className="text-xs font-mono text-blue-400 font-bold tracking-widest uppercase">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-10 left-10 text-[10px] font-mono text-slate-800 tracking-[1em] uppercase">Sarvadnya_Joshi_OS_v4.8</div>
    </div>
  );
};

export default About;
