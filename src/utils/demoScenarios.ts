import { QAResult, EvidenceStatus } from '../types';
import { DEMO_PAYMENT_REPO, DEMO_EXPRESS_REPO } from '../mock/demoData';
import { retrieveEvidence } from './evidenceRetriever';
import { parseAIExplanation } from './aiPrompt';

export interface JudgeDemoScenario {
  id: string;
  title: string;
  badge: string;
  category: 'Incidents' | 'Reliability' | 'Financial' | 'Anti-Hallucination' | 'Open Source';
  repoUrl: string;
  repoPackageName: 'demo-payment-service' | 'express';
  question: string;
  expectedStatus: EvidenceStatus;
  minConfidence: number;
  maxConfidence?: number;
  targetFile?: string;
  targetLine?: number;
  graphFocusNodeId?: string;
  pitchSummary: string;
  keyTakeaway: string;
}

export const JUDGE_DEMO_SCENARIOS: JudgeDemoScenario[] = [
  {
    id: 'retry-limit',
    title: 'Payment Gateway Retry Cap (3)',
    badge: 'Curated Demo · Incident',
    category: 'Incidents',
    repoUrl: 'codewhy-ai/demo-payment-service',
    repoPackageName: 'demo-payment-service',
    question: 'Why is the retry limit set to 3?',
    expectedStatus: 'Verified',
    minConfidence: 95,
    targetFile: 'src/services/gateway.ts',
    targetLine: 11,
    graphFocusNodeId: 'commit-1',
    pitchSummary:
      'Curated demo records connect the retry-limit commit to PR #42 and Issue #28. Their excerpts describe the retry cap and an upstream timeout incident.',
    keyTakeaway: 'Shows how explicitly linked demo records can provide context for a code change.',
  },
  {
    id: 'idempotency-key',
    title: 'Idempotency Key Enforcement',
    badge: 'Curated Demo · Reliability',
    category: 'Reliability',
    repoUrl: 'codewhy-ai/demo-payment-service',
    repoPackageName: 'demo-payment-service',
    question: 'Why was the idempotency key added to charges?',
    expectedStatus: 'Verified',
    minConfidence: 90,
    targetFile: 'src/routes/charges.ts',
    targetLine: 7,
    graphFocusNodeId: 'commit-2',
    pitchSummary:
      'Curated demo records connect the idempotency-key commit to PR #57 and Issue #45. The excerpts describe duplicate-charge risk when payment requests are retried.',
    keyTakeaway: 'Shows an explicit link between a code change and its documented issue in the fixture.',
  },
  {
    id: 'fx-cache-ttl',
    title: 'FX Exchange Rates 60s TTL',
    badge: 'Curated Demo · FX Caching',
    category: 'Financial',
    repoUrl: 'codewhy-ai/demo-payment-service',
    repoPackageName: 'demo-payment-service',
    question: 'Why is the FX cache TTL set to 60 seconds?',
    expectedStatus: 'Verified',
    minConfidence: 90,
    targetFile: 'src/services/fxRates.ts',
    targetLine: 6,
    graphFocusNodeId: 'commit-3',
    pitchSummary:
      'Curated demo records connect the cache-TTL commit to PR #61 and Issue #51. Their excerpts describe stale exchange-rate quotes and the shorter cache window.',
    keyTakeaway: 'Shows how linked issue and pull-request excerpts can document a configuration change.',
  },
  {
    id: 'anti-hallucination-purple-button',
    title: 'Negative Control: Purple Button',
    badge: 'Curated Demo · Negative Control',
    category: 'Anti-Hallucination',
    repoUrl: 'codewhy-ai/demo-payment-service',
    repoPackageName: 'demo-payment-service',
    question: 'Why is the primary UI theme button purple?',
    expectedStatus: 'Insufficient Evidence',
    minConfidence: 0,
    maxConfidence: 0,
    pitchSummary:
      'The curated fixture contains no explicitly linked rationale for this question, so the answer path should return Insufficient Evidence.',
    keyTakeaway: 'Demonstrates abstention for this fixture; it is not a guarantee that every unsupported claim will be detected.',
  },
  {
    id: 'express-body-parser',
    title: 'Express 4.x Modularization',
    badge: 'Curated Demo · OSS Example',
    category: 'Open Source',
    repoUrl: 'expressjs/express',
    repoPackageName: 'express',
    question: 'Why was body-parser removed from Express 4 core?',
    expectedStatus: 'Verified',
    minConfidence: 85,
    graphFocusNodeId: 'commit-exp-1',
    pitchSummary:
      'The curated Express example connects indexed commit, pull-request, and issue records whose excerpts discuss separating middleware from the framework core.',
    keyTakeaway: 'Shows the answer flow using a curated open-source example; records are not fetched for this demo scenario.',
  },
];

/**
 * Retrieves a demo scenario by its unique identifier.
 */
export function getDemoScenario(id: string): JudgeDemoScenario | undefined {
  return JUDGE_DEMO_SCENARIOS.find((s) => s.id === id);
}

/**
 * Validates whether a QAResult conforms to the scenario requirements.
 */
export function validateScenarioResult(
  scenario: JudgeDemoScenario,
  result: QAResult
): {
  passed: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (result.evidenceStatus !== scenario.expectedStatus) {
    issues.push(
      `Status mismatch: expected "${scenario.expectedStatus}", received "${result.evidenceStatus}"`
    );
  }

  if (result.confidenceScore < scenario.minConfidence) {
    issues.push(
      `Confidence too low: expected at least ${scenario.minConfidence}%, received ${result.confidenceScore}%`
    );
  }

  if (scenario.maxConfidence !== undefined && result.confidenceScore > scenario.maxConfidence) {
    issues.push(
      `Confidence too high for negative test: expected at most ${scenario.maxConfidence}%, received ${result.confidenceScore}%`
    );
  }

  if (scenario.expectedStatus === 'Verified') {
    if (!result.shortAnswer || result.shortAnswer.length < 20) {
      issues.push('Short answer is missing or insufficiently descriptive');
    }
    if (!result.detailedReasoning || result.detailedReasoning.length < 50) {
      issues.push('Detailed reasoning is too brief');
    }
  } else if (scenario.expectedStatus === 'Insufficient Evidence') {
    if (result.sourceLinks.length > 0) {
      issues.push('Insufficient evidence scenario should not have source links');
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Resolves the corresponding mock package for a demo scenario.
 */
export function getRepoPackageForScenario(scenario: JudgeDemoScenario) {
  if (scenario.repoPackageName === 'express') {
    return DEMO_EXPRESS_REPO;
  }
  return DEMO_PAYMENT_REPO;
}

/**
 * Executes offline retrieval for a scenario question against its repository.
 */
export function runOfflineScenario(scenario: JudgeDemoScenario): QAResult {
  const repoPkg = getRepoPackageForScenario(scenario);

  const evidenceBundle = retrieveEvidence(
    scenario.question,
    repoPkg.summary,
    repoPkg.commits,
    repoPkg.pullRequests,
    repoPkg.issues,
    repoPkg.graph
  );

  return parseAIExplanation('', evidenceBundle);
}
