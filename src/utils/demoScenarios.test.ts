import { test } from 'node:test';
import assert from 'node:assert';
import {
  JUDGE_DEMO_SCENARIOS,
  getDemoScenario,
  runOfflineScenario,
  validateScenarioResult,
  getRepoPackageForScenario,
} from './demoScenarios';
import { retrieveEvidence } from './evidenceRetriever';

test('all 5 judge scenarios are registered with valid metadata and queries', () => {
  assert.strictEqual(JUDGE_DEMO_SCENARIOS.length, 5);

  for (const scenario of JUDGE_DEMO_SCENARIOS) {
    assert.ok(scenario.id, 'Scenario must have an id');
    assert.ok(scenario.title, 'Scenario must have a title');
    assert.ok(scenario.question.length > 10, 'Question must be descriptive');
    assert.ok(scenario.pitchSummary.length > 20, 'Pitch summary must provide context');
    assert.ok(['Incidents', 'Reliability', 'Financial', 'Anti-Hallucination', 'Open Source'].includes(scenario.category));
  }
});

test('retry-limit scenario executes and passes all validation checks', () => {
  const scenario = getDemoScenario('retry-limit');
  assert.ok(scenario, 'retry-limit scenario must exist');

  const result = runOfflineScenario(scenario);
  assert.strictEqual(result.evidenceStatus, 'Verified');
  assert.ok(result.confidenceScore >= 95, `Confidence score ${result.confidenceScore} should be >= 95`);
  assert.ok(result.shortAnswer.includes('PR #42'), 'Answer should mention PR #42');
  assert.ok(result.supportingEntities.commit, 'Should link supporting commit');
  assert.strictEqual(result.supportingEntities.commit?.shortHash, '8f2a1b4');

  const validation = validateScenarioResult(scenario, result);
  assert.strictEqual(validation.passed, true, `Validation failed: ${validation.issues.join(', ')}`);
});

test('idempotency-key scenario executes and passes all validation checks', () => {
  const scenario = getDemoScenario('idempotency-key');
  assert.ok(scenario, 'idempotency-key scenario must exist');

  const result = runOfflineScenario(scenario);
  assert.strictEqual(result.evidenceStatus, 'Verified');
  assert.ok(result.confidenceScore >= 90);
  assert.ok(result.shortAnswer.includes('PR #57'), 'Answer should mention PR #57');
  assert.ok(result.supportingEntities.commit, 'Should link supporting commit');
  assert.strictEqual(result.supportingEntities.commit?.shortHash, '3e9d12a');

  const validation = validateScenarioResult(scenario, result);
  assert.strictEqual(validation.passed, true, `Validation failed: ${validation.issues.join(', ')}`);
});

test('fx-cache-ttl scenario executes and passes all validation checks', () => {
  const scenario = getDemoScenario('fx-cache-ttl');
  assert.ok(scenario, 'fx-cache-ttl scenario must exist');

  const result = runOfflineScenario(scenario);
  assert.strictEqual(result.evidenceStatus, 'Verified');
  assert.ok(result.confidenceScore >= 90);
  assert.ok(result.shortAnswer.includes('PR #61'), 'Answer should mention PR #61');

  const validation = validateScenarioResult(scenario, result);
  assert.strictEqual(validation.passed, true, `Validation failed: ${validation.issues.join(', ')}`);
});

test('anti-hallucination negative scenario strictly yields Insufficient Evidence with 0% confidence', () => {
  const scenario = getDemoScenario('anti-hallucination-purple-button');
  assert.ok(scenario, 'anti-hallucination scenario must exist');

  const result = runOfflineScenario(scenario);
  assert.strictEqual(result.evidenceStatus, 'Insufficient Evidence');
  assert.strictEqual(result.confidenceScore, 0);
  assert.strictEqual(result.sourceLinks.length, 0);
  assert.ok(result.detailedReasoning.includes('anti-hallucination policy') || result.detailedReasoning.includes('Insufficient'));

  const validation = validateScenarioResult(scenario, result);
  assert.strictEqual(validation.passed, true, `Validation failed: ${validation.issues.join(', ')}`);
});

test('express-body-parser scenario resolves Express 4 PR #2140 architecture', () => {
  const scenario = getDemoScenario('express-body-parser');
  assert.ok(scenario, 'express-body-parser scenario must exist');

  const pkg = getRepoPackageForScenario(scenario);
  assert.strictEqual(pkg.summary.owner, 'expressjs');

  const result = runOfflineScenario(scenario);
  assert.strictEqual(result.evidenceStatus, 'Verified');
  assert.ok(result.confidenceScore >= 85);
  assert.ok(result.shortAnswer.includes('PR #2140') || result.shortAnswer.includes('Express 4'));

  const validation = validateScenarioResult(scenario, result);
  assert.strictEqual(validation.passed, true, `Validation failed: ${validation.issues.join(', ')}`);
});

test('scenario validation engine detects status and confidence flaws correctly', () => {
  const scenario = getDemoScenario('retry-limit')!;

  const faultyResult = {
    question: scenario.question,
    shortAnswer: 'Fake short answer',
    detailedReasoning: 'Too short',
    evidenceStatus: 'Insufficient Evidence' as const, // Intentional mismatch
    confidenceScore: 30, // Too low
    supportingEntities: {},
    sourceLinks: [],
  };

  const validation = validateScenarioResult(scenario, faultyResult);
  assert.strictEqual(validation.passed, false);
  assert.ok(validation.issues.some((i) => i.includes('Status mismatch')));
  assert.ok(validation.issues.some((i) => i.includes('Confidence too low')));
});

test('edge case: dynamic retrieval with empty and noisy query terms handles safely', () => {
  const scenario = getDemoScenario('retry-limit')!;
  const repoPkg = getRepoPackageForScenario(scenario);

  // Blank query
  const emptyEvidence = retrieveEvidence('', repoPkg.summary, repoPkg.commits, repoPkg.pullRequests, repoPkg.issues, repoPkg.graph);
  assert.strictEqual(emptyEvidence.hasSufficientEvidence, false);
  assert.strictEqual(emptyEvidence.confidenceScore, 0);

  // Completely irrelevant noisy query
  const noiseEvidence = retrieveEvidence(
    'Why is the logo background gradient orange and green in the marketing newsletter?',
    repoPkg.summary,
    repoPkg.commits,
    repoPkg.pullRequests,
    repoPkg.issues,
    repoPkg.graph
  );
  assert.strictEqual(noiseEvidence.hasSufficientEvidence, false);
  assert.strictEqual(noiseEvidence.confidenceScore, 0);
});
