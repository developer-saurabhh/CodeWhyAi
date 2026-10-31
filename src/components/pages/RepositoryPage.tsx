import React, { useState } from 'react';
import {
  FolderGit2,
  FileCode,
  GitPullRequest,
  AlertCircle,
  BookOpen,
  Star,
  GitFork,
  ExternalLink,
  Tag,
  Sparkles,
} from 'lucide-react';
import { MockRepoPackage, RepositoryMode } from '../../types';
import { CodeInspector } from '../CodeInspector';
import { AppRoute } from '../../types/navigation';

interface RepositoryPageProps {
  repoPackage: MockRepoPackage;
  mode: RepositoryMode;
  onAskFromCode: (question: string) => void;
  onNavigate: (route: AppRoute) => void;
}

export const RepositoryPage: React.FC<RepositoryPageProps> = ({
  repoPackage,
  mode,
  onAskFromCode,
  onNavigate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inspector' | 'prs' | 'issues' | 'readme'>('inspector');
  const { summary, pullRequests, issues } = repoPackage;

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      {/* Repository Metadata Header Card */}
      <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
              <h1 className="text-xl font-bold text-[#F5F5F5]">{summary.fullName}</h1>
              {summary.url && (
                <a
                  href={summary.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#969DA8] hover:text-white transition-colors"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="text-xs text-[#969DA8] max-w-2xl leading-relaxed">
              {summary.description || 'Repository metadata and source files extracted for architectural analysis.'}
            </p>
          </div>

          <button
            onClick={() => onNavigate('ask')}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask About This Repo</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#272D36] text-xs font-mono text-[#969DA8]">
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
              <span key={lang} className="px-2 py-0.5 rounded bg-[#0B0D10] border border-[#272D36] text-[10px] text-[#969DA8]">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      {mode === 'live' && repoPackage.ingestionSummary && (
        <div className="px-4 py-3 rounded-lg bg-[#0B0D10] border border-[#272D36] text-[11px] text-[#969DA8]">
          Indexed {repoPackage.ingestionSummary.commitsIndexed} commits, {repoPackage.ingestionSummary.pullRequestsIndexed} pull requests, and {repoPackage.ingestionSummary.issuesIndexed} issues across at most {repoPackage.ingestionSummary.pageLimit} pages per endpoint. Commit details: {repoPackage.ingestionSummary.commitDetailsFetched}/{repoPackage.ingestionSummary.commitsIndexed}; PR commit links: {repoPackage.ingestionSummary.pullRequestCommitLinksFetched}/{repoPackage.ingestionSummary.pullRequestsIndexed}. This bounded index does not represent the full repository history.
          {repoPackage.ingestionSummary.warnings.length > 0 && <div className="mt-1 text-amber-300">{repoPackage.ingestionSummary.warnings.join(' ')}</div>}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#272D36] gap-2">
        <button
          onClick={() => setActiveSubTab('inspector')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'inspector'
              ? 'border-indigo-500 text-[#F5F5F5] font-semibold'
              : 'border-transparent text-[#969DA8] hover:text-[#F5F5F5]'
          }`}
        >
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span>Source Code & Blame Inspector</span>
        </button>

        <button
          onClick={() => setActiveSubTab('prs')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'prs'
              ? 'border-indigo-500 text-[#F5F5F5] font-semibold'
              : 'border-transparent text-[#969DA8] hover:text-[#F5F5F5]'
          }`}
        >
          <GitPullRequest className="w-4 h-4 text-purple-400" />
          <span>Pull Requests ({pullRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('issues')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'issues'
              ? 'border-indigo-500 text-[#F5F5F5] font-semibold'
              : 'border-transparent text-[#969DA8] hover:text-[#F5F5F5]'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-cyan-400" />
          <span>Incident Issues ({issues.length})</span>
        </button>

        {summary.readmeExcerpt && (
          <button
            onClick={() => setActiveSubTab('readme')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'readme'
                ? 'border-indigo-500 text-[#F5F5F5] font-semibold'
                : 'border-transparent text-[#969DA8] hover:text-[#F5F5F5]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Documentation / README</span>
          </button>
        )}
      </div>

      {/* Sub-Tab 1: Source Inspector */}
      {activeSubTab === 'inspector' && (
        mode === 'demo' ? (
          <CodeInspector onAskQuestion={(q) => { onAskFromCode(q); onNavigate('ask'); }} />
        ) : (
          <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36] text-sm text-[#969DA8]">
            Live source files are not fetched by this prototype. The interactive line annotations use curated Demo Mode examples only.
          </div>
        )
      )}

      {/* Sub-Tab 2: Pull Requests */}
      {activeSubTab === 'prs' && (
        <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36] space-y-4">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Indexed Pull Requests</h3>
          <div className="space-y-3">
            {pullRequests.map((pr) => (
              <div
                key={pr.id}
                className="p-4 rounded-lg bg-[#0B0D10] border border-[#272D36] hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-purple-400">#{pr.id}</span>
                    <h4 className="text-xs font-semibold text-[#F5F5F5]">{pr.title}</h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 font-mono">
                      {pr.state}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#969DA8] line-clamp-1">{pr.summary || 'No pull request description provided.'}</p>
                </div>
                <div className="flex items-center space-x-3 text-xs text-[#969DA8] font-mono shrink-0">
                  <span>@{pr.author}</span>
                  {pr.url && (
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <span>PR</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Issues */}
      {activeSubTab === 'issues' && (
        <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36] space-y-4">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Incident Bug Reports & Problem Statements</h3>
          <div className="space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="p-4 rounded-lg bg-[#0B0D10] border border-[#272D36] hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">#{issue.id}</span>
                    <h4 className="text-xs font-semibold text-[#F5F5F5]">{issue.title}</h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 font-mono">
                      {issue.state}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#969DA8] line-clamp-1">{issue.description || 'No issue description provided.'}</p>
                </div>
                <div className="flex items-center space-x-3 text-xs text-[#969DA8] font-mono shrink-0">
                  {issue.url && (
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <span>Issue</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 4: README */}
      {activeSubTab === 'readme' && summary.readmeExcerpt && (
        <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36] space-y-4">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">README Excerpt & Architectural Notes</h3>
          <pre className="p-4 rounded-lg bg-[#0B0D10] border border-[#272D36] text-xs font-mono text-[#F5F5F5] overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {summary.readmeExcerpt}
          </pre>
        </div>
      )}
    </div>
  );
};
