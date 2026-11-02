import type { PipelineStage } from '../pipeline-stage';
import type { PipelineContext } from '../pipeline-context';

export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
}

export class CacheLookupStage implements PipelineStage {
  name = 'cache-lookup';
  private cache: CacheStore;

  constructor(cache: CacheStore) {
    this.cache = cache;
  }

  shouldSkip(ctx: PipelineContext): boolean {
    // Never cache financial confirmation content
    return ctx.request.contentType === 'financial_confirmation';
  }

  private buildKey(ctx: PipelineContext): string {
    const { sourceText, sourceLang, targetLang, domain, glossaryVersion } = ctx.request;
    return `tm:${sourceLang}:${targetLang}:${domain || 'general'}:${glossaryVersion || 'default'}:${Buffer.from(sourceText).toString('base64').substring(0, 32)}`;
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const key = this.buildKey(ctx);
    const cached = await this.cache.get(key);

    if (cached) {
      const parsed = JSON.parse(cached);
      ctx.result = {
        ...ctx.result,
        translatedText: parsed.translatedText,
        provider: parsed.provider,
        status: 'memory_hit',
        cacheStatus: 'hit',
      };
      ctx.memoryHit = true;
      ctx.shouldStop = true;
    }

    return ctx;
  }
}
