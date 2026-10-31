import React, { useState } from 'react';
import {
  GitCommit,
  GitBranch,
  Calendar,
  User,
  ExternalLink,
  Search,
  Filter,
  FileCode,
  Tag,
  Sparkles,
} from 'lucide-react';
import { MockRepoPackage } from '../../types';
import { AppRoute } from '../../types/navigation';

interface HistoryPageProps {
  repoPackage: MockRepoPackage;
  onNavigate: (route: AppRoute) => void;
  onAskAboutCommit?: (commitSha: string, message: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  repoPackage,
  onNavigate,
  onAskAboutCommit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { commits, summary } = repoPackage;

  const filteredCommits = commits.filter((c) => {
    const matchesSearch =
      c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Page Header */}
      <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GitCommit className="w-4 h-4 text-amber-400" />
            <h1 className="text-xl font-bold text-[#F5F5F5]">Commit & History Explorer</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              {commits.length} Commits Extracted
            </span>
          </div>
          <p className="text-xs text-[#969DA8] mt-1 max-w-2xl leading-relaxed">
            Investigate how {summary.fullName} evolved across git revisions, pull requests, and production bug fixes.
          </p>
        </div>

        <button
          onClick={() => onNavigate('ask')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask About a Commit</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#161B22] border border-[#272D36]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#969DA8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commits by message, author, or SHA..."
            className="w-full pl-9 pr-4 py-2 bg-[#0B0D10] border border-[#272D36] rounded-lg text-xs text-[#F5F5F5] placeholder-[#969DA8]/60 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="text-xs text-[#969DA8] font-mono shrink-0">
          Showing {filteredCommits.length} of {commits.length} commits
        </div>
      </div>

      {/* Chronological Commit Timeline */}
      <div className="space-y-3">
        {filteredCommits.map((commit, idx) => {
          const shortSha = commit.shortHash || commit.id.substring(0, 7);
          return (
            <div
              key={commit.id || idx}
              className="p-5 rounded-xl bg-[#161B22] border border-[#272D36] hover:border-indigo-500/30 transition-all space-y-3 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-[#0B0D10] border border-[#272D36] text-amber-400 font-mono text-xs font-bold">
                      {shortSha}
                    </span>
                    <h3 className="text-sm font-semibold text-[#F5F5F5] group-hover:text-indigo-300 transition-colors">
                      {commit.message.split('\n')[0]}
                    </h3>
                  </div>
                  {commit.message.split('\n').length > 1 && (
                    <p className="text-xs text-[#969DA8] pl-1 max-w-2xl leading-relaxed whitespace-pre-wrap">
                      {commit.message.split('\n').slice(1).join('\n').trim()}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      if (onAskAboutCommit) {
                        onAskAboutCommit(commit.id, commit.message);
                      }
                      onNavigate('ask');
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#0B0D10] hover:bg-[#1C222B] border border-[#272D36] hover:border-indigo-500/40 text-[11px] text-indigo-400 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Explain Why</span>
                  </button>

                  {commit.url && (
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-[#0B0D10] hover:bg-[#1C222B] border border-[#272D36] text-[#969DA8] hover:text-white transition-colors"
                      title="View commit on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Commit Meta Footer */}
              <div className="pt-2 border-t border-[#272D36]/80 flex flex-wrap items-center gap-4 text-xs font-mono text-[#969DA8]">
                <div className="flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{commit.author}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{commit.date !== 'Unknown date' ? new Date(commit.date).toLocaleDateString() : 'Date unavailable'}</span>
                </div>

                {commit.filesChanged && commit.filesChanged.length > 0 && (
                  <div className="flex items-center space-x-1.5">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{commit.filesChanged.length} file(s) modified</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredCommits.length === 0 && (
          <div className="p-8 rounded-xl bg-[#161B22] border border-[#272D36] text-center text-xs text-[#969DA8]">
            No commits matching "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};
