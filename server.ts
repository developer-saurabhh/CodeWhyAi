import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { DEMO_EXPRESS_REPO, DEMO_PAYMENT_REPO } from './src/mock/demoData';
import { MockRepoPackage, RepositoryMode } from './src/types';
import { retrieveEvidence } from './src/utils/evidenceRetriever';
import { buildGroundedPrompt, parseAIExplanation, parseVerifiedModelClaims } from './src/utils/aiPrompt';
import { GitHubIngestionError, ingestGitHubRepository, parseRepositoryUrl } from './src/services/githubIngestion';

if (!process.env.NODE_ENV && process.env.npm_lifecycle_event === 'start') process.env.NODE_ENV = 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAX_INDEXES = 20;
const INDEX_TTL_MS = 20 * 60 * 1000;
export type IndexedRepository = { packageData: MockRepoPackage; expiresAt: number };
export type ApiResult = { statusCode: number; body: Record<string, unknown> };

function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = requests.get(key);
    if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + windowMs };
    if (entry.count >= maxRequests) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      res.status(429).json({ error: 'Too many requests. Wait briefly and try again.' });
      return;
    }
    entry.count += 1;
    requests.set(key, entry);
    if (requests.size > 10000) {
      for (const [existingKey, existingEntry] of requests) if (existingEntry.resetAt <= now) requests.delete(existingKey);
      if (requests.size > 10000) requests.delete(requests.keys().next().value!);
    }
    next();
  };
}

export interface CreateAppOptions {
  includeFrontend?: boolean;
  fetchImpl?: typeof fetch;
}

export async function analyzeRepositoryRequest(
  repoUrl: unknown,
  options: { fetchImpl?: typeof fetch; token?: string } = {},
): Promise<ApiResult> {
  try {
    const result = await ingestGitHubRepository(repoUrl, options);
    return { statusCode: 200, body: { source: 'live_github_api', packageData: result.packageData, rateLimit: result.rateLimit, warning: result.warning } };
  } catch (error) {
    const statusCode = error instanceof GitHubIngestionError ? error.statusCode : 502;
    const message = error instanceof GitHubIngestionError ? error.message : 'Could not retrieve repository data from GitHub.';
    return { statusCode, body: { error: message } };
  }
}

