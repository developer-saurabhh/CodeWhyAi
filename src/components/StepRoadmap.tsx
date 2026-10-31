import React from 'react';
import { CheckCircle2, CircleDot, Clock } from 'lucide-react';

interface PhaseItem {
  id: number;
  title: string;
  desc: string;
  status: 'completed' | 'active' | 'upcoming';
}

const PHASES: PhaseItem[] = [
  { id: 0, title: 'Phase 0: Understand & Plan', desc: 'Architecture, roles, and MVP roadmap alignment', status: 'completed' },
  { id: 1, title: 'Phase 1: Project Setup', desc: 'Frontend + Backend scaffolding & health-check bridge', status: 'completed' },
  { id: 2, title: 'Phase 2: Frontend Foundation', desc: 'Landing UI, repo input, and interactive dashboard', status: 'completed' },
  { id: 3, title: 'Phase 3: GitHub Integration', desc: 'Bounded GitHub REST API index: commits, PRs, issues, README', status: 'completed' },
  { id: 4, title: 'Phase 4: Data Processing', desc: 'Normalized source records and explicit issue references', status: 'completed' },
  { id: 5, title: 'Phase 5: In-Memory Relationship Preview', desc: 'Explicit relationships; no Neo4j persistence or Cypher execution', status: 'completed' },
  { id: 6, title: 'Phase 6: Evidence Retrieval', desc: 'Separate text matches from validated linked records', status: 'completed' },
  { id: 7, title: 'Phase 7: Evidence-Restricted Answers', desc: 'Exact quote validation and insufficient-evidence response', status: 'completed' },
  { id: 8, title: 'Phase 8: Prototype Experience', desc: 'Curated demo source inspector and Markdown report export', status: 'completed' },
  { id: 9, title: 'Phase 9: Testing & Demo Mode', desc: 'Automated unit, API-contract, evidence and component-render checks', status: 'completed' },
  { id: 10, title: 'Phase 10: Final Hackathon Polish', desc: 'Judging script, slides, README, and schema docs', status: 'completed' },
];

export const StepRoadmap: React.FC = () => {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Hackathon Roadmap Progress</h3>
          <p className="text-xs text-zinc-400">Implementation checkpoints for the hackathon prototype</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Prototype roadmap</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {PHASES.map((phase) => {
          const isCompleted = phase.status === 'completed';
          const isActive = phase.status === 'active';

          return (
            <div
              key={phase.id}
              className={`p-3 rounded-xl border transition-all text-xs flex items-start space-x-3 ${
                isActive
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : isCompleted
                  ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400'
                  : 'bg-zinc-950/20 border-zinc-800/60 text-zinc-500'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isActive && <CircleDot className="w-4 h-4 text-emerald-400 animate-pulse" />}
                {!isCompleted && !isActive && <Clock className="w-4 h-4 text-zinc-600" />}
              </div>

              <div className="min-w-0">
                <p
                  className={`font-medium truncate ${
                    isActive ? 'text-emerald-200 font-semibold' : isCompleted ? 'text-zinc-300' : 'text-zinc-400'
                  }`}
                >
                  {phase.title}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{phase.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
