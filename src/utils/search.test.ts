import test from 'node:test';
import assert from 'node:assert/strict';
import { searchDemoEvidence } from './search';

test('searchDemoEvidence returns verified retry answer when asking about retry limit', () => {
  const result = searchDemoEvidence('Why is the retry limit set to 3?');
  assert.equal(result.evidenceStatus, 'Verified');
  assert.ok(result.shortAnswer.includes('Capping at 3 attempts with exponential backoff'));
  assert.equal(result.supportingEntities.pullRequest?.id, 42);
});

test('searchDemoEvidence returns verified idempotency answer when asking about double charging', () => {
  const result = searchDemoEvidence('Why did we add idempotency key?');
  assert.equal(result.evidenceStatus, 'Verified');
  assert.ok(result.shortAnswer.includes('mobile clients experienced poor connectivity'));
  assert.equal(result.supportingEntities.pullRequest?.id, 57);
});

test('searchDemoEvidence returns Insufficient Evidence when no documentation exists', () => {
  const result = searchDemoEvidence('Why is the button purple?');
  assert.equal(result.evidenceStatus, 'Insufficient Evidence');
  assert.equal(result.confidenceScore, 0);
  assert.equal(result.sourceLinks.length, 0);
});

test('searchDemoEvidence returns fallback Insufficient Evidence for unknown questions', () => {
  const result = searchDemoEvidence('Why do we use port 9999?');
  assert.equal(result.evidenceStatus, 'Insufficient Evidence');
});
