import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AnalysisProgressStep, MockRepoPackage } from '../types';
import { analyzeRepository } from '../services/api';

interface AnalysisProgressProps {
  repoUrl: string;
  onComplete: (data: { packageData: MockRepoPackage; source: 'live_github_api'; warning?: string }) => void;
  onError: (errorMsg: string) => void;
}

const INITIAL_STEPS: AnalysisProgressStep[] = [
  { id: 1, title: 'Validating GitHub Repository', detail: 'Verifying repository accessibility and public branches', status: 'in-progress' },
  { id: 2, title: 'Connecting to GitHub REST API', detail: 'Ingesting commit history, authors, and timestamps', status: 'pending' },
  { id: 3, title: 'Extracting Pull Requests & Issues', detail: 'Fetching bounded pages and explicit issue references', status: 'pending' },
  { id: 4, title: 'Indexing Explicit Relationships', detail: 'Linking only commit SHAs returned for a pull request', status: 'pending' },
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ repoUrl, onComplete, onError }) => {
  const [steps, setSteps] = useState<AnalysisProgressStep[]>(INITIAL_STEPS);
  const [progressPercent, setProgressPercent] = useState(20);
  const [statusMessage, setStatusMessage] = useState('Connecting to backend API...');

  useEffect(() => {
    let isCancelled = false;

    async function runIngestion() {
      try {
        // Step 1
        setSteps((prev) => prev.map((s, idx) => (idx === 0 ? { ...s, status: 'in-progress' } : s)));
        setProgressPercent(25);
        setStatusMessage('Validating repository URL format...');
        await new Promise((r) => setTimeout(r, 400));

        if (isCancelled) return;

        // Step 2
        setSteps((prev) =>
          prev.map((s, idx) => (idx === 0 ? { ...s, status: 'completed' } : idx === 1 ? { ...s, status: 'in-progress' } : s))
        );
        setProgressPercent(50);
        setStatusMessage('Fetching commits & diff logs from GitHub REST API...');

        // Real fetch
        const result = await analyzeRepository(repoUrl);

        if (isCancelled) return;

        // Step 3
        setSteps((prev) =>
          prev.map((s, idx) => (idx <= 1 ? { ...s, status: 'completed' } : idx === 2 ? { ...s, status: 'in-progress' } : s))
        );
        setProgressPercent(75);
        setStatusMessage('Indexing pull requests, issue threads & documentation...');
        await new Promise((r) => setTimeout(r, 450));

        if (isCancelled) return;

        // Step 4
        setSteps((prev) =>
          prev.map((s, idx) => (idx <= 2 ? { ...s, status: 'completed' } : { ...s, status: 'in-progress' }))
        );
        setProgressPercent(95);
        setStatusMessage('Recording indexed repository relationships...');
        await new Promise((r) => setTimeout(r, 400));

        if (isCancelled) return;

        setSteps((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
        setProgressPercent(100);
        setStatusMessage('Analysis complete!');

        setTimeout(() => {
          if (!isCancelled) {
            onComplete(result);
          }
        }, 350);
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Analysis failed';
          onError(msg);
        }
      }
    }

    runIngestion();

    return () => {
      isCancelled = true;
    };
  }, [repoUrl, onComplete, onError]);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 pb-6 border-b border-zinc-800">
          <div className="inline-flex p-3 rounded-2xl bg-zinc-800 text-emerald-400 border border-zinc-700/80 mb-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Analyzing Repository History</h2>
          <p className="text-xs font-mono text-zinc-400 truncate max-w-md mx-auto">{repoUrl}</p>
        </div>

        {/* Progress Bar */}
        <div className="my-6 space-y-2">
          <div className="flex justify-between text-xs font-mono text-zinc-400">
            <span>{statusMessage}</span>
            <span className="text-emerald-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step List */}
        <div className="space-y-3.5">
          {steps.map((step, idx) => {
            const isDone = step.status === 'completed';
            const isActive = step.status === 'in-progress';

            return (
              <div
                key={step.id}
                className={`flex items-start space-x-3.5 p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : isDone
                    ? 'bg-zinc-950/40 border-zinc-800/80'
                    : 'bg-zinc-950/20 border-zinc-900 opacity-50'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-600 font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium ${isActive ? 'text-emerald-200' : isDone ? 'text-zinc-200' : 'text-zinc-500'}`}>
                    {step.title}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center text-[11px] text-zinc-500 font-mono">
          Live Repository Mode · bounded GitHub REST API ingestion
        </div>
      </div>
    </div>
  );
};
