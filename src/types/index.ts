export interface HealthResponse {
  status: 'ok' | 'error';
  service: string;
  version: string;
  timestamp: string;
  architecture: {
    frontend: string;
    backend: string;
    database: string;
    llm: string;
  };
  message: string;
}

export interface HealthCheckState {
  loading: boolean;
  data: HealthResponse | null;
  error: string | null;
  latencyMs: number | null;
  lastChecked: string | null;
}

export interface RepositorySummary {
  owner: string;
  repo: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  license: string;
  url: string;
  languages: string[];
  readmeExcerpt?: string;
}

export interface CommitEntity {
  id: string; // hash
  shortHash: string;
  message: string;
  author: string;
  authorAvatar?: string;
  date: string;
  filesChanged: string[];
  url: string;
}

export interface PullRequestEntity {
  id: number;
  title: string;
  author: string;
  state: 'merged' | 'open' | 'closed';
  mergedAt?: string;
  summary: string;
  linkedIssueId?: number;
  /** Commit SHAs returned by GitHub's pull request commits endpoint. */
  commitIds?: string[];
  commitsCount: number;
  url: string;
}

export interface IssueEntity {
  id: number;
  title: string;
  author: string;
  state: 'closed' | 'open';
  labels: string[];
  closedAt?: string;
  description: string;
  url: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'Repo' | 'File' | 'Function' | 'Commit' | 'PullRequest' | 'Issue' | 'Developer';
  properties?: Record<string, string | number>;
}

export interface GraphRelationship {
  id: string;
  source: string;
  target: string;
  type:
    | 'REPOSITORY_CONTAINS_FILE'
    | 'FILE_CONTAINS_FUNCTION'
    | 'COMMIT_MODIFIES_FILE'
    | 'DEVELOPER_AUTHORED_COMMIT'
    | 'PULL_REQUEST_CONTAINS_COMMIT'
    | 'ISSUE_LINKED_TO_PULL_REQUEST'
    | 'COMMIT_REFERENCES_ISSUE'
    | 'DOCUMENTATION_EXPLAINS_FEATURE';
}

export interface GraphData {
  nodesCount: {
    repositories: number;
    files: number;
    commits: number;
    pullRequests: number;
    issues: number;
    developers: number;
    total: number;
  };
  relationshipsCount: number;
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

export interface MockRepoPackage {
  summary: RepositorySummary;
  commits: CommitEntity[];
  pullRequests: PullRequestEntity[];
  issues: IssueEntity[];
  graph: GraphData;
  presetQuestions: string[];
  answers: Record<string, QAResult>;
  ingestionSummary?: {
    commitsIndexed: number;
    pullRequestsIndexed: number;
    issuesIndexed: number;
    commitDetailsFetched: number;
    pullRequestCommitLinksFetched: number;
    pageLimit: number;
    truncated: boolean;
    warnings: string[];
  };
}

export type RepositoryMode = 'demo' | 'live';

export type EvidenceStatus = 'Verified' | 'Partially Supported' | 'Insufficient Evidence';

export interface QAResult {
  question: string;
  shortAnswer: string;
  detailedReasoning: string;
  evidenceStatus: EvidenceStatus;
  confidenceScore: number; // 0 - 100
  supportingEntities: {
    commit?: CommitEntity;
    pullRequest?: PullRequestEntity;
    issue?: IssueEntity;
    file?: string;
    lineRange?: string;
  };
  sourceLinks: Array<{
    title: string;
    url: string;
    type: 'commit' | 'pr' | 'issue' | 'docs';
  }>;
}

export interface AnalysisProgressStep {
  id: number;
  title: string;
  detail: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface GitHubRateLimitInfo {
  limit: number;
  remaining: number;
  resetDate: string;
  isRateLimited: boolean;
}

export interface GitHubIngestionResponse {
  source: 'live_github_api';
  packageData: MockRepoPackage;
  rateLimit: GitHubRateLimitInfo;
  warning?: string;
}
