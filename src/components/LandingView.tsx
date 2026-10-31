import React, { useState } from 'react';
import { Search, GitBranch, ArrowRight, Sparkles, HelpCircle, ShieldCheck, CheckCircle2, AlertCircle, Database, GitPullRequest, Layers } from 'lucide-react';
import { parseGitHubUrl } from '../utils/github';
import { POPULAR_REPOS } from '../mock/demoData';
import { JudgeDemoPresets } from './JudgeDemoPresets';
import { JudgeDemoScenario } from '../utils/demoScenarios';

interface LandingViewProps {
  onAnalyze: (repoUrl: string) => void;
  onSelectScenario: (scenario: JudgeDemoScenario) => void;
  isLoading: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({ onAnalyze, onSelectScenario, isLoading }) => {
  const [inputUrl, setInputUrl] = useState('codewhy-ai/demo-payment-service');
  const [error, setError] = useState<string | null>(null);

  const parsed = parseGitHubUrl(inputUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setError('Please enter a GitHub repository URL or shorthand (e.g. facebook/react)');
      return;
    }

    if (!parsed.isValid) {
      setError('Invalid GitHub repository format. Use "owner/repo" or "https://github.com/owner/repo"');
      return;
    }

    setError(null);
    onAnalyze(parsed.normalizedUrl);
  };

  const handleSelectPreset = (repoName: string) => {
    setInputUrl(repoName);
    setError(null);
  };

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="text-center space-y-5 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono shadow-sm">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>HackFront India 2026 • Applied AI & Developer Tools</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-100">
          Understand <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">why</span> your code exists.
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          Most developer tools tell you <span className="text-zinc-200 font-medium">what</span> code does.
          <br className="hidden sm:inline" />
          CodeWhy AI analyzes git commits, pull requests, and issue discussions to uncover the
          <span className="text-emerald-400 font-medium"> story, bugs, and architectural reasoning</span> behind why it was built that way.
        </p>

        {/* Repository Input Form */}
        <div className="pt-4 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 p-2 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-2xl focus-within:border-emerald-500/80 transition-all">
              <div className="relative flex-1 flex items-center pl-3">
                <Search className="w-5 h-5 text-zinc-500 shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://github.com/owner/repository or owner/repo"
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono py-2"
                  disabled={isLoading}
                />
                {parsed.isValid && (
                  <span className="hidden sm:inline-flex items-center text-[11px] font-mono text-emerald-400 mr-2 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Valid
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Analyzing History...' : 'Analyze Repository'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {error && (
              <div className="mt-2 text-left flex items-center space-x-1.5 text-xs text-rose-400 pl-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Quick Presets for Hackathon Demo */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-zinc-500 text-[11px]">Quick try demo repositories:</span>
            {POPULAR_REPOS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset.name)}
                className={`px-3 py-1 rounded-lg border font-mono text-[11px] transition-all cursor-pointer ${
                  inputUrl.includes(preset.name)
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Hackathon Judge Demo Presets Showcase */}
      <section className="max-w-5xl mx-auto">
        <JudgeDemoPresets onSelectScenario={onSelectScenario} />
      </section>

      {/* How it works 3-Pillar Architecture */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-zinc-200">1. GitHub Ingestion</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Fetches bounded commit, pull-request, issue, and README records. Pull-request review comments and live source files are not fetched.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-zinc-200">2. In-Memory Relationship Preview</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Shows indexed issue links and pull-request commit membership in memory: <code className="text-indigo-300 font-mono">(:Issue)-[:ISSUE_LINKED_TO_PULL_REQUEST]-&gt;(:PR)-[:PULL_REQUEST_CONTAINS_COMMIT]-&gt;(:Commit)</code>.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-zinc-200">3. Grounded Reasoning</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The answer path uses server-retrieved records and exact source excerpts. It returns Insufficient Evidence when explicit links and matching text do not support an explanation.
          </p>
        </div>
      </section>
    </div>
  );
};
