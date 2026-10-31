import {
  RepositorySummary,
  CommitEntity,
  PullRequestEntity,
  IssueEntity,
  GraphNode,
  GraphRelationship,
  GraphData,
} from '../types';

/**
 * Result of parsing a conventional commit message.
 * e.g., "fix(retry): limit gateway request retries to 3" ->
 * { type: "fix", scope: "retry", subject: "limit gateway request retries to 3" }
 */
export interface ParsedCommitMessage {
  type: string;
  scope?: string;
  subject: string;
  raw: string;
  referencedNumbers: number[];
}

/**
 * Extracts explicit issue-closing references. Generic references such as `see #12`,
 * `GH-12`, or `(#12)` are not enough to create a relationship edge.
 */
export function extractIssueReferences(text: string): number[] {
  if (!text) return [];

  const references = new Set<number>();

  const keywordRegex = /\b(?:fix(?:es|ed)?|close[sd]?|resolve[sd]?)\s+#(\d+)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = keywordRegex.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0) {
      references.add(num);
    }
  }

  return Array.from(references);
}

/**
 * Parses conventional commit format: type(scope): subject
 */
export function parseConventionalCommit(message: string): ParsedCommitMessage {
  const firstLine = message.split('\n')[0].trim();
  const referencedNumbers = extractIssueReferences(message);

  const conventionalRegex = /^([a-zA-Z]+)(?:\(([a-zA-Z0-9_.-]+)\))?!?:\s*(.+)$/;
  const match = firstLine.match(conventionalRegex);

  if (match) {
    return {
      type: match[1].toLowerCase(),
      scope: match[2]?.toLowerCase(),
      subject: match[3].trim(),
      raw: firstLine,
      referencedNumbers,
    };
  }

  return {
    type: 'other',
    subject: firstLine,
    raw: firstLine,
    referencedNumbers,
  };
}

export interface ExtractedReferenceLink {
  sourceType: 'Commit' | 'PullRequest';
  sourceId: string;
  sourceTitle: string;
  targetNumber: number;
  targetType: 'Issue' | 'PullRequest';
  matchedEntityTitle?: string;
  confidence: 'Direct Citation';
}

export interface ProcessedGraphPackage {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  stats: {
    totalNodes: number;
    totalRelationships: number;
    extractedCrossLinks: number;
    commitTypes: Record<string, number>;
  };
  crossReferenceLinks: ExtractedReferenceLink[];
  relationshipPreviewPayload: {
    nodes: Array<{ id: string; labels: string[]; properties: Record<string, any> }>;
    relationships: Array<{ id: string; type: string; from: string; to: string; properties?: Record<string, any> }>;
  };
}

/**
 * Transforms raw repository entities into a structured Knowledge Graph model.
 * Preserves exact GitHub URLs, generates no fabricated edges, and links
 * commits, PRs, and issues only when both endpoints exist in this package and the
 * relationship is represented by indexed commit membership or an explicit closing reference.
 */
