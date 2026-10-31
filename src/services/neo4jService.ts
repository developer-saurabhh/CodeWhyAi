import { GraphData, GraphNode, GraphRelationship } from '../types';
import { GraphEngine } from '../utils/graphEngine';

export interface CypherQueryTemplate {
  id: string;
  title: string;
  description: string;
  cypher: string;
}

export const CYPHER_QUERIES: CypherQueryTemplate[] = [
  {
    id: 'multi_hop_evidence',
    title: 'Multi-Hop Evidence Traversal',
    description: 'Finds the Issue, PR, and Author that prompted a commit modifying a target file',
    cypher: `MATCH (f:File {path: "src/services/gateway.ts"})<-[:COMMIT_MODIFIES_FILE]-(c:Commit)
MATCH (pr:PullRequest)-[:PULL_REQUEST_CONTAINS_COMMIT]->(c)
MATCH (dev:Developer)-[:DEVELOPER_AUTHORED_COMMIT]->(c)
OPTIONAL MATCH (issue:Issue)-[:ISSUE_LINKED_TO_PULL_REQUEST]->(pr)
RETURN c.shortHash, c.message, dev.name, pr.id, pr.title, issue.id, issue.title;`,
  },
  {
    id: 'pr_issue_link',
    title: 'Pull Requests Linked to Bugs',
    description: 'Retrieves PRs that explicitly resolved high-severity production issues',
    cypher: `MATCH (issue:Issue)-[:ISSUE_LINKED_TO_PULL_REQUEST]->(pr:PullRequest)
MATCH (pr)-[:PULL_REQUEST_CONTAINS_COMMIT]->(c:Commit)
RETURN issue.id AS bugId, issue.title AS bugTitle, pr.id AS prNumber, c.shortHash AS fixCommit;`,
  },
  {
    id: 'developer_impact',
    title: 'Developer Commit Frequency',
    description: 'Finds which developers authored commits and which files they modified',
    cypher: `MATCH (d:Developer)-[:DEVELOPER_AUTHORED_COMMIT]->(c:Commit)-[:COMMIT_MODIFIES_FILE]->(f:File)
RETURN d.name AS developer, count(DISTINCT c) AS commitsCount, collect(DISTINCT f.path) AS filesTouched
ORDER BY commitsCount DESC;`,
  },
];

export const NEO4J_CONSTRAINTS = [
  'CREATE CONSTRAINT unique_repo_fullname IF NOT EXISTS FOR (r:Repository) REQUIRE r.fullName IS UNIQUE;',
  'CREATE CONSTRAINT unique_commit_hash IF NOT EXISTS FOR (c:Commit) REQUIRE c.hash IS UNIQUE;',
  'CREATE CONSTRAINT unique_file_path IF NOT EXISTS FOR (f:File) REQUIRE f.id IS UNIQUE;',
  'CREATE CONSTRAINT unique_pr_id IF NOT EXISTS FOR (pr:PullRequest) REQUIRE pr.id IS UNIQUE;',
  'CREATE CONSTRAINT unique_issue_id IF NOT EXISTS FOR (i:Issue) REQUIRE i.id IS UNIQUE;',
  'CREATE CONSTRAINT unique_developer_name IF NOT EXISTS FOR (d:Developer) REQUIRE d.name IS UNIQUE;',
];
