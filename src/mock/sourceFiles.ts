export interface CodeAnnotation {
  lineNumber: number;
  highlightText: string;
  question: string;
  explanationExcerpt: string;
}

export interface SourceFile {
  path: string;
  language: string;
  lines: string[];
  annotations: CodeAnnotation[];
}

export const DEMO_SOURCE_FILES: SourceFile[] = [
  {
    path: 'src/services/gateway.ts',
    language: 'typescript',
    lines: [
      'import { Logger } from "../utils/logger";',
      'import { BankProviderClient } from "../clients/bank";',
      'import { PaymentPayload, GatewayResponse } from "../types";',
      '',
      '/**',
      ' * Upstream Banking Gateway Integration Service',
      ' * Handles outbound authorization with retry & circuit breaker.',
      ' */',
      'export class GatewayService {',
      '  // CodeWhy AI: Why was this retry limit set to 3?',
      '  private static readonly MAX_RETRIES = 3;',
      '  private static readonly BASE_DELAY_MS = 250;',
      '  private static readonly MAX_DELAY_MS = 2000;',
      '',
      '  public async executeChargeWithRetry(',
      '    payload: PaymentPayload',
      '  ): Promise<GatewayResponse> {',
      '    let attempt = 0;',
      '    while (attempt < GatewayService.MAX_RETRIES) {',
      '      attempt++;',
      '      try {',
      '        return await BankProviderClient.postCharge(payload);',
      '      } catch (error: any) {',
      '        if (attempt >= GatewayService.MAX_RETRIES || !this.isRetryable(error)) {',
      '          throw error;',
      '        }',
      '        const jitter = Math.floor(Math.random() * 100);',
      '        const delay = Math.min(GatewayService.BASE_DELAY_MS * Math.pow(2, attempt) + jitter, GatewayService.MAX_DELAY_MS);',
      '        await new Promise((resolve) => setTimeout(resolve, delay));',
      '      }',
      '    }',
      '    throw new Error("Exhausted retries");',
      '  }',
      '',
      '  private isRetryable(error: any): boolean {',
      '    return error?.status === 503 || error?.code === "ECONNRESET";',
      '  }',
      '}',
    ],
    annotations: [
      {
        lineNumber: 11,
        highlightText: 'private static readonly MAX_RETRIES = 3;',
        question: 'Why is the retry limit set to 3?',
        explanationExcerpt: 'Capped to 3 in PR #42 by Sarah Chen to eliminate cascading timeouts that caused 20+ retry storms in Issue #28.',
      },
    ],
  },
  {
    path: 'src/routes/charges.ts',
    language: 'typescript',
    lines: [
      'import { Router, Request, Response } from "express";',
      'import { IdempotencyStore } from "../services/idempotency";',
      'import { GatewayService } from "../services/gateway";',
      '',
      'const router = Router();',
      '// CodeWhy AI: Why do we require Idempotency-Key headers?',
      'const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours retention',
      '',
      'router.post("/v1/charges", async (req: Request, res: Response) => {',
      '  const idempotencyKey = req.headers["idempotency-key"] as string;',
      '  if (!idempotencyKey) {',
      '    return res.status(400).json({',
      '      error: "MISSING_IDEMPOTENCY_KEY",',
      '      message: "Header Idempotency-Key is required on all financial charge mutations."',
      '    });',
      '  }',
      '',
      '  const cached = await IdempotencyStore.get(idempotencyKey);',
      '  if (cached) {',
      '    return res.status(cached.statusCode).json(cached.body);',
      '  }',
      '',
      '  const result = await GatewayService.executeChargeWithRetry(req.body);',
      '  await IdempotencyStore.set(idempotencyKey, result, IDEMPOTENCY_TTL_SECONDS);',
      '  return res.status(201).json(result);',
      '});',
      '',
      'export default router;',
    ],
    annotations: [
      {
        lineNumber: 7,
        highlightText: 'const IDEMPOTENCY_TTL_SECONDS = 86400;',
        question: 'Why are idempotency keys required on charge endpoints?',
        explanationExcerpt: 'Enforced in PR #57 by Alex Rivera after Issue #45 showed mobile clients double-charging users during intermittent network drops.',
      },
    ],
  },
  {
    path: 'src/services/fxRates.ts',
    language: 'typescript',
    lines: [
      'import { RedisCache } from "../utils/redis";',
      'import { ForexFeedProvider } from "../clients/forex";',
      '',
      'export class FxRateService {',
      '  // CodeWhy AI: Why was the cache TTL reduced to 60 seconds?',
      '  private static readonly FX_CACHE_TTL = 60; // Reduced from 3600s',
      '',
      '  public static async getRate(base: string, target: string): Promise<number> {',
      '    const cacheKey = `fx:${base}:${target}`;',
      '    const cachedRate = await RedisCache.get(cacheKey);',
      '    if (cachedRate) return parseFloat(cachedRate);',
      '',
      '    const liveRate = await ForexFeedProvider.fetchSpotRate(base, target);',
      '    await RedisCache.set(cacheKey, liveRate.toString(), "EX", this.FX_CACHE_TTL);',
      '    return liveRate;',
      '  }',
      '}',
    ],
    annotations: [
      {
        lineNumber: 6,
        highlightText: 'private static readonly FX_CACHE_TTL = 60;',
        question: 'Why was the currency exchange rate cache TTL reduced to 60 seconds?',
        explanationExcerpt: 'PR #61 tuned TTL down from 1 hour to 60s following Issue #52 where traders exploited price drift in volatile markets.',
      },
    ],
  },
];
