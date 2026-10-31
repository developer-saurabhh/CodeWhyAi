import { GitHubIngestionResponse, HealthResponse, MockRepoPackage, QAResult, RepositoryMode } from '../types';

async function readApiError(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return typeof data?.error === 'string' ? data.error : `Request failed with HTTP ${response.status}.`;
}

export async function checkBackendHealth(): Promise<{ data: HealthResponse; latencyMs: number }> {
  const startTime = performance.now();
  try {
    const response = await fetch('/api/health', { headers: { Accept: 'application/json' } });
    const latencyMs = Math.round(performance.now() - startTime);
    if (!response.ok) throw new Error(await readApiError(response));
    return { data: await response.json() as HealthResponse, latencyMs };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime);
    const message = error instanceof Error ? error.message : 'Unknown network error';
    throw new Error(`Failed to reach backend service (${latencyMs}ms): ${message}`);
  }
}

/** Live repository requests always return the requested GitHub repository or an error. */
export async function analyzeRepository(repoUrl: string): Promise<{
  packageData: MockRepoPackage;
  source: 'live_github_api';
  warning?: string;
}> {
  const response = await fetch('/api/github/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ repoUrl }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const result = await response.json() as GitHubIngestionResponse;
  if (result.source !== 'live_github_api' || !result.packageData?.summary?.fullName) {
    throw new Error('Backend did not return a valid live GitHub repository response.');
  }
  return { packageData: result.packageData, source: 'live_github_api', warning: result.warning };
}

/** Sends only question, repository identity, and explicit mode; evidence is selected by the server. */
export async function generateAIExplanation(
  question: string,
  repoName: string,
  mode: RepositoryMode,
): Promise<{ result: QAResult; modelUsed: string }> {
  const response = await fetch('/api/ai/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ question, repoName, mode }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const data = await response.json() as { result: QAResult; modelUsed: string };
  if (!data.result || typeof data.modelUsed !== 'string') throw new Error('Backend returned an invalid explanation response.');
  return { result: data.result, modelUsed: data.modelUsed };
}
