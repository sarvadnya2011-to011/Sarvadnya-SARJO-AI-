
import React from 'react';
import { StudioMode, ActiveAlarm } from '../types';

interface SidebarProps {
  activeMode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  alarms?: ActiveAlarm[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeMode, onModeChange, alarms = [] }) => {
  const navItems = [
    { id: StudioMode.HOME, label: 'Home', icon: '🏠', desc: 'Neural Core' },
    { id: StudioMode.NORMAL_CHAT, label: 'Normal Chat', icon: '💬', desc: 'Conversational AI' },
    { id: StudioMode.ANALYZED, label: 'Analyzed', icon: '📊', desc: 'Data & Insights' },
    { id: StudioMode.CREATIVE, label: 'Creative', icon: '🎨', desc: 'Visual Generation' },
    { id: StudioMode.CODE, label: 'Code', icon: '💻', desc: 'Engineering Hub' },
    { id: StudioMode.VISION, label: 'Vision-to-Action', icon: '👁️', desc: 'Image Analysis' },
    { id: StudioMode.LIVE, label: 'Live Assistant', icon: '🎙️', desc: 'Real-time Voice' },
    { id: StudioMode.ONE_TO_ONE, label: 'Live 1:1', icon: '📹', desc: 'Multimodal Vision' },
    { id: StudioMode.ABOUT, label: 'About Creator', icon: '👑', desc: 'Master Architect' },
  ];

  return (
    <aside className="w-72 hidden lg:flex flex-col border-r border-white/5 glass z-50">
      <div className="p-6 flex-1 overflow-y-auto">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Studio Modules</h2>
        <nav className="space-y-2 mb-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onModeChange(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group ${
                activeMode === item.id 
                  ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400' 
                  : 'hover:bg-white/5 border border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <div>
                <div className="font-semibold text-sm">{item.label}</div>
                <div className="text-[10px] opacity-60 uppercase tracking-tighter">{item.desc}</div>
              </div>
            </button>
          ))}
        </nav>

        {alarms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 mb-4 px-4">Neural Alarms</h2>
            <div className="space-y-2">
              {alarms.map((alarm) => (
                <div key={alarm.id} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-amber-200 uppercase">{alarm.time}</div>
                    <div className="text-[9px] text-amber-500 font-bold uppercase truncate max-w-[120px]">{alarm.label}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-500/70 mb-4 px-4">Chrome Extensions</h2>
          <div className="grid grid-cols-2 gap-2">
            {['Gmail', 'Drive', 'YouTube', 'Docs'].map(ext => (
              <div key={ext} className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
                 <div className="text-[9px] font-black text-blue-300 uppercase">{ext}</div>
                 <div className="text-[8px] text-blue-500 uppercase mt-1">Sync_On</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-6 border-t border-white/5">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/20">
          <p className="text-xs text-blue-300/80 mb-2">Engine Health</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-mono font-bold text-emerald-400">NOMINAL</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
