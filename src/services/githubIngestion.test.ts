import test from 'node:test';
import assert from 'node:assert/strict';
import { GitHubIngestionError, ingestGitHubRepository, parseRepositoryUrl } from './githubIngestion';

function response(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

const repo = {
  full_name: 'acme/payments', name: 'payments', owner: { login: 'acme' }, html_url: 'https://github.com/acme/payments',
  default_branch: 'main', description: 'Payments', stargazers_count: 3, forks_count: 1,
};
const sha1 = 'a'.repeat(40);
const sha2 = 'b'.repeat(40);
const commit = (sha: string, message: string) => ({
  sha, html_url: `https://github.com/acme/payments/commit/${sha}`,
  commit: { message, author: { name: 'Developer', date: '2025-01-01T00:00:00Z' } },
  author: { login: 'dev' },
});

test('repository parser accepts owner/repo and HTTPS GitHub repository URLs only', () => {
  assert.deepEqual(parseRepositoryUrl('acme/payments'), { owner: 'acme', repo: 'payments' });
  assert.deepEqual(parseRepositoryUrl('https://github.com/acme/payments.git/'), { owner: 'acme', repo: 'payments' });
  for (const value of ['https://evil.example/acme/payments', 'https://github.com.evil.example/acme/payments', 'https://github.com/acme/../secret', 'https://github.com/acme/payments/issues']) {
    assert.throws(() => parseRepositoryUrl(value), (error: unknown) => error instanceof GitHubIngestionError && error.statusCode === 400);
  }
});

test('live ingestion paginates data, enriches bounded commit metadata, and verifies explicit PR links', async () => {
  const requests: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    if (url === 'https://api.github.com/repos/acme/payments') return response(repo, 200, { 'x-ratelimit-limit': '60', 'x-ratelimit-remaining': '42' });
    if (url.endsWith('/commits?per_page=100&page=1')) return response([commit(sha1, 'fix: retry limit')], 200, { link: '<https://api.github.com/repos/acme/payments/commits?per_page=100&page=2>; rel="next"' });
    if (url.endsWith('/commits?per_page=100&page=2')) return response([commit(sha2, 'test: add case')]);
    if (url.endsWith('/pulls?state=all&per_page=100&page=1')) return response([{ number: 9, title: 'Bound retries', body: 'Fixes #12', state: 'closed', merged_at: '2025-01-02', commits: 1, html_url: 'https://github.com/acme/payments/pull/9', user: { login: 'dev' } }]);
    if (url.endsWith('/issues?state=all&per_page=100&page=1')) return response([{ number: 12, title: 'Retry storm', body: 'Retries flooded the gateway.', state: 'closed', html_url: 'https://github.com/acme/payments/issues/12', user: { login: 'ops' }, labels: [] }], 200, { 'x-ratelimit-remaining': '42' });
    if (url.endsWith('/readme')) return response({}, 404);
    if (url.endsWith(`/commits/${sha1}`)) return response({ files: [{ filename: 'src/retry.ts' }] });
    if (url.endsWith(`/commits/${sha2}`)) return response({ files: [{ filename: 'test/retry.test.ts' }] });
    if (url.endsWith('/pulls/9/commits?per_page=100&page=1')) return response([commit(sha1, 'fix: retry limit')]);
    throw new Error(`Unexpected test request: ${url}`);
  };

  const result = await ingestGitHubRepository('acme/payments', { fetchImpl });
  assert.equal(result.packageData.summary.fullName, 'acme/payments');
  assert.equal(result.packageData.commits.length, 2);
  assert.deepEqual(result.packageData.commits[0].filesChanged, ['src/retry.ts']);
  assert.deepEqual(result.packageData.pullRequests[0].commitIds, [sha1]);
  assert.equal(result.packageData.pullRequests[0].linkedIssueId, 12);
  assert.equal(result.packageData.graph.relationships.filter((edge) => edge.type === 'PULL_REQUEST_CONTAINS_COMMIT').length, 1);
  assert.equal(result.packageData.graph.relationships.filter((edge) => edge.type === 'ISSUE_LINKED_TO_PULL_REQUEST').length, 1);
  assert.equal(result.packageData.ingestionSummary?.commitsIndexed, 2);
  assert.equal(result.packageData.ingestionSummary?.truncated, false);
  assert.ok(requests.some((url) => url.endsWith('commits?per_page=100&page=2')));
  assert.equal(result.rateLimit.remaining, 42);
});

test('GitHub API response codes remain distinct and network errors are reported as gateway failures', async () => {
  const scenarios: Array<{ status: number; headers?: Record<string, string>; expected: number }> = [
    { status: 401, expected: 401 },
    { status: 403, expected: 403 },
    { status: 403, headers: { 'x-ratelimit-remaining': '0' }, expected: 429 },
    { status: 404, expected: 404 },
    { status: 429, expected: 429 },
  ];
  for (const scenario of scenarios) {
    await assert.rejects(
      ingestGitHubRepository('acme/payments', { fetchImpl: async () => response({ message: 'denied' }, scenario.status, scenario.headers) }),
      (error: unknown) => error instanceof GitHubIngestionError && error.statusCode === scenario.expected,
    );
  }
  await assert.rejects(
    ingestGitHubRepository('acme/payments', { fetchImpl: async () => { throw new Error('offline'); } }),
    (error: unknown) => error instanceof GitHubIngestionError && error.statusCode === 502,
  );
});

test('empty repositories stay empty and missing identity metadata is rejected', async () => {
  const emptyFetch: typeof fetch = async (input) => {
    const url = String(input);
    if (url === 'https://api.github.com/repos/acme/payments') return response(repo);
    if (url.includes('/commits?')) return response({ message: 'Git Repository is empty.' }, 409);
    if (url.includes('/pulls?') || url.includes('/issues?')) return response([]);
    if (url.endsWith('/readme')) return response({}, 404);
    throw new Error(`Unexpected request: ${url}`);
  };
  const emptyResult = await ingestGitHubRepository('acme/payments', { fetchImpl: emptyFetch });
  assert.equal(emptyResult.packageData.summary.fullName, 'acme/payments');
  assert.equal(emptyResult.packageData.commits.length, 0);
  assert.ok(emptyResult.warning?.includes('no commits'));

  await assert.rejects(
    ingestGitHubRepository('acme/payments', { fetchImpl: async () => response({ name: 'payments' }) }),
    (error: unknown) => error instanceof GitHubIngestionError && error.statusCode === 502,
  );
});
