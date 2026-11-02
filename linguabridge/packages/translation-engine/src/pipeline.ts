import type { TranslationRequest, TranslationResult, TranslationProvider } from '@linguabridge/shared-types';
import { PipelineContext } from './pipeline-context';
import type { PipelineStage } from './pipeline-stage';
import { LanguageDetector } from './stages/language-detector';
import { CacheLookupStage } from './stages/cache-lookup';
import { CacheWriterStage } from './stages/cache-writer';
import { ProviderExecutorStage } from './stages/provider-executor';
import { FinancialGuardStage } from './stages/financial-guard-stage';
import type { CacheStore } from './stages/cache-lookup';

export interface PipelineConfig {
  providers: TranslationProvider[];
  cache: CacheStore;
}

export class TranslationPipeline {
  private stages: PipelineStage[];

  constructor(config: PipelineConfig) {
    this.stages = [
      new LanguageDetector(),
      new CacheLookupStage(config.cache),
      new ProviderExecutorStage(config.providers),
      new FinancialGuardStage(),
      new CacheWriterStage(config.cache), // Write to cache AFTER guard validation
    ];
  }

  async process(request: TranslationRequest): Promise<TranslationResult> {
    const ctx = new PipelineContext(request);

    for (const stage of this.stages) {
      if (stage.shouldSkip(ctx)) continue;
      await stage.execute(ctx);
      if (ctx.shouldStop) break;
    }

    return ctx.finalizeResult();
  }

  async processBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    return Promise.all(requests.map((r) => this.process(r)));
  }
}
