import { GitHubRateLimitInfo, MockRepoPackage } from '../types';
import {
  buildGraphFromGitHubEntities,
  normalizeCommits,
  normalizeIssues,
  normalizePullRequests,
  normalizeRepoSummary,
} from '../utils/githubApi';

export const GITHUB_PAGE_LIMIT = 3;
const API_ROOT = 'https://api.github.com';

export class GitHubIngestionError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'GitHubIngestionError';
  }
}

export interface GitHubIngestionResult {
  packageData: MockRepoPackage;
  rateLimit: GitHubRateLimitInfo;
  warning?: string;
}

export function parseRepositoryUrl(input: unknown): { owner: string; repo: string } {
  if (typeof input !== 'string' || input.length > 512) throw new GitHubIngestionError('A valid GitHub repository URL is required.', 400);
  const trimmed = input.trim();
  let path: string;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com' || url.username || url.password || url.search || url.hash) {
        throw new Error('unsupported URL');
      }
      path = url.pathname.replace(/^\/+|\/+$/g, '');
    } catch {
      throw new GitHubIngestionError('Enter a GitHub URL in the form https://github.com/owner/repository.', 400);
    }
  } else {
    path = trimmed.replace(/\/+$/g, '');
  }
  path = path.replace(/\.git$/i, '');
  const parts = path.split('/');
  if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_.-]{1,100}$/.test(part)) || parts.some((part) => part === '.' || part === '..')) {
    throw new GitHubIngestionError('Enter a GitHub repository as owner/repository or a full github.com URL.', 400);
  }
  return { owner: parts[0], repo: parts[1] };
}

function rateLimitFrom(headers: Headers): GitHubRateLimitInfo {
  const limit = Number(headers.get('x-ratelimit-limit') || 60);
  const remaining = Number(headers.get('x-ratelimit-remaining') || 60);
  const reset = Number(headers.get('x-ratelimit-reset') || 0);
  return {
    limit: Number.isFinite(limit) ? limit : 60,
    remaining: Number.isFinite(remaining) ? remaining : 0,
    resetDate: reset > 0 ? new Date(reset * 1000).toISOString() : new Date(Date.now() + 3600000).toISOString(),
    isRateLimited: remaining <= 0,
  };
}

function nextPageUrl(linkHeader: string | null): string | undefined {
  if (!linkHeader) return undefined;
  for (const part of linkHeader.split(',')) {
    const match = part.trim().match(/^<([^>]+)>;\s*rel="?([^";]+)"?/);
    if (match?.[2].split(/\s+/).includes('next')) {
      const url = new URL(match[1]);
      if (url.origin !== API_ROOT) return undefined;
      return url.toString();
    }
  }
  return undefined;
}