export function processRepositoryGraph(
  summary: RepositorySummary,
  commits: CommitEntity[],
  pullRequests: PullRequestEntity[],
  issues: IssueEntity[]
): ProcessedGraphPackage {
  const nodes: GraphNode[] = [];
  const relationships: GraphRelationship[] = [];
  const crossReferenceLinks: ExtractedReferenceLink[] = [];
  const commitTypes: Record<string, number> = {};
  const indexedIssueIds = new Set(issues.map((issue) => issue.id));
  const indexedCommitsById = new Map(commits.map((commit) => [commit.id.toLowerCase(), commit]));

  // Track existing node IDs to prevent duplicates
  const existingNodeIds = new Set<string>();

  const addNode = (node: GraphNode) => {
    if (!existingNodeIds.has(node.id)) {
      existingNodeIds.add(node.id);
      nodes.push(node);
    }
  };

  // 1. Repository Node
  const repoNodeId = `repo:${summary.fullName}`;
  addNode({
    id: repoNodeId,
    label: summary.repo,
    type: 'Repo',
    properties: {
      fullName: summary.fullName,
      owner: summary.owner,
      stars: summary.stars,
      forks: summary.forks,
      defaultBranch: summary.defaultBranch,
      url: summary.url,
      license: summary.license,
    },
  });

  // Track developer handles
  const devNodes = new Map<string, string>(); // login/name -> nodeId
  // Track files
  const fileNodes = new Map<string, string>(); // path -> nodeId

  // 2. Process Commits
  commits.forEach((c) => {
    const parsed = parseConventionalCommit(c.message);
    commitTypes[parsed.type] = (commitTypes[parsed.type] || 0) + 1;

    const commitNodeId = `commit:${c.shortHash}`;
    addNode({
      id: commitNodeId,
      label: `${c.shortHash} (${parsed.scope || parsed.type})`,
      type: 'Commit',
      properties: {
        hash: c.id,
        shortHash: c.shortHash,
        message: c.message,
        type: parsed.type,
        scope: parsed.scope || 'general',
        date: c.date,
        url: c.url,
      },
    });

    // Developer Node & [:DEVELOPER_AUTHORED_COMMIT]
    const authorName = c.author || 'Unknown';
    if (!devNodes.has(authorName)) {
      const devNodeId = `dev:${authorName.replace(/\s+/g, '_')}`;
      devNodes.set(authorName, devNodeId);
      addNode({
        id: devNodeId,
        label: authorName,
        type: 'Developer',
        properties: { name: authorName, avatar: c.authorAvatar || '' },
      });
    }

    const devNodeId = devNodes.get(authorName)!;
    relationships.push({
      id: `rel:auth:${c.shortHash}`,
      source: devNodeId,
      target: commitNodeId,
      type: 'DEVELOPER_AUTHORED_COMMIT',
    });

    // File Nodes & [:COMMIT_MODIFIES_FILE]
    c.filesChanged.forEach((filePath) => {
      if (!fileNodes.has(filePath)) {
        const fileNodeId = `file:${filePath}`;
        fileNodes.set(filePath, fileNodeId);
        addNode({
          id: fileNodeId,
          label: filePath.split('/').pop() || filePath,
          type: 'File',
          properties: { path: filePath },
        });

        // Repository contains File
        relationships.push({
          id: `rel:contains:${filePath}`,
          source: repoNodeId,
          target: fileNodeId,
          type: 'REPOSITORY_CONTAINS_FILE',
        });
      }

      const fileNodeId = fileNodes.get(filePath)!;
      relationships.push({
        id: `rel:mod:${c.shortHash}:${filePath}`,
        source: commitNodeId,
        target: fileNodeId,
        type: 'COMMIT_MODIFIES_FILE',
      });
    });

    // Extract Issue / PR references from commit message
    parsed.referencedNumbers.filter((refNum) => indexedIssueIds.has(refNum)).forEach((refNum) => {
      crossReferenceLinks.push({
        sourceType: 'Commit',
        sourceId: c.shortHash,
        sourceTitle: c.message,
        targetNumber: refNum,
        targetType: 'Issue',
        confidence: 'Direct Citation',
      });

      // Target node reference
      const targetIssueNodeId = `issue:${refNum}`;
      relationships.push({
        id: `rel:ref:${c.shortHash}:${refNum}`,
        source: commitNodeId,
        target: targetIssueNodeId,
        type: 'COMMIT_REFERENCES_ISSUE',
      });
    });
  });

  // 3. Process Pull Requests
  pullRequests.forEach((pr) => {
    const prNodeId = `pr:${pr.id}`;
    addNode({
      id: prNodeId,
      label: `PR #${pr.id}: ${pr.title.substring(0, 30)}...`,
      type: 'PullRequest',
      properties: {
        id: pr.id,
        title: pr.title,
        author: pr.author,
        state: pr.state,
        url: pr.url,
      },
    });

    // Pull request author
    if (!devNodes.has(pr.author)) {
      const devNodeId = `dev:${pr.author}`;
      devNodes.set(pr.author, devNodeId);
      addNode({
        id: devNodeId,
        label: pr.author,
        type: 'Developer',
        properties: { name: pr.author },
      });
    }

    for (const commitId of pr.commitIds || []) {
      const commit = indexedCommitsById.get(commitId.toLowerCase());
      if (!commit) continue;
      relationships.push({
        id: `rel:pr_commit:${pr.id}:${commit.id}`,
        source: `pr:${pr.id}`,
        target: `commit:${commit.shortHash}`,
        type: 'PULL_REQUEST_CONTAINS_COMMIT',
      });
    }

    const issueNum = pr.linkedIssueId;
    if (issueNum && indexedIssueIds.has(issueNum)) {
      const issueNodeId = `issue:${issueNum}`;
      crossReferenceLinks.push({
        sourceType: 'PullRequest',
        sourceId: String(pr.id),
        sourceTitle: pr.title,
        targetNumber: issueNum,
        targetType: 'Issue',
        confidence: 'Direct Citation',
      });

      relationships.push({
        id: `rel:pr_issue:${pr.id}:${issueNum}`,
        source: issueNodeId,
        target: prNodeId,
        type: 'ISSUE_LINKED_TO_PULL_REQUEST',
      });
    }
  });

  // 4. Process Issues
  issues.forEach((issue) => {
    const issueNodeId = `issue:${issue.id}`;
    addNode({
      id: issueNodeId,
      label: `Issue #${issue.id}: ${issue.title.substring(0, 30)}...`,
      type: 'Issue',
      properties: {
        id: issue.id,
        title: issue.title,
        author: issue.author,
        state: issue.state,
        labels: issue.labels.join(', '),
        url: issue.url,
      },
    });
  });

  // 5. Build a plain in-memory relationship preview payload; no database is connected.
  const relationshipPreviewPayload = {
    nodes: nodes.map((n) => ({
      id: n.id,
      labels: [n.type],
      properties: {
        ...n.properties,
        id: n.id,
        label: n.label,
      },
    })),
    relationships: relationships.map((r) => ({
      id: r.id,
      type: r.type,
      from: r.source,
      to: r.target,
    })),
  };

  return {
    nodes,
    relationships,
    stats: {
      totalNodes: nodes.length,
      totalRelationships: relationships.length,
      extractedCrossLinks: crossReferenceLinks.length,
      commitTypes,
    },
    crossReferenceLinks,
    relationshipPreviewPayload,
  };
}
