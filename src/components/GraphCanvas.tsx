import React, { useState, useMemo } from 'react';
import {
  Database,
  ArrowRight,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  FileCode,
  Users,
  Play,
  Terminal,
  CheckCircle2,
  ExternalLink,
  Info,
  Filter,
} from 'lucide-react';
import { GraphData, GraphNode, GraphRelationship } from '../types';
import { CYPHER_QUERIES, CypherQueryTemplate } from '../services/neo4jService';
import { GraphEngine } from '../utils/graphEngine';

interface GraphCanvasProps {
  graph: GraphData;
  initialSelectedNodeId?: string | null;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ graph, initialSelectedNodeId }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialSelectedNodeId || null);
  const [selectedQuery, setSelectedQuery] = useState<CypherQueryTemplate>(CYPHER_QUERIES[0]);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const engine = useMemo(() => new GraphEngine(graph), [graph]);

  const selectedNode = selectedNodeId ? engine.getNode(selectedNodeId) : null;
  const inEdges = selectedNodeId ? engine.getInEdges(selectedNodeId) : [];
  const outEdges = selectedNodeId ? engine.getOutEdges(selectedNodeId) : [];

  const filteredNodes = useMemo(() => {
    if (filterType === 'all') return graph.nodes;
    return graph.nodes.filter((n) => n.type.toLowerCase() === filterType.toLowerCase());
  }, [graph.nodes, filterType]);

  const handleRunCypher = () => {
    if (selectedQuery.id === 'multi_hop_evidence') {
      const rows = graph.nodes.filter((node) => node.type === 'Commit').map((node) => {
        const chain = engine.findEvidenceChainForCommit(node.id);
        return {
          commit: chain.commit?.label,
          pullRequest: chain.pullRequest?.label || null,
          issues: chain.issues.map((issue) => issue.label),
          files: chain.files.map((file) => file.label),
        };
      });
      setQueryResults(rows.filter((row) => row.pullRequest));
    } else if (selectedQuery.id === 'pr_issue_link') {
      const rows = graph.nodes.filter((node) => node.type === 'PullRequest').flatMap((pr) => {
        const commits = engine.getOutEdges(pr.id).filter((edge) => edge.type === 'PULL_REQUEST_CONTAINS_COMMIT');
        const issues = engine.getInEdges(pr.id).filter((edge) => edge.type === 'ISSUE_LINKED_TO_PULL_REQUEST');
        return issues.flatMap((issueEdge) => commits.map((commitEdge) => ({
          issue: engine.getNode(issueEdge.source)?.label,
          pullRequest: pr.label,
          commit: engine.getNode(commitEdge.target)?.label,
        })));
      });
      setQueryResults(rows);
    } else {
      const rows = graph.nodes.filter((node) => node.type === 'Developer').map((developer) => {
        const commits = engine.getOutEdges(developer.id).filter((edge) => edge.type === 'DEVELOPER_AUTHORED_COMMIT');
        const files = commits.flatMap((edge) => engine.getOutEdges(edge.target)
          .filter((fileEdge) => fileEdge.type === 'COMMIT_MODIFIES_FILE')
          .map((fileEdge) => engine.getNode(fileEdge.target)?.label)
          .filter((label): label is string => Boolean(label)));
        return { developer: developer.label, commitsCount: commits.length, filesTouched: [...new Set(files)] };
      });
      setQueryResults(rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono uppercase">Repositories</span>
          <p className="text-xl font-bold text-zinc-100 mt-1">{graph.nodesCount.repositories}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono uppercase">Files</span>
          <p className="text-xl font-bold text-cyan-400 mt-1">{graph.nodesCount.files}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono uppercase">Commits</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">{graph.nodesCount.commits}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono uppercase">PRs</span>
          <p className="text-xl font-bold text-indigo-400 mt-1">{graph.nodesCount.pullRequests}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono uppercase">Issues</span>
          <p className="text-xl font-bold text-amber-400 mt-1">{graph.nodesCount.issues}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono uppercase">Developers</span>
          <p className="text-xl font-bold text-violet-400 mt-1">{graph.nodesCount.developers}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-emerald-400 font-mono uppercase">Relationships</span>
          <p className="text-xl font-bold text-emerald-300 mt-1">{graph.relationshipsCount}</p>
        </div>
      </div>

      {/* Interactive Visual Graph Canvas */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-semibold text-zinc-100">In-Memory Relationship Explorer</h3>
              <p className="text-xs text-zinc-400">Click a node to inspect relationships built from the indexed records in this session.</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className="text-zinc-500 text-[11px] mr-1 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> Filter:
            </span>
            {['all', 'Issue', 'PullRequest', 'Commit', 'File', 'Developer'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                  filterType.toLowerCase() === t.toLowerCase()
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Node Grid Playground */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 min-h-[180px]">
          <div className="flex flex-wrap gap-2">
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all text-left cursor-pointer flex items-center space-x-2 ${
                    isSelected
                      ? 'ring-2 ring-emerald-400 bg-zinc-800 border-emerald-500 text-zinc-100 shadow-lg'
                      : node.type === 'Commit'
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/60'
                      : node.type === 'PullRequest'
                      ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300 hover:border-indigo-500/60'
                      : node.type === 'Issue'
                      ? 'bg-amber-950/30 border-amber-500/30 text-amber-300 hover:border-amber-500/60'
                      : node.type === 'File'
                      ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300 hover:border-cyan-500/60'
                      : 'bg-violet-950/30 border-violet-500/30 text-violet-300 hover:border-violet-500/60'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-900/80 border border-zinc-700">
                    :{node.type}
                  </span>
                  <span className="truncate max-w-[180px]">{node.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-emerald-400">Selected Node:</span>
                <span className="text-xs font-mono text-zinc-200">{selectedNode.label}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  {selectedNode.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>

            {/* Inbound & Outbound Relationships */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase text-zinc-500">Inbound Relationships (Incoming)</span>
                {inEdges.length > 0 ? (
                  inEdges.map((e) => (
                    <div key={e.id} className="text-zinc-300 truncate">
                      <span className="text-cyan-400">({e.source})</span>
                      <span className="text-emerald-400"> ──[:{e.type}]──▶ </span>
                      <span className="text-zinc-100">(this)</span>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 text-[11px]">No inbound edges</p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] uppercase text-zinc-500">Outbound Relationships (Outgoing)</span>
                {outEdges.length > 0 ? (
                  outEdges.map((e) => (
                    <div key={e.id} className="text-zinc-300 truncate">
                      <span className="text-zinc-100">(this)</span>
                      <span className="text-emerald-400"> ──[:{e.type}]──▶ </span>
                      <span className="text-cyan-400">({e.target})</span>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 text-[11px]">No outbound edges</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Local relationship preview with illustrative query templates */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Local Relationship Preview</h3>
              <p className="text-xs text-zinc-400">The button filters this in-memory graph. The Cypher text below is an example and is not sent to Neo4j.</p>
            </div>
          </div>

          <button
            onClick={handleRunCypher}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-semibold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Preview Relationships</span>
          </button>
        </div>

        {/* Template Selector */}
        <div className="flex flex-wrap gap-2">
          {CYPHER_QUERIES.map((q) => (
            <button
              key={q.id}
              onClick={() => {
                setSelectedQuery(q);
                setQueryResults(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                selectedQuery.id === q.id
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {q.title}
            </button>
          ))}
        </div>

        {/* Illustrative query text */}
        <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed">
          {selectedQuery.cypher}
        </pre>

        {/* Query Results Table */}
        {queryResults && (
          <div className="space-y-2 pt-2">
            <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold">
              Local Preview Result ({queryResults.length} records returned)
            </span>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 overflow-x-auto">
              <pre className="font-mono text-xs text-cyan-300/90 leading-relaxed">
                {JSON.stringify(queryResults, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
        <h4 className="text-xs font-semibold text-zinc-200 font-mono uppercase tracking-wider">
          Persisted Graph Database
        </h4>
        <p className="text-xs text-zinc-400">No graph database is connected. This preview is rebuilt in memory from the current repository response or curated Demo Mode data.</p>
      </div>
    </div>
  );
};
