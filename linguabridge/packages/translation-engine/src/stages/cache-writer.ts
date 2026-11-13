import type { PipelineStage } from '../pipeline-stage';
import type { PipelineContext } from '../pipeline-context';
import { bypassTranslationCache, translationCacheKey, type CacheStore } from './cache-lookup';

const CACHE_TTL_SECONDS = 3600; // 1 hour default

export class CacheWriterStage implements PipelineStage {
  name = 'cache-writer';
  private cache: CacheStore;

  constructor(cache: CacheStore) {
    this.cache = cache;
  }

  shouldSkip(ctx: PipelineContext): boolean {
    return (
      ctx.memoryHit ||
      bypassTranslationCache(ctx) ||
      (ctx.result.status !== 'success' && ctx.result.status !== 'fixture') ||
      !ctx.result.translatedText
    );
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    try {
      const key = await translationCacheKey(ctx);
      const { translatedText, provider, status, warnings } = ctx.result;
      await this.cache.set(key, JSON.stringify({ translatedText, provider, status, warnings }), CACHE_TTL_SECONDS);
    } catch {
      // The verified result remains available if its cache write fails.
    }
    return ctx;
  }
}
