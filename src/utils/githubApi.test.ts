import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRepoSummary,
  normalizeCommits,
  normalizePullRequests,
  normalizeIssues,
  buildGraphFromGitHubEntities,
} from './githubApi';

test('normalizeRepoSummary maps GitHub repo API correctly', () => {
  const raw = {
    name: 'express',
    full_name: 'expressjs/express',
    stargazers_count: 63000,
    forks_count: 14000,
    open_issues_count: 150,
    default_branch: 'master',
    description: 'Fast minimalist web framework',
    html_url: 'https://github.com/expressjs/express',
    license: { spdx_id: 'MIT' },
    language: 'JavaScript',
  };

  const summary = normalizeRepoSummary(raw, 'expressjs', 'express');
  assert.equal(summary.fullName, 'expressjs/express');
  assert.equal(summary.stars, 63000);
  assert.equal(summary.defaultBranch, 'master');
  assert.equal(summary.license, 'MIT');
});

test('normalizeCommits maps commit array and handles author fallback', () => {
  const rawCommits = [
    {
      sha: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      commit: {
        message: 'fix(router): improve route matching\n\nDetailed body here...',
        author: { name: 'TJ Holowaychuk', date: '2026-01-01T00:00:00Z' },
      },
      author: { login: 'tj' },
      html_url: 'https://github.com/expressjs/express/commit/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
    },
  ];

  const commits = normalizeCommits(rawCommits);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].shortHash, 'a1b2c3d');
  assert.equal(commits[0].message, 'fix(router): improve route matching\n\nDetailed body here...');
  assert.ok(commits[0].author.includes('TJ Holowaychuk'));
});

test('normalizeCommits does not fabricate missing dates or accept invalid SHAs', () => {
  const commits = normalizeCommits([
    { sha: 'not-a-sha', commit: { message: 'bad record' } },
    { sha: 'a'.repeat(40), commit: { message: 'valid record' }, html_url: 'https://github.com/acme/project/commit/' + 'a'.repeat(40) },
  ]);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].date, 'Unknown date');
  assert.deepEqual(commits[0].filesChanged, []);
});

test('normalizers deduplicate repeated commit, PR, and issue records by source ID', () => {
  const sha = 'c'.repeat(40);
  const commits = normalizeCommits([
    { sha, commit: { message: 'first' }, html_url: `https://github.com/acme/project/commit/${sha}` },
    { sha, commit: { message: 'duplicate page copy' }, html_url: `https://github.com/acme/project/commit/${sha}` },
  ]);
  const pulls = normalizePullRequests([
    { number: 3, title: 'first', html_url: 'https://github.com/acme/project/pull/3' },
    { number: 3, title: 'duplicate', html_url: 'https://github.com/acme/project/pull/3' },
  ]);
  const issues = normalizeIssues([
    { number: 4, title: 'first', html_url: 'https://github.com/acme/project/issues/4' },
    { number: 4, title: 'duplicate', html_url: 'https://github.com/acme/project/issues/4' },
  ]);
  assert.equal(commits.length, 1);
  assert.equal(pulls.length, 1);
  assert.equal(issues.length, 1);
  assert.equal(commits[0].message, 'duplicate page copy');
});

test('normalizeIssues filters out pull requests', () => {
  const rawIssues = [
    { number: 101, title: 'Bug in middleware', state: 'closed', user: { login: 'dev1' } },
    { number: 102, title: 'PR for middleware', state: 'closed', user: { login: 'dev2' }, pull_request: {} },
  ];

  const issues = normalizeIssues(rawIssues);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].id, 101);
  assert.equal(issues[0].title, 'Bug in middleware');
});

test('buildGraphFromGitHubEntities computes graph stats correctly', () => {
  const summary = normalizeRepoSummary({}, 'test', 'repo');
  const commits = [
    { id: '1', shortHash: '1', message: 'c1', author: 'dev1', date: '', filesChanged: [], url: '' },
    { id: '2', shortHash: '2', message: 'c2', author: 'dev2', date: '', filesChanged: [], url: '' },
  ];
  const graph = buildGraphFromGitHubEntities(summary, commits, [], []);
  assert.equal(graph.nodesCount.commits, 2);
  assert.equal(graph.nodesCount.developers, 2);
  assert.ok(graph.nodesCount.total > 0);
});
