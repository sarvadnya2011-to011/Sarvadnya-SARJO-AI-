
import React, { useState, useEffect, useRef } from 'react';
import { StudioMode, ActiveAlarm } from './types';
import Sidebar from './components/Sidebar';
import Analyzed from './components/Analyzed';
import Creative from './components/Creative';
import CodeGeneration from './components/CodeGeneration';
import VisionToAction from './components/VisionToAction';
import LiveAssistant from './components/LiveAssistant';
import LiveOneToOne from './components/LiveOneToOne';
import About from './components/About';
import Home from './components/Home';
import NormalChat from './components/NormalChat';

const AuthModal: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState<'choice' | 'redirecting' | 'handshake' | 'granted'>('choice');
  const [progress, setProgress] = useState(0);

  const handleGoogleSignIn = () => {
    setStep('redirecting');
    
    // Phase 1: Simulated "Moving to Google Sign In Screen"
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setStep('handshake'), 400);
      }
      setProgress(p);
    }, 150);
  };

  useEffect(() => {
    if (step === 'handshake') {
      // Phase 2: Simulated "Handshake with Real Account"
      setTimeout(() => {
        setStep('granted');
      }, 1500);
    }
    if (step === 'granted') {
      // Final Phase: Enter Studio
      setTimeout(() => {
        onComplete();
      }, 1200);
    }
  }, [step, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] animate-in fade-in duration-700">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      <div className={`absolute inset-0 bg-blue-600/5 transition-opacity duration-1000 ${step !== 'choice' ? 'opacity-20' : 'opacity-0'}`}></div>

      <div className="relative w-full max-w-lg mx-4">
        {step === 'choice' && (
          <div className="glass p-12 rounded-[4rem] border-white/10 bg-white/5 shadow-2xl flex flex-col items-center text-center space-y-10 animate-in zoom-in-95 duration-500">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img 
                src="logo.png" 
                alt="Logo" 
                className="w-32 h-auto relative z-10 drop-shadow-2xl"
                onError={(e) => {
                  e.currentTarget.src = 'https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/sarjo-logo.png';
                }}
              />
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Neural Link</h2>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] leading-relaxed">
                Uplink to Sarjo AI Studio Core
              </p>
            </div>

            <div className="w-full space-y-4">
              <button 
                onClick={handleGoogleSignIn}
                className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-4 hover:bg-blue-500 hover:text-white transition-all transform active:scale-95 shadow-2xl group"
              >
                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>

              <button 
                onClick={onComplete}
                className="w-full py-5 bg-transparent border border-white/10 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[12px] hover:bg-white/5 transition-all transform active:scale-95"
              >
                Continue with Email
              </button>
            </div>

            <div className="w-full flex justify-start pt-4">
              <button 
                onClick={onComplete}
                className="text-[10px] font-black text-slate-700 hover:text-blue-500 transition-all uppercase tracking-[0.5em] cursor-pointer"
              >
                Skip Authorization
              </button>
            </div>
          </div>
        )}

        {(step === 'redirecting' || step === 'handshake' || step === 'granted') && (
          <div className="flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-bottom-20 duration-500">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-[2rem]"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-[2rem] animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-black text-blue-400 text-2xl italic tracking-tighter animate-pulse">
                  {step === 'granted' ? '✓' : 'SJ'}
                </span>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                  {step === 'redirecting' ? 'Moving to Google Sign-in' : 
                   step === 'handshake' ? 'Handshake Successful' : 'Access Granted'}
                </h3>
                <p className="text-blue-500 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">
                  {step === 'redirecting' ? 'Establishing Secure Tunnel' : 
                   step === 'handshake' ? 'Syncing Real Account Data' : 'Sarjo Neural Link Ready'}
                </p>
              </div>

              {step === 'redirecting' && (
                <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden mx-auto">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}

              <p className="text-slate-500 text-[10px] uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                {step === 'redirecting' ? 'Connecting to accounts.google.com via encrypted gateway...' : 
                 step === 'handshake' ? 'Identity verified. Uploading user profile to Studio Core...' : 
                 'Welcome to the future of creation, Master.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Clock: React.FC = () => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      const istString = new Intl.DateTimeFormat('en-IN', options).format(new Date());
      setTime(istString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">IST (UTC+5:30)</span>
      <span className="text-sm font-mono font-medium text-blue-400 tabular-nums">{time}</span>
    </div>
  );
};

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<StudioMode>(StudioMode.HOME);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);
  const [alarms, setAlarms] = useState<ActiveAlarm[]>([]);

  const switchToVoice = () => setActiveMode(StudioMode.LIVE);

  const handleSetAlarm = (time: string, label: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAlarms(prev => [...prev, { id, time, label, triggered: false }]);
  };

  const renderContent = () => {
    switch (activeMode) {
      case StudioMode.HOME:
        return <Home />;
      case StudioMode.NORMAL_CHAT:
        return <NormalChat onVoiceTrigger={switchToVoice} onSetAlarm={handleSetAlarm} />;
      case StudioMode.ANALYZED:
        return <Analyzed onVoiceTrigger={switchToVoice} onSetAlarm={handleSetAlarm} />;
      case StudioMode.CREATIVE:
        return <Creative onVoiceTrigger={switchToVoice} />;
      case StudioMode.CODE:
        return <CodeGeneration onVoiceTrigger={switchToVoice} />;
      case StudioMode.VISION:
        return <VisionToAction onVoiceTrigger={switchToVoice} />;
      case StudioMode.LIVE:
        return <LiveAssistant onSetAlarm={handleSetAlarm} />;
      case StudioMode.ONE_TO_ONE:
        return <LiveOneToOne onSetAlarm={handleSetAlarm} />;
      case StudioMode.ABOUT:
        return <About />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden text-slate-200">
      {isAuthModalOpen && <AuthModal onComplete={() => setIsAuthModalOpen(false)} />}
      
      <Sidebar activeMode={activeMode} onModeChange={setActiveMode} alarms={alarms} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 glass z-50">
          <div className="flex items-center gap-3">
            <img 
              src="logo.png" 
              alt="SA" 
              className="w-8 h-8 rounded-lg drop-shadow-lg"
              onError={(e) => {
                e.currentTarget.src = 'https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/sarjo-logo.png';
              }}
            />
            <h1 className="text-xl font-bold tracking-tight">
              Sarjo <span className="text-blue-400">AI Studio</span>
            </h1>
            <div className="ml-4 flex items-center gap-2 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-bold text-blue-400 uppercase tracking-widest">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              Chrome Sync
            </div>
          </div>

          <div className="flex items-center gap-6">
            {alarms.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
                🔔 {alarms.length} ACTIVE ALARMS
              </div>
            )}
            <Clock />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full glass border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className={`w-2 h-2 rounded-full ${activeMode === StudioMode.LIVE || activeMode === StudioMode.ONE_TO_ONE ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></span>
              {activeMode} MODE
            </div>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,_#111_0%,_#0a0a0a_100%)]">
          <div className="h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
