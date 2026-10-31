import React from 'react';
import { GitBranch, ShieldCheck, Terminal, Sparkles } from 'lucide-react';

interface HeaderProps {
  isBackendHealthy: boolean;
  activeRepoName?: string | null;
  onReset?: () => void;
  onOpenPitchDeck?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isBackendHealthy,
  activeRepoName,
  onReset,
  onOpenPitchDeck,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand & Project Info */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <GitBranch className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base text-zinc-100 tracking-tight">CodeWhy AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Hackathon prototype
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">HackFront India 2026 • AI & Developer Tools</p>
          </div>
        </div>

        {/* Status Badges & Action Buttons */}
        <div className="flex items-center space-x-3">
          {activeRepoName && (
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
              <span className="text-zinc-500">Repo:</span>
              <span className="text-emerald-400 font-semibold truncate max-w-[200px]">{activeRepoName}</span>
            </div>
          )}

          {onOpenPitchDeck && (
            <button
              onClick={onOpenPitchDeck}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/40 text-xs text-emerald-300 hover:text-emerald-200 transition-colors shadow-sm shadow-emerald-500/10 cursor-pointer"
              title="Open Hackathon Pitch Presentation Deck"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium">Pitch Deck</span>
            </button>
          )}

          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${
              isBackendHealthy
                ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/50 border-amber-500/30 text-amber-300'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{isBackendHealthy ? 'API Online' : 'Connecting...'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
