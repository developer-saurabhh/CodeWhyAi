import React from 'react';
import { Network, Database, Sparkles, Filter, Info } from 'lucide-react';
import { MockRepoPackage } from '../../types';
import { GraphCanvas } from '../GraphCanvas';
import { AppRoute } from '../../types/navigation';

interface KnowledgeGraphPageProps {
  repoPackage: MockRepoPackage;
  selectedNodeId?: string | null;
  onNavigate: (route: AppRoute) => void;
}

export const KnowledgeGraphPage: React.FC<KnowledgeGraphPageProps> = ({
  repoPackage,
  selectedNodeId,
  onNavigate,
}) => {
  const { graph } = repoPackage;

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-emerald-400" />
            <h1 className="text-xl font-bold text-[#F5F5F5]">Repository Relationship Preview</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              {graph.nodesCount.total} Nodes • {graph.relationships.length} Edges
            </span>
          </div>
          <p className="text-xs text-[#969DA8] mt-1 max-w-2xl leading-relaxed">
            In-memory relationship model linking indexed commits, pull requests, issues, and changed files.
            Select nodes to inspect current-session edges. Cypher snippets are examples only and are not executed.
          </p>
        </div>

        <button
          onClick={() => onNavigate('ask')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask Question From Graph</span>
        </button>
      </div>

      {/* Interactive Graph Canvas & Cypher Engine */}
      <GraphCanvas graph={graph} initialSelectedNodeId={selectedNodeId} />
    </div>
  );
};
