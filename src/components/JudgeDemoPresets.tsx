import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle2,
  HelpCircle,
  FileCode,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { JUDGE_DEMO_SCENARIOS, JudgeDemoScenario } from '../utils/demoScenarios';

interface JudgeDemoPresetsProps {
  onSelectScenario: (scenario: JudgeDemoScenario) => void;
  activeScenarioId?: string;
  isCompact?: boolean;
}

export const JudgeDemoPresets: React.FC<JudgeDemoPresetsProps> = ({
  onSelectScenario,
  activeScenarioId,
  isCompact = false,
}) => {
  return (
    <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-800 relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-zinc-100">Hackathon Judge Demo Scenarios</h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                1-Click Live Test
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Curated architectural case studies with zero network latency & anti-hallucination guard validation
            </p>
          </div>
        </div>
      </div>

      <div className={`grid gap-3 mt-4 relative z-10 ${isCompact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {JUDGE_DEMO_SCENARIOS.map((scenario) => {
          const isSelected = activeScenarioId === scenario.id;
          const isNegative = scenario.expectedStatus === 'Insufficient Evidence';

          return (
            <div
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-500 text-zinc-100 shadow-lg shadow-emerald-500/10'
                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                      isNegative
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {scenario.badge}
                  </span>

                  <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]">
                    {scenario.repoPackageName === 'express' ? 'express' : 'payment-svc'}
                  </span>
                </div>

                <p className="text-xs font-semibold text-zinc-200 line-clamp-1 group-hover:text-emerald-300 transition-colors">
                  {scenario.title}
                </p>

                <p className="text-[11px] font-mono text-emerald-400/90 line-clamp-2 bg-zinc-900/80 p-2 rounded-lg border border-zinc-800/80">
                  "{scenario.question}"
                </p>

                {!isCompact && (
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {scenario.pitchSummary}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-1.5 font-mono">
                  {isNegative ? (
                    <span className="text-rose-400 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Strict Refusal</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Evidence score ≥ {scenario.minConfidence}</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-zinc-950 font-semibold'
                      : 'bg-zinc-800 text-zinc-200 group-hover:bg-emerald-500 group-hover:text-zinc-950'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isSelected ? 'Active' : 'Test'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
