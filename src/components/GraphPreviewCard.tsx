import React, { useState } from 'react';
import { Database, GitCommit, GitPullRequest, CircleDot, FileCode, Users, Terminal, Code2, ArrowRight } from 'lucide-react';
import { GraphData } from '../types';

interface GraphPreviewCardProps {
  graph: GraphData;
}

export const GraphPreviewCard: React.FC<GraphPreviewCardProps> = ({ graph }) => {
  const [selectedCypherTab, setSelectedCypherTab] = useState<'evidence' | 'schema'>('evidence');

  const { nodesCount, relationshipsCount } = graph;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono uppercase">Repositories</span>
          <p className="text-xl font-bold text-zinc-100 mt-1">{nodesCount.repositories}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono uppercase">Files</span>
          <p className="text-xl font-bold text-cyan-400 mt-1">{nodesCount.files}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono uppercase">Commits</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">{nodesCount.commits}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono uppercase">Pull Requests</span>
          <p className="text-xl font-bold text-indigo-400 mt-1">{nodesCount.pullRequests}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono uppercase">Issues</span>
          <p className="text-xl font-bold text-amber-400 mt-1">{nodesCount.issues}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono uppercase">Developers</span>
          <p className="text-xl font-bold text-violet-400 mt-1">{nodesCount.developers}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-emerald-500/30 bg-emerald-950/20 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-emerald-400 font-mono uppercase">Relationships</span>
          <p className="text-xl font-bold text-emerald-300 mt-1">{relationshipsCount}</p>
        </div>
      </div>

      {/* Visual Relationship Chain Diagram */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Curated Demo Relationship Preview</h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            In-Memory Graph Preview
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          This fixture illustrates one explicit relationship chain. It is not fetched from the active live repository; issue and pull-request records do not include review comments.
        </p>

        {/* Visual Flow Pipeline */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[720px] gap-2 text-xs">
            {/* Node 1: Issue */}
            <div className="flex-1 p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-center">
              <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold">:Issue #28</span>
              <p className="font-medium text-zinc-200 mt-0.5 truncate">504 Cascading Outage</p>
              <span className="text-[10px] text-zinc-500">Origin Bug</span>
            </div>

            <div className="flex flex-col items-center px-1 text-zinc-500">
              <span className="text-[9px] font-mono text-zinc-400">:ISSUE_LINKED_TO_PULL_REQUEST</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Node 2: Pull Request */}
            <div className="flex-1 p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-center">
              <span className="text-[10px] uppercase font-mono text-indigo-400 font-semibold">:PullRequest #42</span>
              <p className="font-medium text-zinc-200 mt-0.5 truncate">Cap retries to 3</p>
              <span className="text-[10px] text-zinc-500">Design Discussion</span>
            </div>

            <div className="flex flex-col items-center px-1 text-zinc-500">
              <span className="text-[9px] font-mono text-zinc-400">:PULL_REQUEST_CONTAINS_COMMIT</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Node 3: Commit */}
            <div className="flex-1 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-center">
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">:Commit 8f2a1b4</span>
              <p className="font-medium text-zinc-200 mt-0.5 truncate">fix(retry): limit 3</p>
              <span className="text-[10px] text-zinc-500">Code Modification</span>
            </div>

            <div className="flex flex-col items-center px-1 text-zinc-500">
              <span className="text-[9px] font-mono text-zinc-400">:COMMIT_MODIFIES_FILE</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Node 4: File */}
            <div className="flex-1 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-center">
              <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold">:File</span>
              <p className="font-medium text-zinc-200 mt-0.5 truncate">gateway.ts</p>
              <span className="text-[10px] text-zinc-500">Target Line L42</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cypher Query Inspector */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Illustrative Cypher Example</h3>
          </div>
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setSelectedCypherTab('evidence')}
              className={`px-2.5 py-0.5 rounded cursor-pointer ${
                selectedCypherTab === 'evidence' ? 'bg-zinc-800 text-emerald-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Evidence Traversal
            </button>
            <button
              onClick={() => setSelectedCypherTab('schema')}
              className={`px-2.5 py-0.5 rounded cursor-pointer ${
                selectedCypherTab === 'schema' ? 'bg-zinc-800 text-emerald-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Schema Constraints
            </button>
          </div>
        </div>

        <div className="mt-3">
          {selectedCypherTab === 'evidence' ? (
            <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
{`// Illustrative Cypher only. This query is not executed by the application.
MATCH (f:File {path: "src/services/gateway.ts"})<-[:COMMIT_MODIFIES_FILE]-(c:Commit)
MATCH (pr:PullRequest)-[:PULL_REQUEST_CONTAINS_COMMIT]->(c)
MATCH (dev:Developer)-[:DEVELOPER_AUTHORED_COMMIT]->(c)
OPTIONAL MATCH (issue:Issue)-[:ISSUE_LINKED_TO_PULL_REQUEST]->(pr)
WHERE c.message CONTAINS "retry" OR pr.title CONTAINS "retry"
RETURN 
  c.hash AS commitHash,
  c.message AS commitMessage,
  dev.name AS author,
  c.date AS commitDate,
  pr.id AS prNumber,
  pr.title AS prTitle,
  pr.summary AS prSummary,
  issue.id AS issueNumber,
  issue.description AS issueContext
ORDER BY c.date DESC
LIMIT 5;`}
            </pre>
          ) : (
            <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-cyan-300/90 overflow-x-auto leading-relaxed">
{`// Example only. No database is connected or queried.
CREATE CONSTRAINT unique_repo_url IF NOT EXISTS FOR (r:Repository) REQUIRE r.url IS UNIQUE;
CREATE CONSTRAINT unique_file_path IF NOT EXISTS FOR (f:File) REQUIRE f.id IS UNIQUE;
CREATE CONSTRAINT unique_commit_hash IF NOT EXISTS FOR (c:Commit) REQUIRE c.hash IS UNIQUE;
CREATE CONSTRAINT unique_pr_id IF NOT EXISTS FOR (pr:PullRequest) REQUIRE pr.id IS UNIQUE;
CREATE CONSTRAINT unique_issue_id IF NOT EXISTS FOR (i:Issue) REQUIRE i.id IS UNIQUE;
CREATE CONSTRAINT unique_developer_handle IF NOT EXISTS FOR (d:Developer) REQUIRE d.handle IS UNIQUE;`}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
