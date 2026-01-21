
import React, { useState, useRef, useEffect } from 'react';

interface UnifiedPromptBoxProps {
  onSendMessage: (message: string, files: File[], config: { model: string; research: boolean; extension?: string }) => void;
  loading: boolean;
  activeMode: string;
  onVoiceTrigger?: () => void;
}

const EXTENSIONS = [
  { id: 'gmail', label: 'Gmail', icon: '✉️', description: 'Summarize or search emails' },
  { id: 'drive', label: 'Drive', icon: '📁', description: 'Access your Google Drive files' },
  { id: 'youtube', label: 'YouTube', icon: '📺', description: 'Find and analyze videos' },
  { id: 'docs', label: 'Google Docs', icon: '📝', description: 'Edit or find documents' },
];

const UnifiedPromptBox: React.FC<UnifiedPromptBoxProps> = ({ onSendMessage, loading, activeMode, onVoiceTrigger }) => {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-flash-lite-latest');
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [showExtensions, setShowExtensions] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && files.length === 0) || loading) return;
    onSendMessage(input, files, { 
      model: selectedModel, 
      research: isResearchMode,
      extension: selectedExtension || undefined
    });
    setInput('');
    setFiles([]);
    setSelectedExtension(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Simple @ detection
    if (value.endsWith('@')) {
      setShowExtensions(true);
    } else if (!value.includes('@')) {
      setShowExtensions(false);
    }
  };

  const selectExtension = (ext: string) => {
    setSelectedExtension(ext);
    setInput(input.replace(/@$/, `@${ext} `));
    setShowExtensions(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 10));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-6 relative">
      {/* Extensions Popover */}
      {showExtensions && (
        <div className="absolute bottom-full left-4 mb-2 w-64 glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-3 border-b border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Extensions
          </div>
          <div className="max-h-60 overflow-y-auto">
            {EXTENSIONS.map(ext => (
              <button
                key={ext.id}
                onClick={() => selectExtension(ext.label)}
                className="w-full flex items-center gap-3 p-3 hover:bg-blue-600/20 text-left transition-colors group"
              >
                <span className="text-xl">{ext.icon}</span>
                <div>
                  <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400">@{ext.label}</div>
                  <div className="text-[10px] text-slate-500">{ext.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-3xl border border-white/10 shadow-2xl transition-all focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20">
        
        {/* File Preview Area */}
        {files.length > 0 && (
          <div className="p-4 flex flex-wrap gap-2 border-b border-white/5">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 group">
                <span className="text-xs text-slate-300 truncate max-w-[120px]">{file.name}</span>
                <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-2 flex flex-col gap-2">
          <div className="flex items-end gap-1 px-2">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-2xl hover:bg-white/5 text-slate-400 transition-colors"
              title="Add files (PDF, Images, etc.)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />

            <button 
              type="button"
              onClick={onVoiceTrigger}
              className="p-3 rounded-2xl hover:bg-blue-600/10 text-slate-400 hover:text-blue-400 transition-colors"
              title="Enter Real-time Voice Mode"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v5a3 3 0 01-6 0V7a3 3 0 013-3z" /></svg>
            </button>

            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder={`Ask Sarjo anything in ${activeMode} Mode... Type @ for tools.`}
              rows={1}
              className="flex-1 bg-transparent border-none focus:ring-0 py-3 text-slate-200 placeholder:text-slate-500 resize-none max-h-48 overflow-y-auto"
            />

            <div className="flex items-center gap-1">
               <button
                type="submit"
                disabled={loading || (!input.trim() && files.length === 0)}
                className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:bg-slate-700 text-white transition-all shadow-lg shadow-blue-600/20"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              </button>
            </div>
          </div>

          {/* Quick Settings Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-slate-500 border-none focus:ring-0 cursor-pointer hover:text-slate-300"
                >
                  <option value="gemini-flash-lite-latest">Gemini Lite (Ultra Fast)</option>
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast)</option>
                  <option value="gemini-3-pro-preview">Gemini 3 Pro (Smart)</option>
                </select>
              </div>

              <div className="h-4 w-[1px] bg-white/10"></div>

              <button 
                type="button"
                onClick={() => setIsResearchMode(!isResearchMode)}
                className={`flex items-center gap-1.5 transition-colors ${isResearchMode ? 'text-blue-400' : 'text-slate-500 hover:text-slate-400'}`}
              >
                <div className={`w-3 h-3 rounded-full border ${isResearchMode ? 'bg-blue-500 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'border-slate-600'}`}></div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Deep Research</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
               <button onClick={onVoiceTrigger} title="Gemini Live Waveform" className="text-slate-600 hover:text-blue-400 transition-colors">
                 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M4 12h1v2H4v-2zm3-3h1v8H7V9zm3-3h1v14h-1V6zm3 3h1v8h-1V9zm3 3h1v2h-1v-2z" />
                 </svg>
               </button>
               <span className="text-[10px] font-mono text-slate-600">Multimodal Command Center</span>
            </div>
          </div>
        </form>
      </div>
      <p className="text-center text-[10px] text-slate-600 mt-3 uppercase tracking-tighter">
        Integrated with Workspace & Real-time Web Search
      </p>
    </div>
  );
};

export default UnifiedPromptBox;