export async function explainRepositoryRequest(
  body: unknown,
  liveIndexes: ReadonlyMap<string, IndexedRepository>,
  options: { apiKey?: string; generateModel?: (prompt: string) => Promise<string>; now?: number } = {},
): Promise<ApiResult> {
  const request = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const question = request.question;
  const repository = request.repoName;
  const mode = request.mode as RepositoryMode;
  if (typeof question !== 'string' || !question.trim()) return { statusCode: 400, body: { error: 'Question is required.' } };
  if (question.length > 2000) return { statusCode: 413, body: { error: 'Question must be 2,000 characters or fewer.' } };
  if (typeof repository !== 'string' || !repository.trim()) return { statusCode: 400, body: { error: 'Repository identity is required.' } };
  if (mode !== 'demo' && mode !== 'live') return { statusCode: 400, body: { error: 'Choose Demo Mode or Live Repository Mode explicitly.' } };

  let packageData: MockRepoPackage | undefined;
  const key = repository.toLowerCase();
  let modelUsed = mode === 'demo' ? 'Curated Demo Knowledge Base' : 'Grounded Rule Synthesizer';
  if (mode === 'demo') {
    packageData = [DEMO_PAYMENT_REPO, DEMO_EXPRESS_REPO].find((item) => item.summary.fullName.toLowerCase() === key);
  } else {
    const indexed = liveIndexes.get(key);
    if (indexed && indexed.expiresAt > (options.now ?? Date.now())) packageData = indexed.packageData;
  }
  if (!packageData) {
    return {
      statusCode: mode === 'demo' ? 404 : 409,
      body: { error: mode === 'demo' ? 'This repository is not in the curated Demo Mode knowledge base.' : 'Analyze this exact repository in Live Repository Mode before asking a question.' },
    };
  }
  if (packageData.summary.fullName.toLowerCase() !== key) return { statusCode: 409, body: { error: 'Indexed repository identity does not match the request.' } };

  const trimmedQuestion = question.trim();
  const bundle = retrieveEvidence(trimmedQuestion, packageData.summary, packageData.commits, packageData.pullRequests, packageData.issues, packageData.graph);
  if (bundle.hasSufficientEvidence) {
    const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const prompt = buildGroundedPrompt(trimmedQuestion, bundle, packageData.summary.fullName);
        const raw = options.generateModel
          ? await options.generateModel(prompt)
          : await (async () => {
              const ai = new GoogleGenAI({ apiKey });
              const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { temperature: 0, responseMimeType: 'application/json' },
              });
              return response.text || '';
            })();
        const verified = parseVerifiedModelClaims(raw, bundle);
        if (verified) return { statusCode: 200, body: { result: verified, modelUsed: 'Google Gemini 2.5 Flash', evidence: bundle } };
      } catch {
        // The rule synthesizer below uses only validated backend evidence.
      }
    }
  }
  const result = parseAIExplanation('', bundle);
  return { statusCode: 200, body: { result, modelUsed, evidence: bundle } };
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const liveIndexes = new Map<string, IndexedRepository>();
  const pendingIngestions = new Map<string, Promise<ApiResult>>();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'CodeWhy AI Backend API',
      version: '1.0.0-phase1',
      timestamp: new Date().toISOString(),
      architecture: {
        frontend: 'React + TypeScript + Vite',
        backend: 'Express + in-process bounded repository index',
        database: 'No persistent database configured; Neo4j is not integrated',
        llm: process.env.GEMINI_API_KEY ? 'Google Gemini 2.5 Flash (configured)' : 'Grounded Rule Synthesizer',
      },
      message: 'Repository explanations use trusted server-side indexed data and verified source URLs.',
    });
  });

  app.post('/api/github/analyze', createRateLimiter(10, 60_000), async (req: Request, res: Response) => {
    let key: string;
    try {
      const identity = parseRepositoryUrl(req.body?.repoUrl);
      key = `${identity.owner}/${identity.repo}`.toLowerCase();
    } catch {
      const invalid = await analyzeRepositoryRequest(req.body?.repoUrl);
      res.status(invalid.statusCode).json(invalid.body);
      return;
    }
    let pending = pendingIngestions.get(key);
    if (!pending) {
      pending = analyzeRepositoryRequest(req.body?.repoUrl, { token: process.env.GITHUB_TOKEN, fetchImpl: options.fetchImpl });
      pendingIngestions.set(key, pending);
    }
    const result = await pending;
    if (pendingIngestions.get(key) === pending) pendingIngestions.delete(key);
    if (result.statusCode === 200) {
      const packageData = result.body.packageData as MockRepoPackage;
      const key = packageData.summary.fullName.toLowerCase();
      for (const [existingKey, value] of liveIndexes) if (value.expiresAt <= Date.now()) liveIndexes.delete(existingKey);
      if (!liveIndexes.has(key) && liveIndexes.size >= MAX_INDEXES) liveIndexes.delete(liveIndexes.keys().next().value!);
      liveIndexes.set(key, { packageData, expiresAt: Date.now() + INDEX_TTL_MS });
    }
    if (result.statusCode === 429) res.setHeader('Retry-After', '60');
    res.status(result.statusCode).json(result.body);
  });

  app.post('/api/ai/explain', createRateLimiter(30, 60_000), async (req: Request, res: Response) => {
    const result = await explainRepositoryRequest(req.body, liveIndexes);
    res.status(result.statusCode).json(result.body);
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    const status = error && typeof error === 'object' && 'status' in error ? Number((error as { status?: unknown }).status) : 500;
    if (status === 413) return res.status(413).json({ error: 'Request body is too large.' });
    if (error instanceof SyntaxError) return res.status(400).json({ error: 'Request body must contain valid JSON.' });
    return res.status(500).json({ error: 'The server could not complete this request.' });
  });

  if (options.includeFrontend !== false) {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (_req: Request, res: Response) => res.sendFile(path.resolve(__dirname, 'dist', 'index.html')));
    }
  }
  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.');
  createApp().then((app) => {
    app.listen(port, '0.0.0.0', () => console.log(`CodeWhy AI server running on port ${port}`));
  }).catch((error: unknown) => {
    console.error('CodeWhy AI server failed to start.', error instanceof Error ? error.message : 'Unknown startup error');
    process.exitCode = 1;
  });
}
