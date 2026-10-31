import {
  GraphNode,
  GraphRelationship,
  GraphData,
  CommitEntity,
  PullRequestEntity,
  IssueEntity,
} from '../types';

/**
 * In-Memory Property Graph Engine for CodeWhy AI.
 * Implements node indexing, relationship traversal, and multi-hop path finding,
 * mirroring Neo4j's Cypher pattern matching for offline and browser execution.
 */
export class GraphEngine {
  private nodes: Map<string, GraphNode> = new Map();
  private outEdges: Map<string, GraphRelationship[]> = new Map();
  private inEdges: Map<string, GraphRelationship[]> = new Map();

  constructor(initialData?: { nodes: GraphNode[]; relationships: GraphRelationship[] }) {
    if (initialData) {
      this.load(initialData.nodes, initialData.relationships);
    }
  }

  public load(nodes: GraphNode[], relationships: GraphRelationship[]): void {
    this.nodes.clear();
    this.outEdges.clear();
    this.inEdges.clear();

    nodes.forEach((node) => {
      this.nodes.set(node.id, node);
      this.outEdges.set(node.id, []);
      this.inEdges.set(node.id, []);
    });

    relationships.forEach((rel) => {
      // Source out-edge
      const outList = this.outEdges.get(rel.source) || [];
      outList.push(rel);
      this.outEdges.set(rel.source, outList);

      // Target in-edge
      const inList = this.inEdges.get(rel.target) || [];
      inList.push(rel);
      this.inEdges.set(rel.target, inList);
    });
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllRelationships(): GraphRelationship[] {
    const rels: GraphRelationship[] = [];
    this.outEdges.forEach((list) => rels.push(...list));
    return rels;
  }

  public getOutEdges(nodeId: string): GraphRelationship[] {
    return this.outEdges.get(nodeId) || [];
  }

  public getInEdges(nodeId: string): GraphRelationship[] {
    return this.inEdges.get(nodeId) || [];
  }

  /**
   * Multi-hop traversal mirroring Cypher:
   * MATCH (f:File)<-[:COMMIT_MODIFIES_FILE]-(c:Commit)<-[:PULL_REQUEST_CONTAINS_COMMIT]-(pr:PullRequest)<-[:ISSUE_LINKED_TO_PULL_REQUEST]-(i:Issue)
   */
  public findEvidenceChainForCommit(commitId: string): {
    commit?: GraphNode;
    author?: GraphNode;
    files: GraphNode[];
    pullRequest?: GraphNode;
    issues: GraphNode[];
  } {
    const commit = this.nodes.get(commitId);
    if (!commit) {
      return { files: [], issues: [] };
    }

    // 1. Find author: (:Developer)-[:DEVELOPER_AUTHORED_COMMIT]->(:Commit)
    let author: GraphNode | undefined;
    const inCommitEdges = this.inEdges.get(commitId) || [];
    const authEdge = inCommitEdges.find((e) => e.type === 'DEVELOPER_AUTHORED_COMMIT');
    if (authEdge) {
      author = this.nodes.get(authEdge.source);
    }

    // 2. Find modified files: (:Commit)-[:COMMIT_MODIFIES_FILE]->(:File)
    const outCommitEdges = this.outEdges.get(commitId) || [];
    const files = outCommitEdges
      .filter((e) => e.type === 'COMMIT_MODIFIES_FILE')
      .map((e) => this.nodes.get(e.target))
      .filter((n): n is GraphNode => Boolean(n));

    // 3. Find PR: (:PullRequest)-[:PULL_REQUEST_CONTAINS_COMMIT]->(:Commit)
    let pullRequest: GraphNode | undefined;
    const prEdge = inCommitEdges.find((e) => e.type === 'PULL_REQUEST_CONTAINS_COMMIT');
    if (prEdge) {
      pullRequest = this.nodes.get(prEdge.source);
    }

    // 4. Find issues linked to PR or commit:
    const issues: GraphNode[] = [];
    // From commit references: (:Commit)-[:COMMIT_REFERENCES_ISSUE]->(:Issue)
    outCommitEdges
      .filter((e) => e.type === 'COMMIT_REFERENCES_ISSUE')
      .forEach((e) => {
        const issue = this.nodes.get(e.target);
        if (issue && !issues.some((i) => i.id === issue.id)) {
          issues.push(issue);
        }
      });

    // From PR references: (:Issue)-[:ISSUE_LINKED_TO_PULL_REQUEST]->(:PullRequest)
    if (pullRequest) {
      const inPrEdges = this.inEdges.get(pullRequest.id) || [];
      inPrEdges
        .filter((e) => e.type === 'ISSUE_LINKED_TO_PULL_REQUEST')
        .forEach((e) => {
          const issue = this.nodes.get(e.source);
          if (issue && !issues.some((i) => i.id === issue.id)) {
            issues.push(issue);
          }
        });
    }

    return { commit, author, files, pullRequest, issues };
  }

  /**
   * Generates graph statistics summary
   */
  public getStats(): {
    totalNodes: number;
    totalRelationships: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    this.nodes.forEach((n) => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return {
      totalNodes: this.nodes.size,
      totalRelationships: this.getAllRelationships().length,
      byType,
    };
  }
}