async function requestJson(
  url: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<{ data: any; response: Response }> {
  let response: Response;
  try {
    response = await fetchImpl(url, { headers });
  } catch {
    throw new GitHubIngestionError('Could not reach GitHub. Check the network and try again.', 502);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const remaining = Number(response.headers.get('x-ratelimit-remaining') ?? '1');
    const bodyMessage = typeof data?.message === 'string' ? data.message : '';
    const isRateLimited = response.status === 429 || (response.status === 403 && (remaining <= 0 || /rate limit/i.test(bodyMessage)));
    const code = isRateLimited ? 429 : response.status === 401 ? 401 : response.status === 403 ? 403 : response.status === 404 ? 404 : response.status >= 500 ? 502 : response.status;
    const message = isRateLimited
      ? 'GitHub API rate limit reached. Wait for the reset time or configure a server-side GITHUB_TOKEN.'
      : response.status === 403
        ? 'GitHub denied access to this repository or endpoint.'
        : response.status === 404
          ? 'Repository or requested GitHub resource was not found (it may be private).'
          : response.status === 401
            ? 'GitHub rejected the server-side token. Check GITHUB_TOKEN.'
            : bodyMessage || `GitHub returned HTTP ${response.status}.`;
    throw new GitHubIngestionError(message, code);
  }
  return { data, response };
}

async function fetchPaged(
  url: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<{ records: any[]; pages: number; truncated: boolean; response: Response }> {
  const records: any[] = [];
  let pageUrl: string | undefined = url;
  let pages = 0;
  let lastResponse: Response | undefined;
  while (pageUrl && pages < GITHUB_PAGE_LIMIT) {
    const { data, response } = await requestJson(pageUrl, headers, fetchImpl);
    lastResponse = response;
    pages += 1;
    if (!Array.isArray(data)) throw new GitHubIngestionError('GitHub returned an unexpected list response.', 502);
    records.push(...data);
    pageUrl = nextPageUrl(response.headers.get('link'));
  }
  return { records, pages, truncated: Boolean(pageUrl), response: lastResponse! };
}

function linkedIssueNumbers(body: unknown, owner: string, repo: string): number[] {
  if (typeof body !== 'string') return [];
  const pattern = /\b(?:close[sd]?|fix(?:es|ed)?|resolve[sd]?)\s+(?:(?<owner>[\w.-]+)\/(?<repo>[\w.-]+))?#(?<number>\d+)\b/gi;
  const numbers = new Set<number>();
  for (const match of body.matchAll(pattern)) {
    const refOwner = match.groups?.owner;
    const refRepo = match.groups?.repo;
    if ((!refOwner && !refRepo) || (refOwner?.toLowerCase() === owner.toLowerCase() && refRepo?.toLowerCase() === repo.toLowerCase())) {
      const number = Number(match.groups?.number);
      if (Number.isSafeInteger(number) && number > 0) numbers.add(number);
    }
  }
  return [...numbers];
}

export async function ingestGitHubRepository(
  input: unknown,
  options: { token?: string; fetchImpl?: typeof fetch; maxCommitDetails?: number; maxPullRequestLinks?: number } = {},
): Promise<GitHubIngestionResult> {
  const { owner, repo } = parseRepositoryUrl(input);
  const fetchImpl = options.fetchImpl || fetch;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'CodeWhyAI-Hackathon-Prototype',
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const repoPath = `${API_ROOT}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const { data: rawRepo, response: repoResponse } = await requestJson(repoPath, headers, fetchImpl);
  if (typeof rawRepo?.full_name !== 'string' || rawRepo.full_name.toLowerCase() !== `${owner}/${repo}`.toLowerCase()) {
    throw new GitHubIngestionError('GitHub repository identity did not match the requested owner/repository.', 502);
  }
  let latestResponse = repoResponse;
  const warnings: string[] = [];
  const commitPageRequest = fetchPaged(`${repoPath}/commits?per_page=100&page=1`, headers, fetchImpl).catch((error: unknown) => {
    if (error instanceof GitHubIngestionError && error.statusCode === 409) {
      warnings.push('This repository has no commits yet.');
      return { records: [], pages: 0, truncated: false, response: repoResponse };
    }
    throw error;
  });
  const [commitPage, pullPage, issuePage] = await Promise.all([
    commitPageRequest,
    fetchPaged(`${repoPath}/pulls?state=all&per_page=100&page=1`, headers, fetchImpl),
    fetchPaged(`${repoPath}/issues?state=all&per_page=100&page=1`, headers, fetchImpl),
  ]);
  latestResponse = issuePage.response;
  if (commitPage.truncated || pullPage.truncated || issuePage.truncated) warnings.push(`Index capped at ${GITHUB_PAGE_LIMIT} pages per GitHub endpoint; the full repository history was not indexed.`);

  let readmeExcerpt = '';
  try {
    const { data: readme } = await requestJson(`${repoPath}/readme`, headers, fetchImpl);
    if (typeof readme?.content === 'string') readmeExcerpt = Buffer.from(readme.content, 'base64').toString('utf8').slice(0, 3000);
  } catch (error) {
    if (!(error instanceof GitHubIngestionError && error.statusCode === 404)) warnings.push('README could not be fetched.');
  }

  const summary = normalizeRepoSummary({ ...rawRepo, readmeExcerpt }, owner, repo);
  const issues = normalizeIssues(issuePage.records);
  const pullRequests = normalizePullRequests(pullPage.records, owner, repo, issues.map((issue) => issue.id));
  let commits = normalizeCommits(commitPage.records);
  const commitDetailLimit = Math.max(0, Math.min(options.maxCommitDetails ?? 10, commits.length));
  let commitDetailsFetched = 0;
  const commitDetails = await Promise.all(commits.slice(0, commitDetailLimit).map(async (commit) => {
    try {
      const { data } = await requestJson(`${repoPath}/commits/${encodeURIComponent(commit.id)}`, headers, fetchImpl);
      commitDetailsFetched += 1;
      return { id: commit.id, filesChanged: Array.isArray(data?.files) ? data.files.map((file: any) => file.filename).filter((name: unknown) => typeof name === 'string') : [] };
    } catch (error) {
      if (error instanceof GitHubIngestionError && error.statusCode === 429) warnings.push('GitHub rate limit stopped some commit detail requests.');
      return { id: commit.id, filesChanged: [] as string[] };
    }
  }));
  const filesByCommit = new Map(commitDetails.map((detail) => [detail.id, detail.filesChanged]));
  commits = commits.map((commit) => ({ ...commit, filesChanged: filesByCommit.get(commit.id) || [] }));
  if (commitDetailsFetched < commits.length) warnings.push(`Changed-file details fetched for ${commitDetailsFetched} of ${commits.length} indexed commits.`);

  const pullRequestLinkLimit = Math.max(0, Math.min(options.maxPullRequestLinks ?? 10, pullRequests.length));
  let pullRequestCommitLinksFetched = 0;
  const linkedPulls = await Promise.all(pullRequests.slice(0, pullRequestLinkLimit).map(async (pr) => {
    try {
      const { data } = await requestJson(`${repoPath}/pulls/${pr.id}/commits?per_page=100&page=1`, headers, fetchImpl);
      if (!Array.isArray(data)) return pr;
      pullRequestCommitLinksFetched += 1;
      return { ...pr, commitIds: [...new Set(data.map((item: any) => item?.sha).filter((sha: unknown) => typeof sha === 'string' && /^[a-f\d]{40}$/i.test(sha)))] };
    } catch (error) {
      if (error instanceof GitHubIngestionError && error.statusCode === 429) warnings.push('GitHub rate limit stopped some pull request commit-link requests.');
      return pr;
    }
  }));
  const pullsById = new Map(linkedPulls.map((pr) => [pr.id, pr]));
  const linkedWithIssues = pullRequests.map((pr) => {
    const body = pullPage.records.find((record) => record?.number === pr.id)?.body;
    const explicitRefs = linkedIssueNumbers(body, owner, repo);
    const linkedIssueId = explicitRefs.find((number) => issues.some((issue) => issue.id === number));
    return { ...pullsById.get(pr.id)!, ...(linkedIssueId ? { linkedIssueId } : {}) };
  });
  if (pullRequestCommitLinksFetched < pullRequests.length) warnings.push(`Explicit PR-to-commit links fetched for ${pullRequestCommitLinksFetched} of ${pullRequests.length} indexed pull requests.`);

  const graph = buildGraphFromGitHubEntities(summary, commits, linkedWithIssues, issues);
  const presetQuestions = [
    commits[0] ? `What does commit ${commits[0].shortHash} say about its change?` : 'Why was the repository created?',
    linkedWithIssues[0] ? `What does PR #${linkedWithIssues[0].id} say about its change?` : 'What decisions are documented in this repository?',
    issues[0] ? `What does Issue #${issues[0].id} report?` : 'What problems are documented in this repository?',
  ];
  if (commitPage.records.length === 0) warnings.push('No commits were returned for this repository.');
  const packageData: MockRepoPackage = {
    summary,
    commits,
    pullRequests: linkedWithIssues,
    issues,
    graph,
    presetQuestions,
    answers: {},
    ingestionSummary: {
      commitsIndexed: commits.length,
      pullRequestsIndexed: linkedWithIssues.length,
      issuesIndexed: issues.length,
      commitDetailsFetched,
      pullRequestCommitLinksFetched,
      pageLimit: GITHUB_PAGE_LIMIT,
      truncated: Boolean(commitPage.truncated || pullPage.truncated || issuePage.truncated),
      warnings: [...new Set(warnings)],
    },
  };
  const rateLimit = rateLimitFrom(latestResponse.headers);
  return { packageData, rateLimit, ...(warnings.length ? { warning: [...new Set(warnings)].join(' ') } : {}) };
}
