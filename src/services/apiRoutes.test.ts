import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeRepositoryRequest, explainRepositoryRequest, IndexedRepository } from '../../server';
import { DEMO_PAYMENT_REPO } from '../mock/demoData';

function response(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

test('GitHub API handler preserves invalid URL, not-found and rate-limit statuses', async () => {
  const invalid = await analyzeRepositoryRequest('https://evil.example/acme/repo');
  assert.equal(invalid.statusCode, 400);
  const missing = await analyzeRepositoryRequest('acme/missing', { fetchImpl: async () => response({ message: 'Not Found' }, 404) });
  assert.equal(missing.statusCode, 404);
  const limited = await analyzeRepositoryRequest('acme/limited', { fetchImpl: async () => response({ message: 'API rate limit exceeded' }, 403, { 'x-ratelimit-remaining': '0' }) });
  assert.equal(limited.statusCode, 429);
  const denied = await analyzeRepositoryRequest('acme/private', { fetchImpl: async () => response({ message: 'Resource not accessible' }, 403) });
  assert.equal(denied.statusCode, 403);
});

test('AI API handler validates empty, oversized, and mode-less questions', async () => {
  const indexes = new Map<string, IndexedRepository>();
  const empty = await explainRepositoryRequest({ question: '  ', repoName: 'codewhy-ai/demo-payment-service', mode: 'demo' }, indexes, { apiKey: '' });
  assert.equal(empty.statusCode, 400);
  const tooLong = await explainRepositoryRequest({ question: 'x'.repeat(2001), repoName: 'codewhy-ai/demo-payment-service', mode: 'demo' }, indexes, { apiKey: '' });
  assert.equal(tooLong.statusCode, 413);
  const modeMissing = await explainRepositoryRequest({ question: 'Why?', repoName: 'codewhy-ai/demo-payment-service' }, indexes, { apiKey: '' });
  assert.equal(modeMissing.statusCode, 400);
});

test('server ignores frontend evidence and answers from the exact curated Demo Mode repository', async () => {
  const forged = await explainRepositoryRequest({
    question: 'Why is the primary UI theme button purple?',
    repoName: 'codewhy-ai/demo-payment-service',
    mode: 'demo',
    evidenceBundle: {
      hasSufficientEvidence: true,
      confidenceScore: 100000,
      topCandidate: { commit: { id: 'invented', shortHash: 'f00ba12' }, pullRequest: { id: 999 }, issue: { id: 998 } },
      sourceUrls: [{ title: 'Fake', url: 'https://github.com/other/repo/pull/999', type: 'pr' }],
    },
  }, new Map(), { apiKey: '' });
  assert.equal(forged.statusCode, 200);
  assert.equal(forged.body.modelUsed, 'Curated Demo Knowledge Base');
  const result = forged.body.result as any;
  assert.equal(result.evidenceStatus, 'Insufficient Evidence');
  assert.equal(result.confidenceScore, 0);
  assert.deepEqual(result.sourceLinks, []);

  const mismatch = await explainRepositoryRequest({ question: 'Why?', repoName: 'attacker/other', mode: 'demo' }, new Map(), { apiKey: '' });
  assert.equal(mismatch.statusCode, 404);
  const unindexedLive = await explainRepositoryRequest({ question: 'Why?', repoName: 'acme/payments', mode: 'live' }, new Map(), { apiKey: '' });
  assert.equal(unindexedLive.statusCode, 409);
});

test('live answer lookup requires exact server-side index identity and ignores supplied evidence', async () => {
  const indexes = new Map<string, IndexedRepository>([[DEMO_PAYMENT_REPO.summary.fullName.toLowerCase(), { packageData: DEMO_PAYMENT_REPO, expiresAt: Date.now() + 60_000 }]]);
  const answer = await explainRepositoryRequest({
    question: 'Why is the retry limit set to 3?',
    repoName: DEMO_PAYMENT_REPO.summary.fullName,
    mode: 'live',
    evidenceBundle: { hasSufficientEvidence: false, sourceUrls: [] },
  }, indexes, { apiKey: '' });
  assert.equal(answer.statusCode, 200);
  assert.equal(answer.body.modelUsed, 'Grounded Rule Synthesizer');
  assert.equal((answer.body.result as any).evidenceStatus, 'Verified');
  assert.ok(((answer.body.result as any).sourceLinks as Array<{ url: string }>).every((link) => link.url.includes('codewhy-ai/demo-payment-service')));

  const expired = new Map<string, IndexedRepository>([[DEMO_PAYMENT_REPO.summary.fullName.toLowerCase(), { packageData: DEMO_PAYMENT_REPO, expiresAt: 1 }]]);
  const expiredAnswer = await explainRepositoryRequest({ question: 'Why?', repoName: DEMO_PAYMENT_REPO.summary.fullName, mode: 'live' }, expired, { apiKey: '', now: 10 });
  assert.equal(expiredAnswer.statusCode, 409);
});

test('Gemini provider is returned only after successful invocation and validated citations', async () => {
  const validSource = DEMO_PAYMENT_REPO.pullRequests[0];
  const quote = 'Capping at 3 attempts with exponential backoff reduces network amplification by 70%.';
  const valid = await explainRepositoryRequest({ question: 'Why is the retry limit set to 3?', repoName: DEMO_PAYMENT_REPO.summary.fullName, mode: 'demo' }, new Map(), {
    apiKey: 'configured-for-test',
    generateModel: async () => JSON.stringify({ claims: [{ sourceId: `pr:${validSource.id}`, quote }] }),
  });
  assert.equal(valid.body.modelUsed, 'Google Gemini 2.5 Flash');

  const invalid = await explainRepositoryRequest({ question: 'Why is the retry limit set to 3?', repoName: DEMO_PAYMENT_REPO.summary.fullName, mode: 'demo' }, new Map(), {
    apiKey: 'configured-for-test',
    generateModel: async () => JSON.stringify({ claims: [{ sourceId: 'pr:999', quote }] }),
  });
  assert.equal(invalid.body.modelUsed, 'Curated Demo Knowledge Base');

  const credentialFailure = await explainRepositoryRequest({ question: 'Why is the retry limit set to 3?', repoName: DEMO_PAYMENT_REPO.summary.fullName, mode: 'demo' }, new Map(), {
    apiKey: 'invalid-key-for-test',
    generateModel: async () => { throw new Error('simulated invalid credentials'); },
  });
  assert.equal(credentialFailure.body.modelUsed, 'Curated Demo Knowledge Base');
  assert.equal((credentialFailure.body.result as any).evidenceStatus, 'Verified');
});
