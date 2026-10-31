import { RepositorySummary, CommitEntity, PullRequestEntity, IssueEntity, GraphData, GraphNode, GraphRelationship } from '../types';

export function normalizeRepoSummary(raw: any, owner: string, repo: string): RepositorySummary {
  const canonicalOwner = raw?.owner?.login || owner;
  const canonicalRepo = raw?.name || repo;
  const fullName = raw?.full_name || `${canonicalOwner}/${canonicalRepo}`;
  return {
    owner: canonicalOwner,
    repo: canonicalRepo,
    fullName,
    description: raw?.description || 'No description provided.',
    stars: raw?.stargazers_count ?? 0,
    forks: raw?.forks_count ?? 0,
    openIssues: raw?.open_issues_count ?? 0,
    defaultBranch: raw?.default_branch || 'unknown',
    license: raw?.license?.spdx_id || raw?.license?.name || 'Not specified',
    url: `https://github.com/${fullName}`,
    languages: raw?.language ? [raw.language] : [],
    readmeExcerpt: raw?.readmeExcerpt,
  };
}

export function normalizeCommits(rawCommits: any[]): CommitEntity[] {
  if (!Array.isArray(rawCommits)) return [];
  const normalized = rawCommits
    .filter((item) => typeof item?.sha === 'string' && /^[a-f\d]{40}$/i.test(item.sha))
    .map((item) => {
      const sha: string = item.sha;
      const message = typeof item?.commit?.message === 'string' ? item.commit.message.slice(0, 4000) : 'No commit message provided.';
      const authorName = item?.commit?.author?.name || item?.author?.login || 'Unknown author';
      const authorLogin = item?.author?.login ? ` (${item.author.login})` : '';
      return {
        id: sha,
        shortHash: sha.slice(0, 7),
        message,
        author: `${authorName}${authorLogin}`,
        authorAvatar: item?.author?.avatar_url,
        date: item?.commit?.author?.date || 'Unknown date',
        filesChanged: Array.isArray(item?.files) ? item.files.map((file: any) => file?.filename).filter((name: unknown) => typeof name === 'string') : [],
        url: item?.html_url || '',
      };
    });
  return [...new Map(normalized.map((commit) => [commit.id.toLowerCase(), commit])).values()];
}

function explicitIssueReference(body: unknown, owner: string, repo: string, existingIds: Set<number>): number | undefined {
  if (typeof body !== 'string') return undefined;
  const pattern = /\b(?:close[sd]?|fix(?:es|ed)?|resolve[sd]?)\s+(?:(?<owner>[\w.-]+)\/(?<repo>[\w.-]+))?#(?<number>\d+)\b/gi;
  for (const match of body.matchAll(pattern)) {
    const refOwner = match.groups?.owner;
    const refRepo = match.groups?.repo;
    const number = Number(match.groups?.number);
    if ((!refOwner && !refRepo || refOwner?.toLowerCase() === owner.toLowerCase() && refRepo?.toLowerCase() === repo.toLowerCase()) && existingIds.has(number)) return number;
  }
  return undefined;
}

export function normalizePullRequests(rawPulls: any[], owner = '', repo = '', issueIds: number[] = []): PullRequestEntity[] {
  if (!Array.isArray(rawPulls)) return [];
  const existingIds = new Set(issueIds);
  const normalized = rawPulls.map((item) => {
    const linkedIssueId = explicitIssueReference(item?.body, owner, repo, existingIds);
    const normalized: PullRequestEntity = {
      id: item?.number ?? 0,
      title: item?.title || 'Untitled Pull Request',
      author: item?.user?.login || 'anonymous',
      state: item?.merged_at ? 'merged' : item?.state === 'closed' ? 'closed' : 'open',
      mergedAt: item?.merged_at,
      summary: typeof item?.body === 'string' && item.body.trim() ? item.body.slice(0, 4000) : '',
      commitsCount: Number.isSafeInteger(item?.commits) ? item.commits : 0,
      url: item?.html_url || '',
      commitIds: [],
    };
    return linkedIssueId ? { ...normalized, linkedIssueId } : normalized;
  });
  return [...new Map(normalized.filter((pr) => Number.isSafeInteger(pr.id) && pr.id > 0).map((pr) => [pr.id, pr])).values()];
}

