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

  private selectProviders(ctx: PipelineContext): TranslationProvider[] {
    const { sourceLang, targetLang, providerPreference, privacyPolicy, contentType } = ctx.request;
    const localOnly = privacyPolicy === 'no_external' || contentType === 'financial_confirmation' || contentType === 'financial_amount';
    const candidates = this.providers.filter((provider) =>
      (!localOnly || provider.isLocal === true) && provider.supports(sourceLang, targetLang));

    // Try a preferred provider first, then continue to other eligible providers
    // when it cannot translate the requested text.
    if (providerPreference) {
      const preferred = candidates.find((p) => p.id === providerPreference);
      if (preferred) return [preferred, ...candidates.filter((p) => p !== preferred)];
    }

    return candidates;
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const providers = this.selectProviders(ctx);

    if (providers.length === 0) {
      ctx.result.status = 'failed';
      ctx.result.translatedText = ctx.request.sourceText;
      ctx.result.warnings = [
        ...(ctx.result.warnings || []),
        `NO_PROVIDER_FOR_PAIR_${ctx.request.sourceLang}_${ctx.request.targetLang}`,
      ];
      ctx.shouldStop = true;
      return ctx;
    }

    let fallback: Awaited<ReturnType<TranslationProvider['translate']>> | null = null;
    for (const provider of providers) {
      const maxLatencyMs = ctx.request.maxLatencyMs ?? 10000;
      const remaining = Math.floor(maxLatencyMs - (Date.now() - ctx.startTime));
      if (remaining <= 0) break;
      try {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const result = await Promise.race([
          provider.translate({ ...ctx.request, maxLatencyMs: remaining }),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new Error('Translation deadline exceeded')), remaining);
          }),
        ]).finally(() => clearTimeout(timeout));
        if (typeof result.translatedText !== 'string' || !result.translatedText.trim()) {
          continue;
        }
        if (result.status === 'unsafe') {
          fallback = result;
          break;
        }
        const unchanged = result.translatedText.trim() === ctx.request.sourceText.trim();
        if (result.status === 'failed' || result.status === 'unverified' || unchanged) {
          fallback = unchanged && result.status === 'success'
            ? { ...result, status: 'unverified', warnings: [...result.warnings, 'UNCHANGED_TRANSLATION'] }
            : result;
          continue;
        }
        ctx.result.translatedText = result.translatedText;
        ctx.result.provider = result.provider;
        ctx.result.status = result.status;
        ctx.result.warnings = [...(ctx.result.warnings || []), ...(result.warnings || [])];
        ctx.selectedProvider = provider.id;
        return ctx;
      } catch {
        // An unavailable provider must not prevent a later provider from trying.
      }
    }

    ctx.result.status = fallback?.status ?? 'failed';
    ctx.result.translatedText = fallback?.translatedText ?? ctx.request.sourceText;
    ctx.result.provider = fallback?.provider ?? ctx.result.provider;
    ctx.result.warnings = [...(ctx.result.warnings || []), ...(fallback?.warnings || []),
      ...(fallback ? [] : ['PROVIDER_ERROR'])];

    return ctx;
  }
}
