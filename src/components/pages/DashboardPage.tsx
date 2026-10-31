import React, { useState } from 'react';
import {
  FolderGit2,
  Sparkles,
  ArrowRight,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Network,
  CheckCircle2,
  ShieldCheck,
  Search,
  ExternalLink,
  Layers,
  Terminal,
} from 'lucide-react';
import { MockRepoPackage } from '../../types';
import { getDemoScenario, JudgeDemoScenario } from '../../utils/demoScenarios';
import { AppRoute } from '../../types/navigation';

interface DashboardPageProps {
  activeRepoPackage: MockRepoPackage;
  onAnalyze: (repoUrl: string) => void;
  onSelectScenario: (scenario: JudgeDemoScenario) => void;
  onNavigate: (route: AppRoute) => void;
  isLoading?: boolean;
}

const DEMO_PRESET_REPOS = [
  {
    name: 'expressjs/express',
    label: 'Express.js Core',
    tag: 'Live GitHub',
  },
  {
    name: 'pmndrs/zustand',
    label: 'Zustand State Manager',
    tag: 'Live GitHub',
  },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  activeRepoPackage,
  onAnalyze,
  onSelectScenario,
  onNavigate,
  isLoading = false,
}) => {
  const [inputUrl, setInputUrl] = useState<string>('expressjs/express');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setInputError('Please enter a GitHub repository URL or owner/repo.');
      return;
    }
    setInputError(null);
    onAnalyze(inputUrl.trim());
  };

  const handleSelectPreset = (repoName: string) => {
    setInputUrl(repoName);
    setInputError(null);
    onAnalyze(repoName);
  };

  const selectDemoScenario = (scenarioId: string) => {
    const scenario = getDemoScenario(scenarioId);
    if (scenario) onSelectScenario(scenario);
  };

  const { summary, commits, pullRequests, issues, graph } = activeRepoPackage;

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-2">
      {/* 1. Hero & Welcome Section */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
          <Terminal className="w-3.5 h-3.5" />
          <span>HackFront India 2026 • AI & Developer Tools</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F5F5]">
          Understand the story behind your code.
        </h1>
        <p className="text-base text-[#969DA8] max-w-2xl leading-relaxed">
          CodeWhy AI searches indexed GitHub commits, pull requests, and explicitly referenced issues to find documented context for{' '}
          <span className="text-indigo-400 font-medium">why</span> it was built that way.
        </p>
      </div>

      {/* 2. Primary Action: Prominent Repository Input Card */}
      <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-[#969DA8] font-semibold">
            Connect a GitHub Repository · Live Mode
          </label>
          <span className="text-xs text-[#969DA8]">Public repos supported</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FolderGit2 className="h-4 w-4 text-[#969DA8]" />
              </div>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder="https://github.com/owner/repository or owner/repo"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 bg-[#0B0D10] border border-[#272D36] rounded-lg text-sm text-[#F5F5F5] placeholder-[#969DA8]/60 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Analyze Live Repository</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {inputError && (
            <p className="text-xs text-rose-400 flex items-center space-x-1.5 pt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{inputError}</span>
            </p>
          )}
        </form>

        {/* Quick-Try Preset Chips */}
        <div className="pt-2 border-t border-[#272D36]/80 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#969DA8]">Try a live public repository:</span>
          {DEMO_PRESET_REPOS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleSelectPreset(preset.name)}
              className="px-2.5 py-1 rounded-md bg-[#0B0D10] hover:bg-[#1C222B] border border-[#272D36] hover:border-indigo-500/40 text-xs font-mono text-[#F5F5F5] transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <span>{preset.name}</span>
              <span className="text-[10px] text-indigo-400 font-sans">({preset.tag})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Active Repository Overview Card */}
      {summary && (
        <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#272D36]">
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg font-semibold text-[#F5F5F5]">{summary.fullName}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Ready to Explore
                </span>
              </div>
              <p className="text-xs text-[#969DA8] mt-1 max-w-xl">
                {summary.description || 'Repository metadata and Git history successfully analyzed into the knowledge graph.'}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => onNavigate('ask')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask a Question</span>
              </button>
              <button
                onClick={() => onNavigate('graph')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0B0D10] hover:bg-[#1C222B] border border-[#272D36] text-[#F5F5F5] text-xs font-medium transition-colors cursor-pointer"
              >
                <Network className="w-3.5 h-3.5 text-indigo-400" />
                <span>View Graph</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => onNavigate('history')}
              className="p-3.5 rounded-lg bg-[#0B0D10] border border-[#272D36] hover:border-indigo-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[#969DA8] text-xs">
                <span>Commits Analyzed</span>
                <GitCommit className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-[#F5F5F5] mt-1 group-hover:text-amber-300">
                {commits.length}
              </div>
            </div>

            <div
              onClick={() => onNavigate('repository')}
              className="p-3.5 rounded-lg bg-[#0B0D10] border border-[#272D36] hover:border-indigo-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[#969DA8] text-xs">
                <span>Pull Requests</span>
                <GitPullRequest className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-bold font-mono text-[#F5F5F5] mt-1 group-hover:text-purple-300">
                {pullRequests.length}
              </div>
            </div>

            <div
              onClick={() => onNavigate('repository')}
              className="p-3.5 rounded-lg bg-[#0B0D10] border border-[#272D36] hover:border-indigo-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[#969DA8] text-xs">
                <span>Incident Issues</span>
                <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold font-mono text-[#F5F5F5] mt-1 group-hover:text-cyan-300">
                {issues.length}
              </div>
            </div>

            <div
              onClick={() => onNavigate('graph')}
              className="p-3.5 rounded-lg bg-[#0B0D10] border border-[#272D36] hover:border-indigo-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[#969DA8] text-xs">
                <span>Graph Nodes</span>
                <Network className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-[#F5F5F5] mt-1 group-hover:text-emerald-300">
                {graph.nodes.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Curated Hackathon Case Studies Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[#F5F5F5]">Judge Case Studies & Demo Scenarios</h3>
          <p className="text-xs text-[#969DA8] mt-0.5">
            Demo scenarios load curated records separately from Live Repository Mode.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scenario 1 */}
          <div
            onClick={() => selectDemoScenario('retry-limit')}
            className="p-4 rounded-xl bg-[#161B22] border border-[#272D36] hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                  Incident Post-Mortem
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Curated Demo
                </span>
              </div>
              <h4 className="text-sm font-semibold text-[#F5F5F5] group-hover:text-indigo-300 transition-colors">
                Payment Gateway Retry Cap (3)
              </h4>
              <p className="text-xs text-[#969DA8] leading-relaxed">
                "Why is the retry limit set to 3?" — Demo records explicitly link Issue #28, PR #42, and Commit 8f2a1b4.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#272D36] flex items-center justify-between text-xs text-indigo-400">
              <span>Test Scenario</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Scenario 4: Negative Control */}
          <div
            onClick={() => selectDemoScenario('anti-hallucination-purple-button')}
            className="p-4 rounded-xl bg-[#161B22] border border-[#272D36] hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold">
                  Anti-Hallucination
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                  Negative Control
                </span>
              </div>
              <h4 className="text-sm font-semibold text-[#F5F5F5] group-hover:text-indigo-300 transition-colors">
                Purple UI Button Test
              </h4>
              <p className="text-xs text-[#969DA8] leading-relaxed">
                "Why is the primary UI theme button purple?" — The curated records do not support this question, so the expected result is insufficient evidence.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#272D36] flex items-center justify-between text-xs text-indigo-400">
              <span>Test Scenario</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Scenario 5: Express 4.x */}
          <div
            onClick={() => selectDemoScenario('express-body-parser')}
            className="p-4 rounded-xl bg-[#161B22] border border-[#272D36] hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold">
                  OSS Architectural Shift
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Curated Demo
                </span>
              </div>
              <h4 className="text-sm font-semibold text-[#F5F5F5] group-hover:text-indigo-300 transition-colors">
                Express body-parser Decoupling
              </h4>
              <p className="text-xs text-[#969DA8] leading-relaxed">
                "Why was body-parser extracted from Express core in 4.x?" — Explains PR #2140 and modularization benefits.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#272D36] flex items-center justify-between text-xs text-indigo-400">
              <span>Test Scenario</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. How CodeWhy AI Works (Clean 3-Step Architecture) */}
      <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36] space-y-4">
        <h3 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-wider font-mono">
          How CodeWhy AI Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-[#0B0D10] border border-[#272D36] space-y-2">
            <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono font-bold">
              1
            </div>
            <h4 className="font-semibold text-[#F5F5F5]">Ingest Git History</h4>
            <p className="text-[#969DA8] leading-relaxed">
              Fetches a bounded number of GitHub commits, pull requests, issues, and selected metadata.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0B0D10] border border-[#272D36] space-y-2">
            <div className="w-7 h-7 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold">
              2
            </div>
            <h4 className="font-semibold text-[#F5F5F5]">Knowledge Graph Traversal</h4>
            <p className="text-[#969DA8] leading-relaxed">
              Uses only explicit PR-to-commit and PR-to-issue references. Neo4j persistence is not integrated in this prototype.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0B0D10] border border-[#272D36] space-y-2">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold">
              3
            </div>
            <h4 className="font-semibold text-[#F5F5F5]">Grounded Explanations</h4>
            <p className="text-[#969DA8] leading-relaxed">
              Shows verbatim retrieved excerpts with validated GitHub links, or returns "Insufficient Evidence" when causal support is missing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
