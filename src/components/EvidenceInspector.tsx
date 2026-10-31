import React, { useState, useMemo } from 'react';
import {
  Compass,
  Search,
  CheckCircle2,
  AlertTriangle,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { MockRepoPackage } from '../types';
import { retrieveEvidence, RetrievedEvidenceBundle } from '../utils/evidenceRetriever';

interface EvidenceInspectorProps {
  repoPackage: MockRepoPackage;
}

export const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({ repoPackage }) => {
  const [query, setQuery] = useState('Why is the retry limit set to 3?');

  const { summary, commits, pullRequests, issues, presetQuestions } = repoPackage;

  const bundle: RetrievedEvidenceBundle = useMemo(() => {
    return retrieveEvidence(query, summary, commits, pullRequests, issues);
  }, [query, summary, commits, pullRequests, issues]);

  const handleSelectQuery = (q: string) => {
    setQuery(q);
  };

  return (
    <div className="space-y-6">
      {/* Header and Explanation */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-zinc-800 text-amber-400 border border-zinc-700">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Phase 6: Multi-Hop Evidence Retrieval Layer
              </h2>
              <p className="text-xs text-zinc-400">
                Grounded graph search that finds historical proof before prompting the AI
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center space-x-2">
            <span className="text-xs font-mono text-zinc-400">Confidence:</span>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                bundle.hasSufficientEvidence
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              {bundle.confidenceScore}% {bundle.hasSufficientEvidence ? 'Sufficient' : 'Insufficient'}
            </span>
          </div>
        </div>

        {/* Query Input */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-zinc-400">Test Any Question:</label>
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Why was the retry limit set to 3? or Why is the button purple?"
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-zinc-500 self-center mr-1">Sample Queries:</span>
            {presetQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSelectQuery(q)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                  query === q
                    ? 'bg-amber-950/50 border-amber-500/50 text-amber-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dissected Tokens Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
          <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold">
            1. Extracted Keywords
          </span>
          <div className="flex flex-wrap gap-1">
            {bundle.extractedKeywords.map((kw) => (
              <span key={kw} className="px-2 py-0.5 rounded bg-zinc-950 text-cyan-300 border border-zinc-800 font-mono">
                {kw}
              </span>
            ))}
            {bundle.extractedKeywords.length === 0 && <span className="text-zinc-500">None detected</span>}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
          <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold">
            2. Numeric Constants
          </span>
          <div className="flex flex-wrap gap-1">
            {bundle.extractedNumbers.map((num) => (
              <span key={num} className="px-2 py-0.5 rounded bg-zinc-950 text-amber-300 border border-zinc-800 font-mono">
                #{num}
              </span>
            ))}
            {bundle.extractedNumbers.length === 0 && <span className="text-zinc-500">None detected</span>}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
          <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">
            3. Target Code Files
          </span>
          <div className="flex flex-wrap gap-1">
            {bundle.targetFiles.map((tf) => (
              <span key={tf} className="px-2 py-0.5 rounded bg-zinc-950 text-emerald-300 border border-zinc-800 font-mono">
                {tf}
              </span>
            ))}
            {bundle.targetFiles.length === 0 && <span className="text-zinc-500">None specified</span>}
          </div>
        </div>
      </div>

      {/* Retrieved Evidence Bundle Details */}
      {bundle.hasSufficientEvidence && bundle.topCandidate ? (
        <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold uppercase tracking-wider">Top Evidence Candidate Located</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">{bundle.evidenceExplanation}</p>

          {/* Triplet Chain Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {/* 1. Commit */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>Commit {bundle.topCandidate.commit?.shortHash}</span>
                </span>
                <span className="text-[10px] text-zinc-500">{bundle.topCandidate.commit?.date.substring(0, 10)}</span>
              </div>
              <p className="text-xs text-zinc-200 line-clamp-2">{bundle.topCandidate.commit?.message}</p>
              <div className="text-[10px] text-zinc-500 font-mono">Author: {bundle.topCandidate.developer}</div>
            </div>

            {/* 2. PR */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center space-x-1 text-indigo-400 font-semibold">
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>PR #{bundle.topCandidate.pullRequest?.id}</span>
                </span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {bundle.topCandidate.pullRequest?.state}
                </span>
              </div>
              <p className="text-xs text-zinc-200 line-clamp-2">{bundle.topCandidate.pullRequest?.title}</p>
              <div className="text-[10px] text-zinc-500 font-mono">
                Author: @{bundle.topCandidate.pullRequest?.author}
              </div>
            </div>

            {/* 3. Issue */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center space-x-1 text-amber-400 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Issue #{bundle.topCandidate.issue?.id}</span>
                </span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  {bundle.topCandidate.issue?.state}
                </span>
              </div>
              <p className="text-xs text-zinc-200 line-clamp-2">{bundle.topCandidate.issue?.title}</p>
              <div className="text-[10px] text-zinc-500 font-mono">
                Author: @{bundle.topCandidate.issue?.author}
              </div>
            </div>
          </div>

          {/* Source Links */}
          <div className="pt-2">
            <span className="text-[10px] uppercase font-mono text-zinc-500">Verified Clickable Links:</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {bundle.sourceUrls.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-xs font-mono text-emerald-400 border border-zinc-800 transition-colors"
                >
                  <span>{link.title}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-rose-500/30 rounded-2xl p-6 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-rose-400">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="font-semibold uppercase tracking-wider">Insufficient Evidence Verified</span>
          </div>
          <p className="text-xs text-rose-200 leading-relaxed">{bundle.evidenceExplanation}</p>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 font-mono leading-relaxed">
            Strict Anti-Hallucination Policy: Because no commit, PR discussion, or issue log documents the reason for this question, CodeWhy AI safely abstains from inventing an answer.
          </div>
        </div>
      )}

      {/* Candidate Ranking Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
        <h4 className="text-xs font-semibold text-zinc-200 font-mono uppercase tracking-wider">
          Evidence Scoring & Ranking Candidates
        </h4>
        <div className="space-y-2">
          {bundle.allCandidates.map((c, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-emerald-400 font-semibold">{c.commit?.shortHash}</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-400 truncate">{c.commit?.message}</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  Matched tokens: [{c.matchedKeywords.join(', ')}]
                </div>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg shrink-0 ml-3 ${
                  c.relevanceScore >= 80
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                {c.relevanceScore}%
              </span>
            </div>
          ))}

          {bundle.allCandidates.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-4">No candidates exceeded the relevance threshold.</p>
          )}
        </div>
      </div>
    </div>
  );
};
