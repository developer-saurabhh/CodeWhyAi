import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMarkdownReport } from './reportExporter';
import { QAResult } from '../types';

test('generateMarkdownReport produces empty summary when no questions given', () => {
  const report = generateMarkdownReport('octocat/Hello-World', []);
  assert.ok(report.includes('octocat/Hello-World'));
  assert.ok(report.includes('No questions investigated yet'));
});

test('generateMarkdownReport produces structured markdown with verified commit and PR links', () => {
  const mockResult: QAResult = {
    question: 'Why is the retry limit set to 3?',
    shortAnswer: 'Capped at 3 to prevent cascading outages during upstream gateway timeouts.',
    detailedReasoning: 'Sarah Chen investigated Issue #28 and introduced PR #42 with exponential backoff.',
    evidenceStatus: 'Verified',
    confidenceScore: 98,
    supportingEntities: {
      commit: {
        id: 'abc123456789',
        shortHash: 'abc1234',
        message: 'fix(gateway): limit payment retries to 3 with backoff (#42)',
        author: 'Sarah Chen',
        date: '2025-11-14T10:00:00Z',
        filesChanged: ['src/services/gateway.ts'],
        url: 'https://github.com/example/repo/commit/abc1234',
      },
      pullRequest: {
        id: 42,
        title: 'fix(gateway): cap retries to 3 and add exponential backoff',
        author: 'sarahchen',
        summary: 'Fixes #28. Prevents upstream lockup.',
        state: 'closed',
        mergedAt: '2025-11-14',
        commitsCount: 3,
        url: 'https://github.com/example/repo/pull/42',
      },
      issue: {
        id: 28,
        title: 'Cascade timeouts on upstream gateway',
        author: 'marcus-ops',
        description: 'Network timeouts caused 20+ retry storms.',
        labels: [],
        state: 'closed',
        url: 'https://github.com/example/repo/issues/28',
      },
      file: 'src/services/gateway.ts',
    },
    sourceLinks: [
      { title: 'PR #42', url: 'https://github.com/example/repo/pull/42', type: 'pr' },
    ],
  };

  const report = generateMarkdownReport('example/payment-service', [mockResult]);
  assert.ok(report.includes('example/payment-service'));
  assert.ok(report.includes('Decision 1: Why is the retry limit set to 3?'));
  assert.ok(report.includes('✅ Verified (98% Confidence)'));
  assert.ok(report.includes('PR #42: fix(gateway): cap retries to 3'));
  assert.ok(report.includes('Issue #28: Cascade timeouts'));
  assert.ok(report.includes('src/services/gateway.ts'));
});
