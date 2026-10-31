import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  GitCommit,
  GitPullRequest,
  HelpCircle,
  ShieldAlert,
  Cpu,
  ArrowRight,
  Database,
  Compass,
  Download,
  Copy,
  Clock,
  Check,
  FileText,
} from 'lucide-react';
import { MockRepoPackage, QAResult, RepositoryMode } from '../types';
import { generateAIExplanation } from '../services/api';
import { generateMarkdownReport } from '../utils/reportExporter';

interface QAPanelProps {
  repoPackage: MockRepoPackage;
  mode: RepositoryMode;
  initialQuestion?: string;
  onInspectInGraph?: (nodeId?: string) => void;
  onInspectInEvidence?: () => void;
}

export const QAPanel: React.FC<QAPanelProps> = ({
  repoPackage,
  mode,
  initialQuestion,
  onInspectInGraph,
  onInspectInEvidence,
}) => {
  const { summary, presetQuestions } = repoPackage;

  const [question, setQuestion] = useState(initialQuestion || 'Why is the retry limit set to 3?');
  const [isSearching, setIsSearching] = useState(false);
  const [modelUsed, setModelUsed] = useState<string>('Awaiting answer provider');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [history, setHistory] = useState<QAResult[]>([]);
  const requestSequence = useRef(0);

  const [result, setResult] = useState<QAResult | null>(null);

  const handleAsk = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;
    const requestId = ++requestSequence.current;
    setQuestion(queryText.trim());
    setIsSearching(true);
    setModelUsed('Awaiting answer provider');
    setRequestError(null);
    setResult(null);

    try {
      const aiResponse = await generateAIExplanation(queryText.trim(), summary.fullName, mode);
      if (requestId !== requestSequence.current) return;
      setResult(aiResponse.result);
      setModelUsed(aiResponse.modelUsed);

      setHistory((prev) => {
        const exists = prev.find((h) => h.question === aiResponse.result.question);
        return exists ? prev : [aiResponse.result, ...prev];
      });
    } catch (error) {
      if (requestId !== requestSequence.current) return;
      setModelUsed('Unavailable');
      setRequestError(error instanceof Error ? error.message : 'Could not reach the explanation service.');
    } finally {
      if (requestId === requestSequence.current) setIsSearching(false);
    }
  }, [mode, repoPackage, summary.fullName]);

  useEffect(() => {
    const query = initialQuestion ?? 'Why is the retry limit set to 3?';
    setQuestion(query);
    void handleAsk(query);
  }, [initialQuestion, summary.fullName, mode, handleAsk]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(question);
  };

  const handleCopyReport = () => {
    const markdown = generateMarkdownReport(summary.fullName, history.length > 0 ? history : (result ? [result] : []));
    navigator.clipboard.writeText(markdown);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleDownloadReport = () => {
    const markdown = generateMarkdownReport(summary.fullName, history.length > 0 ? history : (result ? [result] : []));
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codewhy-ai-report-${summary.repo}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Question Input Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <span>Ask CodeWhy AI · {mode === 'demo' ? 'Curated Demo Mode' : 'Live Repository Mode'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Model: {modelUsed}</span>
            </div>
            {history.length > 0 && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleCopyReport}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-[11px] font-mono text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
                  title="Copy Architecture Decision Record as Markdown"
                >
                  {copiedReport ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedReport ? 'Copied ADR!' : 'Copy ADR'}</span>
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-[11px] font-mono text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
                  title="Download Markdown Report"
                >
                  <Download className="w-3 h-3 text-indigo-400" />
                  <span>Export .md</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask why a specific value, condition, or algorithm was implemented..."
            className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-sans"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching || !question.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-semibold text-xs transition-all shadow-md flex items-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <span>{isSearching ? 'Reasoning...' : 'Ask Why'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] text-zinc-500">Quick question suggestions for this repository:</p>
          <div className="flex flex-wrap gap-2">
            {presetQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleAsk(q)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                  question === q
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* History Notebook Pills */}
        {history.length > 1 && (
          <div className="pt-2 border-t border-zinc-800/80 flex items-center space-x-2 overflow-x-auto text-xs">
            <span className="text-[11px] text-zinc-500 font-mono shrink-0 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Session History ({history.length}):</span>
            </span>
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setResult(h);
                    setQuestion(h.question);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono truncate max-w-xs transition-colors cursor-pointer border ${
                    result?.question === h.question
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-semibold'
                      : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                  }`}
                  title={h.question}
                >
                  {h.question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Searching State */}
      {isSearching && (
        <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-zinc-800 text-emerald-400 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-200">
            Checking indexed records and validating explicit repository relationships...
          </p>
          <p className="text-xs text-zinc-500 font-mono">
            The server selects repository records and validates every source before answering.
          </p>
        </div>
      )}

      {requestError && !isSearching && (
        <div role="alert" className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-200">
          {requestError}
        </div>
      )}

      {/* Structured 5-Part Answer Area */}
      {!isSearching && result && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Header & Evidence Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
            <div>
              <span className="text-[11px] font-mono text-zinc-500">Question Investigated</span>
              <h3 className="text-base font-bold text-zinc-100 mt-0.5">"{result.question}"</h3>
            </div>

            {/* Evidence Status Badge & Navigation Shortcuts */}
            <div className="shrink-0 flex items-center space-x-2">
              {result.evidenceStatus === 'Verified' && (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Evidence ({result.confidenceScore}% confidence)</span>
                </div>
              )}

              {result.evidenceStatus === 'Partially Supported' && (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-500/40">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Partially Supported ({result.confidenceScore}%)</span>
                </div>
              )}

              {result.evidenceStatus === 'Insufficient Evidence' && (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-500/40">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Insufficient Evidence Found</span>
                </div>
              )}
            </div>
          </div>

          {/* 1. Direct Short Answer */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
            <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold tracking-wider">
              1. Direct Answer
            </span>
            <p className="text-sm font-medium text-zinc-100 leading-relaxed">{result.shortAnswer}</p>
          </div>

          {/* 2. Detailed Technical & Historical Explanation */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono text-zinc-400 font-semibold tracking-wider">
              2. Technical Backstory & Reasoning
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed">{result.detailedReasoning}</p>
          </div>

          {/* 3. Supporting Historical Evidence */}
          {result.evidenceStatus !== 'Insufficient Evidence' && result.supportingEntities && (
            <div className="space-y-3 pt-2">
              <span className="text-[10px] uppercase font-mono text-zinc-400 font-semibold tracking-wider">
                3. Supporting Evidence Records
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Commit Evidence */}
                {result.supportingEntities.commit && (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <GitCommit className="w-3.5 h-3.5" />
                        <span>Commit {result.supportingEntities.commit.shortHash}</span>
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {result.supportingEntities.commit.date === 'Unknown date' ? 'Date unavailable' : new Date(result.supportingEntities.commit.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 font-sans line-clamp-2">
                      {result.supportingEntities.commit.message}
                    </p>
                    <div className="text-[11px] text-zinc-400 font-mono pt-1 border-t border-zinc-900 flex justify-between">
                      <span>Author: {result.supportingEntities.commit.author}</span>
                      {result.supportingEntities.lineRange && (
                        <span className="text-cyan-400">{result.supportingEntities.lineRange}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* PR Evidence */}
                {result.supportingEntities.pullRequest && (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center space-x-1 text-indigo-400">
                        <GitPullRequest className="w-3.5 h-3.5" />
                        <span>Pull Request #{result.supportingEntities.pullRequest.id}</span>
                      </span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {result.supportingEntities.pullRequest.state}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 font-sans line-clamp-2">
                      {result.supportingEntities.pullRequest.title}
                    </p>
                    <div className="text-[11px] text-zinc-400 font-mono pt-1 border-t border-zinc-900">
                      Author: @{result.supportingEntities.pullRequest.author}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Clickable Source Links & Cross-Navigation Shortcuts */}
          <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold tracking-wider">
                4. Verified Clickable Source Links
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {result.sourceLinks && result.sourceLinks.length > 0 ? (
                  result.sourceLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-xs font-mono text-emerald-400 border border-zinc-800 transition-colors"
                    >
                      <span>{link.title}</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                  ))
                ) : (
                  <span className="text-xs font-mono text-zinc-600">No external URLs</span>
                )}
              </div>
            </div>

            {/* Cross Navigation Action Buttons */}
            <div className="flex items-center space-x-2 pt-2 sm:pt-0">
              {onInspectInGraph && (
                <button
                  onClick={() => onInspectInGraph(result.supportingEntities?.commit?.id)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-850 text-xs font-medium text-emerald-300 border border-zinc-800 hover:border-emerald-500/40 transition-colors cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inspect Relationship Preview</span>
                </button>
              )}
              {onInspectInEvidence && (
                <button
                  onClick={onInspectInEvidence}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-850 text-xs font-medium text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Evidence Matrix</span>
                </button>
              )}
            </div>
          </div>

          {/* 5. Anti-Hallucination Disclaimer */}
          <div className="text-[11px] text-zinc-500 font-mono bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              Anti-hallucination verification: The explanation is strictly bounded to commits, pull requests, and issue records.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
