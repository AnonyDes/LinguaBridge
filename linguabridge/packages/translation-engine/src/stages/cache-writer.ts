import type { PipelineStage } from '../pipeline-stage';
import type { PipelineContext } from '../pipeline-context';
import type { CacheStore } from './cache-lookup';

const CACHE_TTL_SECONDS = 3600; // 1 hour default

export class CacheWriterStage implements PipelineStage {
  name = 'cache-writer';
  private cache: CacheStore;

  constructor(cache: CacheStore) {
    this.cache = cache;
  }

  shouldSkip(ctx: PipelineContext): boolean {
    // Skip if: came from cache, failed, unsafe, or financial confirmation
    return (
      ctx.memoryHit ||
      ctx.result.status === 'failed' ||
      ctx.result.status === 'unsafe' ||
      ctx.result.status === 'unverified' ||
      ctx.request.contentType === 'financial_confirmation' ||
      !ctx.result.translatedText
    );
  }

  private buildKey(ctx: PipelineContext): string {
    const { sourceText, sourceLang, targetLang, domain, glossaryVersion } = ctx.request;
    return `tm:${sourceLang}:${targetLang}:${domain || 'general'}:${glossaryVersion || 'default'}:${Buffer.from(sourceText).toString('base64').substring(0, 32)}`;
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const key = this.buildKey(ctx);
    const toCache = {
      translatedText: ctx.result.translatedText,
      provider: ctx.result.provider,
      status: ctx.result.status,
    };
    await this.cache.set(key, JSON.stringify(toCache), CACHE_TTL_SECONDS);
    return ctx;
  }
}
