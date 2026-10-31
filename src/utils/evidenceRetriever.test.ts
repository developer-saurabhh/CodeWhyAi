import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQueryTokens, retrieveEvidence } from './evidenceRetriever';
import { DEMO_PAYMENT_REPO } from '../mock/demoData';

test('extractQueryTokens separates keywords, numbers, and file extensions', () => {
  const result = extractQueryTokens('Why is the retry limit set to 3 in gateway.ts?');
  assert.ok(result.keywords.includes('retry'));
  assert.ok(result.keywords.includes('limit'));
  assert.deepEqual(result.numbers, [3]);
  assert.deepEqual(result.targetFiles, ['gateway.ts']);
});

test('retrieveEvidence finds high-confidence evidence for retry limit query', () => {
  const { summary, commits, pullRequests, issues } = DEMO_PAYMENT_REPO;
  const bundle = retrieveEvidence(
    'Why is the retry limit set to 3?',
    summary,
    commits,
    pullRequests,
    issues
  );

  assert.equal(bundle.hasSufficientEvidence, true);
  assert.ok(bundle.confidenceScore >= 80);
  assert.equal(bundle.topCandidate?.commit?.shortHash, '8f2a1b4');
  assert.equal(bundle.topCandidate?.pullRequest?.id, 42);
  assert.equal(bundle.topCandidate?.issue?.id, 28);
  assert.ok(bundle.sourceUrls.length >= 2);
});

test('retrieveEvidence finds high-confidence evidence for idempotency key query', () => {
  const { summary, commits, pullRequests, issues } = DEMO_PAYMENT_REPO;
  const bundle = retrieveEvidence(
    'Why did we add an idempotency key to charges?',
    summary,
    commits,
    pullRequests,
    issues
  );

  assert.equal(bundle.hasSufficientEvidence, true);
  assert.equal(bundle.topCandidate?.commit?.shortHash, '3e9d12a');
  assert.equal(bundle.topCandidate?.pullRequest?.id, 57);
  assert.equal(bundle.topCandidate?.issue?.id, 45);
});

test('retrieveEvidence marks non-existent question as insufficient evidence', () => {
  const { summary, commits, pullRequests, issues } = DEMO_PAYMENT_REPO;
  const bundle = retrieveEvidence(
    'Why is the UI button purple?',
    summary,
    commits,
    pullRequests,
    issues
  );

  assert.equal(bundle.hasSufficientEvidence, false);
  assert.equal(bundle.confidenceScore, 0);
  assert.equal(bundle.sourceUrls.length, 0);
  assert.ok(bundle.evidenceExplanation.includes('Insufficient evidence'));
});

test('textual overlap does not create a PR-to-commit or issue-to-PR relationship', () => {
  const { summary, commits, pullRequests, issues } = DEMO_PAYMENT_REPO;
  const unlinkedPulls = pullRequests.map((pr) => ({ ...pr, commitIds: [] }));
  const bundle = retrieveEvidence('Why is the retry limit set to 3?', summary, commits, unlinkedPulls, issues);
  assert.equal(bundle.hasSufficientEvidence, false);
  assert.ok(bundle.textualMatches.length > 0);
  assert.deepEqual(bundle.explicitRelationships, []);
  assert.deepEqual(bundle.inferredRelationships, []);
  assert.equal(bundle.confidenceScore, 0);
});

test('keyword overlap without a causal rationale returns insufficient evidence', () => {
  const pr = { ...DEMO_PAYMENT_REPO.pullRequests[0], summary: 'The retry limit is 3 and the upstream gateway uses the same retry counter.' };
  const issues = DEMO_PAYMENT_REPO.issues.map((issue) => issue.id === 28
    ? { ...issue, description: 'The retry limit is 3. The upstream gateway has a retry counter.' }
    : issue);
  const bundle = retrieveEvidence(
    'Why is the retry limit set to 3?',
    DEMO_PAYMENT_REPO.summary,
    DEMO_PAYMENT_REPO.commits,
    [pr],
    issues,
    DEMO_PAYMENT_REPO.graph,
  );
  assert.equal(bundle.hasSufficientEvidence, false);
  assert.equal(bundle.confidenceScore, 0);
  assert.equal(bundle.evidenceSources.length, 0);
});

test('records with cross-repository or malformed source URLs are excluded from answer citations', () => {
  const { summary, commits, pullRequests, issues } = DEMO_PAYMENT_REPO;
  const invalidCommits = commits.map((commit, index) => index === 0 ? { ...commit, url: 'https://github.com/other/repository/commit/8f2a1b4' } : commit);
  const bundle = retrieveEvidence('Why is the retry limit set to 3?', summary, invalidCommits, pullRequests, issues);
  assert.equal(bundle.hasSufficientEvidence, false);
  assert.deepEqual(bundle.sourceUrls, []);
});

test('every source URL and ID in a sufficient bundle maps to a record from the requested repository', () => {
  const { summary, commits, pullRequests, issues } = DEMO_PAYMENT_REPO;
  const bundle = retrieveEvidence('Why is the retry limit set to 3?', summary, commits, pullRequests, issues);
  assert.equal(bundle.hasSufficientEvidence, true);
  for (const source of bundle.sourceUrls) {
    const url = new URL(source.url);
    assert.equal(url.hostname, 'github.com');
    assert.ok(url.pathname.toLowerCase().startsWith(`/${summary.fullName.toLowerCase()}/`));
    assert.ok(bundle.evidenceSources.some((candidate) => candidate.sourceId === source.sourceId && candidate.url === source.url));
  }
  for (const relation of bundle.explicitRelationships) {
    assert.ok(bundle.evidenceSources.some((source) => source.sourceId === relation.fromSourceId));
    assert.ok(bundle.evidenceSources.some((source) => source.sourceId === relation.toSourceId));
  }
  assert.ok(bundle.confidenceScore >= 0 && bundle.confidenceScore <= 100);
});

test('equally relevant conflicting PR explanations cause abstention instead of arbitrary selection', () => {
  const { summary, commits, pullRequests, issues } = DEMO_PAYMENT_REPO;
  const conflict = {
    ...pullRequests[0],
    id: 43,
    title: 'Cap gateway retry attempts to 3 to prevent upstream outage',
    summary: 'This retry limit remained at 10 rather than 3, according to the recorded discussion.',
    url: 'https://github.com/codewhy-ai/demo-payment-service/pull/43',
  };
  const bundle = retrieveEvidence('Why is the retry limit set to 3?', summary, commits, [pullRequests[0], conflict], issues);
  assert.equal(bundle.hasSufficientEvidence, false);
  assert.equal(bundle.confidenceScore, 0);
  assert.equal(bundle.topCandidate, undefined);
  assert.deepEqual(bundle.sourceUrls, []);
  assert.ok(bundle.evidenceExplanation.includes('multiple explicitly linked pull requests'));
});