export function normalizeIssues(rawIssues: any[]): IssueEntity[] {
  if (!Array.isArray(rawIssues)) return [];
  const normalized: IssueEntity[] = rawIssues.filter((item) => !item?.pull_request).map((item) => ({
    id: item?.number ?? 0,
    title: item?.title || 'Untitled Issue',
    author: item?.user?.login || 'anonymous',
    state: (item?.state === 'closed' ? 'closed' : 'open') as IssueEntity['state'],
    labels: Array.isArray(item?.labels) ? item.labels.map((label: any) => typeof label === 'string' ? label : label?.name).filter((label: unknown): label is string => typeof label === 'string') : [],
    closedAt: item?.closed_at,
    description: typeof item?.body === 'string' ? item.body.slice(0, 4000) : '',
    url: item?.html_url || '',
  }));
  return [...new Map(normalized.filter((issue) => Number.isSafeInteger(issue.id) && issue.id > 0).map((issue) => [issue.id, issue])).values()];
}

export function buildGraphFromGitHubEntities(
  summary: RepositorySummary,
  commits: CommitEntity[],
  pullRequests: PullRequestEntity[],
  issues: IssueEntity[],
): GraphData {
  const repoId = `repo:${summary.fullName}`;
  const nodes: GraphNode[] = [{ id: repoId, label: summary.fullName, type: 'Repo' }];
  const relationships: GraphRelationship[] = [];
  const addRelationship = (source: string, target: string, type: GraphRelationship['type']) => {
    relationships.push({ id: `rel:${relationships.length + 1}`, source, target, type });
  };
  const commitNodes = new Map<string, string>();
  const issueIds = new Set(issues.map((issue) => issue.id));
  const prIds = new Set(pullRequests.map((pr) => pr.id));
  const fileNodes = new Set<string>();
  const developerNodes = new Set<string>();

  for (const commit of commits) {
    const id = `commit:${commit.id}`;
    commitNodes.set(commit.id.toLowerCase(), id);
    nodes.push({ id, label: commit.shortHash, type: 'Commit', properties: { date: commit.date } });
    if (commit.author !== 'Unknown author') {
      const developerId = `developer:${commit.author}`;
      if (!developerNodes.has(developerId)) nodes.push({ id: developerId, label: commit.author, type: 'Developer' });
      developerNodes.add(developerId);
      addRelationship(developerId, id, 'DEVELOPER_AUTHORED_COMMIT');
    }
    for (const file of commit.filesChanged) {
      const fileId = `file:${file}`;
      if (!fileNodes.has(fileId)) {
        nodes.push({ id: fileId, label: file, type: 'File' });
        addRelationship(repoId, fileId, 'REPOSITORY_CONTAINS_FILE');
        fileNodes.add(fileId);
      }
      addRelationship(id, fileId, 'COMMIT_MODIFIES_FILE');
    }
  }
  for (const pr of pullRequests) nodes.push({ id: `pr:${pr.id}`, label: `PR #${pr.id}`, type: 'PullRequest' });
  for (const issue of issues) nodes.push({ id: `issue:${issue.id}`, label: `Issue #${issue.id}`, type: 'Issue' });
  for (const pr of pullRequests) {
    for (const commitId of pr.commitIds || []) {
      const commitNode = commitNodes.get(commitId.toLowerCase());
      if (commitNode) addRelationship(`pr:${pr.id}`, commitNode, 'PULL_REQUEST_CONTAINS_COMMIT');
    }
    if (pr.linkedIssueId !== undefined && issueIds.has(pr.linkedIssueId)) addRelationship(`issue:${pr.linkedIssueId}`, `pr:${pr.id}`, 'ISSUE_LINKED_TO_PULL_REQUEST');
  }
  const counts = {
    repositories: 1,
    files: fileNodes.size,
    commits: commits.length,
    pullRequests: pullRequests.length,
    issues: issues.length,
    developers: developerNodes.size,
    total: nodes.length,
  };
  return { nodesCount: counts, relationshipsCount: relationships.length, nodes, relationships };
}
