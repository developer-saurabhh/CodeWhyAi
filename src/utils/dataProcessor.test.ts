import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractIssueReferences,
  parseConventionalCommit,
  processRepositoryGraph,
} from './dataProcessor';
import { RepositorySummary, CommitEntity, PullRequestEntity, IssueEntity } from '../types';

test('extractIssueReferences returns only explicit issue-closing references', () => {
  const text1 = 'fix(retry): limit gateway request retries to 3 (fixes #28)';
  const refs1 = extractIssueReferences(text1);
  assert.deepEqual(refs1, [28]);

  const text2 = 'feat: implement payment deduplication (#57), see #41, and resolves #45';
  const refs2 = extractIssueReferences(text2);
  assert.ok(!refs2.includes(57));
  assert.ok(!refs2.includes(41));
  assert.ok(refs2.includes(45));

  const text3 = 'chore: routine cleanup with no issue numbers';
  const refs3 = extractIssueReferences(text3);
  assert.equal(refs3.length, 0);
});

test('parseConventionalCommit extracts type, scope, and subject', () => {
  const msg = 'fix(retry): limit gateway request retries to 3\n\nDetailed rationale here.';
  const parsed = parseConventionalCommit(msg);
  assert.equal(parsed.type, 'fix');
  assert.equal(parsed.scope, 'retry');
  assert.equal(parsed.subject, 'limit gateway request retries to 3');
});

test('parseConventionalCommit handles non-conventional commit messages gracefully', () => {
  const msg = 'Update README.md with setup instructions';
  const parsed = parseConventionalCommit(msg);
  assert.equal(parsed.type, 'other');
  assert.equal(parsed.subject, 'Update README.md with setup instructions');
});

test('processRepositoryGraph produces an in-memory preview from indexed explicit relationships', () => {
  const summary: RepositorySummary = {
    owner: 'expressjs',
    repo: 'express',
    fullName: 'expressjs/express',
    description: 'Fast web framework',
    stars: 69000,
    forks: 25000,
    openIssues: 200,
    defaultBranch: 'master',
    license: 'MIT',
    url: 'https://github.com/expressjs/express',
    languages: ['JavaScript'],
  };

  const commits: CommitEntity[] = [
    {
      id: '8f2a1b49c0d5e1f72a9b3c4d5e6f7a8b9c0d1e2f',
      shortHash: '8f2a1b4',
      message: 'fix(router): prevent regex DOS (closes #142)',
      author: 'TJ Holowaychuk',
      date: '2026-01-01T00:00:00Z',
      filesChanged: ['lib/router/index.js'],
      url: 'https://github.com/expressjs/express/commit/8f2a1b4',
    },
  ];

  const pullRequests: PullRequestEntity[] = [
    {
      id: 200,
      title: 'PR #200: Router speed improvements',
      author: 'dougwilson',
      state: 'merged',
      summary: 'Resolves issue #142 by upgrading regex compiler.',
      linkedIssueId: 142,
      commitsCount: 1,
      url: 'https://github.com/expressjs/express/pull/200',
    },
  ];

  const issues: IssueEntity[] = [
    {
      id: 142,
      title: 'Issue #142: Slow regex evaluation on malformed routes',
      author: 'security-researcher',
      state: 'closed',
      labels: ['bug', 'security'],
      description: 'ReDoS vulnerability in route matching.',
      url: 'https://github.com/expressjs/express/issues/142',
    },
  ];

  const result = processRepositoryGraph(summary, commits, pullRequests, issues);

  assert.ok(result.nodes.length >= 4); // repo, commit, dev, file, pr, issue
  assert.ok(result.relationships.length >= 4);
  assert.ok(result.relationships.every((relationship) =>
    result.nodes.some((node) => node.id === relationship.source)
      && result.nodes.some((node) => node.id === relationship.target)
  ));
  assert.equal(result.crossReferenceLinks.length, 2); // 1 from commit (closes #142), 1 from PR (issue #142)
  assert.equal(result.relationshipPreviewPayload.nodes.length, result.nodes.length);
  assert.equal(result.relationshipPreviewPayload.relationships.length, result.relationships.length);
});

test('processRepositoryGraph does not create edges to missing issue records or generic references', () => {
  const summary: RepositorySummary = {
    owner: 'acme', repo: 'service', fullName: 'acme/service', description: '', stars: 0, forks: 0,
    openIssues: 0, defaultBranch: 'main', license: '', url: 'https://github.com/acme/service', languages: [],
  };
  const commit: CommitEntity = {
    id: 'abcdef0123456789abcdef0123456789abcdef01', shortHash: 'abcdef0',
    message: 'fix: stabilize retries; see #41; closes #999', author: 'dev', date: '2026-01-01T00:00:00Z',
    filesChanged: [], url: 'https://github.com/acme/service/commit/abcdef0',
  };
  const result = processRepositoryGraph(summary, [commit], [], []);
  assert.equal(result.crossReferenceLinks.length, 0);
  assert.ok(!result.relationships.some((relationship) => relationship.target === 'issue:41' || relationship.target === 'issue:999'));
});
