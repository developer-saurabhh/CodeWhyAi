import React from 'react';
import {
  Settings,
  Activity,
  Cpu,
  Database,
  ShieldCheck,
  Award,
  BookOpen,
  Terminal,
} from 'lucide-react';
import { HealthCard } from '../HealthCard';
import { HealthCheckState } from '../../types';

interface SettingsPageProps {
  healthState: HealthCheckState;
  onRefreshHealth: () => void;
  onOpenPitchDeck?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  healthState,
  onRefreshHealth,
  onOpenPitchDeck,
}) => {
  const modelStatus = healthState.data?.architecture.llm || 'Backend status unavailable';
  const databaseStatus = healthState.data?.architecture.database || 'Backend status unavailable';
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Page Header */}
      <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36]">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold text-[#F5F5F5]">Settings & System Diagnostics</h1>
        </div>
        <p className="text-xs text-[#969DA8] mt-1 leading-relaxed">
          Runtime infrastructure, connected LLM model configuration, and backend API status.
        </p>
      </div>

      {/* Backend API Health Check Card */}
      <HealthCard healthState={healthState} onRefresh={onRefreshHealth} />

      {/* Architecture & AI Configuration */}
      <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36] space-y-4">
        <h3 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
          AI & Graph Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-[#0B0D10] border border-[#272D36] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#969DA8]">Reasoning Engine</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-sm font-semibold text-[#F5F5F5] font-mono">Gemini 2.5 Flash</div>
            <p className="text-[11px] text-[#969DA8] leading-relaxed">
              {modelStatus}. An answer is labeled Gemini only when a model call returns claims that pass source validation.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0B0D10] border border-[#272D36] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#969DA8]">Knowledge Graph</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-semibold text-[#F5F5F5] font-mono">Session Repository Index</div>
            <p className="text-[11px] text-[#969DA8] leading-relaxed">
              {databaseStatus}. Live repository records are held in bounded server memory until they expire or the process restarts.
            </p>
          </div>
        </div>
      </div>

      {/* Hackathon Judge Presentation Deck */}
      {onOpenPitchDeck && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-950/40 to-violet-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-[#F5F5F5]">HackFront India 2026 Presentation</h3>
            </div>
            <p className="text-xs text-[#969DA8] leading-relaxed">
              Launch the 5-slide interactive pitch deck summarizing problem, architecture, graph modeling, and anti-hallucination checks.
            </p>
          </div>

          <button
            onClick={onOpenPitchDeck}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
          >
            <span>Open Pitch Deck</span>
          </button>
        </div>
      )}
    </div>
  );
};
