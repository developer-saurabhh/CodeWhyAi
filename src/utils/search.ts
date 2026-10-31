import { DEMO_PAYMENT_REPO } from '../mock/demoData';
import { QAResult } from '../types';
import { retrieveEvidence } from './evidenceRetriever';
import { parseAIExplanation } from './aiPrompt';

/** Demo-only helper using the same relationship checks as the server. */
export function searchDemoEvidence(question: string): QAResult {
  const bundle = retrieveEvidence(
    question,
    DEMO_PAYMENT_REPO.summary,
    DEMO_PAYMENT_REPO.commits,
    DEMO_PAYMENT_REPO.pullRequests,
    DEMO_PAYMENT_REPO.issues,
    DEMO_PAYMENT_REPO.graph,
  );
  return parseAIExplanation('', bundle);
}
