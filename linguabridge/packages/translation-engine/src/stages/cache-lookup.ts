import type { PipelineStage } from '../pipeline-stage';
import type { PipelineContext } from '../pipeline-context';

export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
}

export async function translationCacheKey(ctx: PipelineContext): Promise<string> {
  const r = ctx.request;
  const input = JSON.stringify([
    r.sourceText, r.sourceLang, r.targetLang, r.tenantId, r.domain, r.context,
    r.contentType, r.privacyPolicy, r.providerPreference, r.glossaryVersion, r.packVersion,
  ]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `tm:v2:${hash}`;
}

export function bypassTranslationCache(ctx: PipelineContext): boolean {
  const { request } = ctx;
  return request.contentType === 'financial_confirmation' || request.contentType === 'financial_amount' ||
    request.privacyPolicy === 'no_external' || request.maxLatencyMs !== undefined || request.metadata !== undefined;
}

export class CacheLookupStage implements PipelineStage {
  name = 'cache-lookup';
  private cache: CacheStore;

  constructor(cache: CacheStore) {
    this.cache = cache;
  }

  shouldSkip(ctx: PipelineContext): boolean {
    return bypassTranslationCache(ctx);
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    try {
      const cached = await this.cache.get(await translationCacheKey(ctx));
      if (!cached) return ctx;
      const parsed = JSON.parse(cached);
      if (typeof parsed.translatedText !== 'string' || !parsed.translatedText ||
        typeof parsed.provider !== 'string' || !['success', 'fixture'].includes(parsed.status) ||
        !Array.isArray(parsed.warnings) || !parsed.warnings.every((warning: unknown) => typeof warning === 'string')) {
        return ctx;
      }
      ctx.result = {
        ...ctx.result,
        translatedText: parsed.translatedText,
        provider: parsed.provider,
        status: 'memory_hit',
        cacheStatus: 'hit',
        warnings: [...(ctx.result.warnings ?? []), ...parsed.warnings],
      };
      ctx.memoryHit = true;
    } catch {
      // A cache failure should not stop translation.
    }

    return ctx;
  }
}
