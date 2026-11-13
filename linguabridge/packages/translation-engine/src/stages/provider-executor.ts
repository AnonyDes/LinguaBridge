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
    const { sourceLang, targetLang, providerPreference, privacyPolicy, contentType } = ctx.request;
    const localOnly = privacyPolicy === 'no_external' || contentType === 'financial_confirmation' || contentType === 'financial_amount';
    const candidates = this.providers.filter((provider) =>
      (!localOnly || provider.isLocal === true) && provider.supports(sourceLang, targetLang));

    // Try preferred provider first
    if (providerPreference) {
      const preferred = candidates.find((p) => p.id === providerPreference);
      if (preferred) return preferred;
    }

    // Fall back to first available
    return candidates[0] || null;
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
      const maxLatencyMs = ctx.request.maxLatencyMs ?? 10000;
      const remaining = Math.max(1, Math.floor(maxLatencyMs - (Date.now() - ctx.startTime)));
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const result = await Promise.race([
        provider.translate({ ...ctx.request, maxLatencyMs: remaining }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Translation deadline exceeded')), remaining);
        }),
      ]).finally(() => clearTimeout(timeout));
      if (typeof result.translatedText !== 'string' || !result.translatedText.trim()) {
        throw new Error('Empty translation');
      }
      ctx.result.translatedText = result.translatedText;
      ctx.result.provider = result.provider;
      ctx.result.status = result.status;
      ctx.result.warnings = [...(ctx.result.warnings || []), ...(result.warnings || [])];
      ctx.selectedProvider = provider.id;
    } catch {
      ctx.result.status = 'failed';
      ctx.result.translatedText = ctx.request.sourceText;
      ctx.result.warnings = [
        ...(ctx.result.warnings || []),
        'PROVIDER_ERROR',
      ];
    }

    return ctx;
  }
}
