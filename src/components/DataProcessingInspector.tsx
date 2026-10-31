import React, { useState, useMemo } from 'react';
import {
  Layers,
  ArrowRight,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  FileCode,
  Tag,
  CheckCircle2,
  Database,
  Terminal,
  Code2,
} from 'lucide-react';
import { MockRepoPackage } from '../types';
import { processRepositoryGraph } from '../utils/dataProcessor';

interface DataProcessingInspectorProps {
  repoPackage: MockRepoPackage;
}

export const DataProcessingInspector: React.FC<DataProcessingInspectorProps> = ({ repoPackage }) => {
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'references' | 'relationshipPayload'>('pipeline');

  const { summary, commits, pullRequests, issues } = repoPackage;

  // Process data using Phase 4 pipeline
  const processed = useMemo(() => {
    return processRepositoryGraph(summary, commits, pullRequests, issues);
  }, [summary, commits, pullRequests, issues]);

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-zinc-800 text-cyan-400 border border-zinc-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Phase 4: Raw GitHub Data Processing & Graph Preparation
              </h2>
              <p className="text-xs text-zinc-400">
                Normalizing fetched records and building an in-memory relationship preview
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setActiveSubTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                activeSubTab === 'pipeline'
                  ? 'bg-zinc-800 text-cyan-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Extraction Pipeline
            </button>
            <button
              onClick={() => setActiveSubTab('references')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                activeSubTab === 'references'
                  ? 'bg-zinc-800 text-cyan-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cross-Citations ({processed.crossReferenceLinks.length})
            </button>
            <button
              onClick={() => setActiveSubTab('relationshipPayload')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                activeSubTab === 'relationshipPayload'
                  ? 'bg-zinc-800 text-cyan-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Relationship Preview JSON
            </button>
          </div>
        </div>

        {/* 4 Extraction Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 font-mono uppercase">Structured Nodes</span>
            <p className="text-lg font-bold text-cyan-400 mt-0.5">{processed.stats.totalNodes}</p>
            <span className="text-[10px] text-zinc-500">Repo, Devs, Files, Commits</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 font-mono uppercase">Explicit Relationships</span>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">{processed.stats.totalRelationships}</p>
            <span className="text-[10px] text-zinc-500">Indexed endpoints only</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 font-mono uppercase">Discovered Cross-Links</span>
            <p className="text-lg font-bold text-amber-400 mt-0.5">{processed.stats.extractedCrossLinks}</p>
            <span className="text-[10px] text-zinc-500">Closing references and indexed links</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 font-mono uppercase">Commit Types</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(processed.stats.commitTypes).map(([type, count]) => (
                <span
                  key={type}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800"
                >
                  {type}:{count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: EXTRACTION PIPELINE EXPLAINER */}
      {activeSubTab === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input vs Output mapping */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-zinc-200">How Raw GitHub Becomes Graph Nodes</h3>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold">
                  1. Commit Parsing & Conventional Tags
                </span>
                <p className="text-zinc-300">
                  Raw commit string <code className="text-emerald-300 bg-zinc-900 px-1 py-0.5 rounded">fix(retry): limit 3</code> is parsed into structured metadata:
                </p>
                <div className="font-mono text-[11px] text-zinc-400 bg-zinc-900/60 p-2 rounded border border-zinc-800/60 mt-1">
                  Type: "fix" • Scope: "retry" • References: [28]
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-indigo-400 font-semibold">
                  2. File Modification Extraction
                </span>
                <p className="text-zinc-300">
                  Modified files are extracted from commit patches into dedicated <code className="text-cyan-300 bg-zinc-900 px-1 py-0.5 rounded">(:File)</code> nodes, creating verified <code className="text-emerald-300 bg-zinc-900 px-1 py-0.5 rounded">[:COMMIT_MODIFIES_FILE]</code> edges.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold">
                  3. Citation & Issue Linking
                </span>
                <p className="text-zinc-300">
                  Keywords like <code className="text-amber-300 bg-zinc-900 px-1 py-0.5 rounded">fixes #28</code> or squash syntax <code className="text-amber-300 bg-zinc-900 px-1 py-0.5 rounded">(#42)</code> automatically link the commit to its origin bug report without guessing.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Sample Processed Nodes Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-zinc-200">Sample Processed Nodes (Preview)</h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">{processed.nodes.length} nodes ready</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {processed.nodes.slice(0, 7).map((n) => (
                <div
                  key={n.id}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                        n.type === 'Commit'
                          ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                          : n.type === 'PullRequest'
                          ? 'bg-indigo-950/60 border-indigo-500/30 text-indigo-300'
                          : n.type === 'Issue'
                          ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                          : n.type === 'File'
                          ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                      }`}
                    >
                      :{n.type}
                    </span>
                    <span className="font-mono text-zinc-200 truncate">{n.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-2">{n.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CROSS-CITATIONS */}
      {activeSubTab === 'references' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-zinc-200">
                Discovered Cross-Entity Citations & References
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {processed.crossReferenceLinks.length} references verified
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            These citations connect code commits directly to PR debates and customer bug issues, eliminating guesswork during AI evidence retrieval.
          </p>

          <div className="space-y-3">
            {processed.crossReferenceLinks.map((link, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="text-cyan-400 font-semibold">
                      {link.sourceType} {link.sourceId}
                    </span>
                    <span className="text-zinc-500">──cites──▶</span>
                    <span className="text-amber-400 font-semibold">
                      {link.targetType} #{link.targetNumber}
                    </span>
                  </div>
                  <p className="text-zinc-300 font-sans truncate">{link.sourceTitle}</p>
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    {link.confidence}
                  </span>
                </div>
              </div>
            ))}

            {processed.crossReferenceLinks.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-xs">
                No explicit issue citations discovered in the recent commits or PR headers.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: NEO4J BATCH PAYLOAD */}
      {activeSubTab === 'relationshipPayload' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-zinc-200">
                In-Memory Relationship Preview (JSON)
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-500/30">
              Not connected to a database
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            This display-only JSON describes the indexed records and explicit relationships. It is not sent to Neo4j or another database.
          </p>

          <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-emerald-300/90 max-h-96 overflow-y-auto leading-relaxed">
            {JSON.stringify(processed.relationshipPreviewPayload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
