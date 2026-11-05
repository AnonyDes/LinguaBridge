import type { TranslationProvider } from '@linguabridge/shared-types';
import type { PipelineStage } from '../pipeline-stage';
import type { PipelineContext } from '../pipeline-context';

export class ProviderExecutorStage implements PipelineStage {
  name = 'provider-executor';
  private providers: TranslationProvider[];

  constructor(providers: TranslationProvider[]) {
    this.providers = providers;
  }

  shouldSkip(ctx: PipelineContext): boolean {
    return ctx.memoryHit || ctx.shouldStop;
  }

  private selectProvider(ctx: PipelineContext): TranslationProvider | null {
    const { sourceLang, targetLang, providerPreference } = ctx.request;

    // Try preferred provider first
    if (providerPreference) {
      const preferred = this.providers.find(
        (p) => p.id === providerPreference && p.supports(sourceLang, targetLang)
      );
      if (preferred) return preferred;
    }

    // Fall back to first available
    return this.providers.find((p) => p.supports(sourceLang, targetLang)) || null;
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const provider = this.selectProvider(ctx);

    if (!provider) {
      ctx.result.status = 'failed';
      ctx.result.translatedText = ctx.request.sourceText;
      ctx.result.warnings = [
        ...(ctx.result.warnings || []),
        `NO_PROVIDER_FOR_PAIR_${ctx.request.sourceLang}_${ctx.request.targetLang}`,
      ];
      ctx.shouldStop = true;
      return ctx;
    }

    try {
      const result = await provider.translate(ctx.request);
      ctx.result.translatedText = result.translatedText;
      ctx.result.provider = result.provider;
      ctx.result.status = result.status;
      ctx.result.warnings = [...(ctx.result.warnings || []), ...(result.warnings || [])];
      ctx.selectedProvider = provider.id;
    } catch (err) {
      ctx.result.status = 'failed';
      ctx.result.translatedText = ctx.request.sourceText;
      ctx.result.warnings = [
        ...(ctx.result.warnings || []),
        `PROVIDER_ERROR: ${(err as Error).message}`,
      ];
    }

    return ctx;
  }
}
