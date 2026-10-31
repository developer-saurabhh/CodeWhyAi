import React, { useState } from 'react';
import {
  GitBranch,
  Star,
  GitFork,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Database,
  Sparkles,
  History,
  GitCommit,
  GitPullRequest,
  Tag,
  BookOpen,
  Wifi,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Compass,
} from 'lucide-react';
import { MockRepoPackage } from '../types';
import { QAPanel } from './QAPanel';
import { GraphCanvas } from './GraphCanvas';
import { DataProcessingInspector } from './DataProcessingInspector';
import { EvidenceInspector } from './EvidenceInspector';

import { CodeInspector } from './CodeInspector';
import { FileCode } from 'lucide-react';
import { JudgeDemoPresets } from './JudgeDemoPresets';
import { JudgeDemoScenario } from '../utils/demoScenarios';

interface RepoDashboardProps {
  repoPackage: MockRepoPackage;
  source: 'live_github_api' | 'demo_mode';
  warning?: string;
  initialQuestion?: string;
  activeScenarioId?: string;
  onSelectScenario?: (scenario: JudgeDemoScenario) => void;
  onBackToLanding: () => void;
}

export const RepoDashboard: React.FC<RepoDashboardProps> = ({
  repoPackage,
  source,
  warning,
  initialQuestion,
  activeScenarioId,
  onSelectScenario,
  onBackToLanding,
}) => {
  const [activeTab, setActiveTab] = useState<'qa' | 'code' | 'graph' | 'evidence' | 'processing' | 'entities' | 'docs'>('qa');
  const [activeQuestion, setActiveQuestion] = useState<string>(initialQuestion || 'Why is the retry limit set to 3?');
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialQuestion) {
      setActiveQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  const { summary, commits, pullRequests, issues, graph, presetQuestions } = repoPackage;

  const handleAskFromCode = (question: string) => {
    setActiveQuestion(question);
    setActiveTab('qa');
  };

  const handleInspectInGraph = (nodeId?: string) => {
    if (nodeId) setSelectedGraphNodeId(nodeId);
    setActiveTab('graph');
  };

  const handleInspectInEvidence = () => {
    setActiveTab('evidence');
  };

  return (
    <div className="space-y-6">
      {/* Quick Judge Presets Selector */}
      {onSelectScenario && (
        <JudgeDemoPresets
          onSelectScenario={onSelectScenario}
          activeScenarioId={activeScenarioId}
          isCompact={true}
        />
      )}

      {/* Warning / Notification Banner if Rate-Limited */}
      {warning && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start space-x-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-amber-200/90 leading-relaxed">
            <span className="font-semibold text-amber-200">Integration Notice: </span>
            {warning}
          </div>
        </div>
      )}

      {/* Navigation & Repository Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToLanding}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 transition-colors border border-zinc-700 cursor-pointer"
              title="Analyze another repository"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-zinc-100 font-mono tracking-tight">
                  {summary.fullName}
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {summary.defaultBranch}
                </span>

                {source === 'live_github_api' ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                    <Wifi className="w-3 h-3 text-cyan-400" />
                    <span>Live GitHub API</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Curated Demo Case</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl">{summary.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={summary.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 transition-colors border border-zinc-700"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Repository Quick Stats Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center space-x-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>{summary.stars.toLocaleString()} stars</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <GitFork className="w-3.5 h-3.5 text-cyan-400" />
            <span>{summary.forks.toLocaleString()} forks</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>{summary.openIssues} open issues</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            <span>License: {summary.license}</span>
          </div>
          <div className="flex items-center space-x-1.5 ml-auto">
            {summary.languages.map((lang) => (
              <span key={lang} className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400">
                {lang}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex border-t border-zinc-800 pt-4 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('qa')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeTab === 'qa'
                ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask CodeWhy AI (Q&A)</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeTab === 'code'
                ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Source Inspector (“Why This Code?”)</span>
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeTab === 'graph'
                ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>In-Memory Relationship Preview ({graph.nodesCount.total} nodes)</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeTab === 'evidence'
                ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Evidence Retrieval (Phase 6)</span>
          </button>

          <button
            onClick={() => setActiveTab('processing')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeTab === 'processing'
                ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Data Processing (Phase 4)</span>
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeTab === 'entities'
                ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historical Entities ({commits.length} commits, {pullRequests.length} PRs)</span>
          </button>

          {summary.readmeExcerpt && (
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeTab === 'docs'
                  ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Documentation (README)</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'qa' && (
        <QAPanel
          repoPackage={repoPackage}
          mode={source === 'live_github_api' ? 'live' : 'demo'}
          initialQuestion={activeQuestion}
          onInspectInGraph={handleInspectInGraph}
          onInspectInEvidence={handleInspectInEvidence}
        />
      )}

      {activeTab === 'code' && (
        <CodeInspector onAskQuestion={handleAskFromCode} />
      )}

      {activeTab === 'graph' && (
        <GraphCanvas
          graph={graph}
          initialSelectedNodeId={selectedGraphNodeId}
        />
      )}

      {activeTab === 'evidence' && (
        <EvidenceInspector repoPackage={repoPackage} />
      )}

      {activeTab === 'processing' && (
        <DataProcessingInspector repoPackage={repoPackage} />
      )}

      {activeTab === 'docs' && summary.readmeExcerpt && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Repository Documentation Excerpt</h3>
          </div>
          <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
            {summary.readmeExcerpt}
          </pre>
        </div>
      )}

      {activeTab === 'entities' && (
        <div className="space-y-6">
          {/* Commits Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <GitCommit className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-200">Indexed Git Commits</h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">{commits.length} commits</span>
            </div>

            <div className="space-y-3">
              {commits.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1 min-w-0 flex items-start space-x-3">
                    {c.authorAvatar && (
                      <img
                        src={c.authorAvatar}
                        alt=""
                        className="w-7 h-7 rounded-full shrink-0 border border-zinc-800 mt-1"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 font-mono text-xs">
                        <span className="text-emerald-400 font-semibold">{c.shortHash}</span>
                        <span className="text-zinc-400">•</span>
                        <span className="text-zinc-400 truncate">{c.author}</span>
                        <span className="text-zinc-500 text-[11px]">{new Date(c.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-zinc-200 font-medium mt-0.5">{c.message}</p>
                      {c.filesChanged.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {c.filesChanged.map((f) => (
                            <span
                              key={f}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-cyan-400 border border-zinc-800"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-zinc-500 hover:text-emerald-400 p-1.5 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Pull Requests & Issues Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PRs */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <GitPullRequest className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">Pull Requests</h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">{pullRequests.length} PRs</span>
              </div>

              <div className="space-y-3">
                {pullRequests.map((pr) => (
                  <div key={pr.id} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-indigo-400 font-semibold">PR #{pr.id}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {pr.state}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-zinc-200">{pr.title}</p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{pr.summary}</p>
                    {pr.url && (
                      <div className="pt-1">
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[11px] font-mono text-indigo-400 hover:underline"
                        >
                          <span>Open on GitHub</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Issues */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">Linked Bug Issues</h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">{issues.length} issues</span>
              </div>

              <div className="space-y-3">
                {issues.map((issue) => (
                  <div key={issue.id} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-amber-400 font-semibold">Issue #{issue.id}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {issue.state}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-zinc-200">{issue.title}</p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{issue.description}</p>
                    {issue.url && (
                      <div className="pt-1">
                        <a
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[11px] font-mono text-amber-400 hover:underline"
                        >
                          <span>Open on GitHub</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
