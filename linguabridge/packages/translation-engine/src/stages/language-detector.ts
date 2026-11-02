import type { PipelineStage } from '../pipeline-stage';
import type { PipelineContext } from '../pipeline-context';

// Simple heuristic language detector
// In production: use a proper library like franc or langdetect
export class LanguageDetector implements PipelineStage {
  name = 'language-detector';

  shouldSkip(ctx: PipelineContext): boolean {
    return ctx.request.sourceLang !== 'auto';
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    // Basic detection: if source is 'auto', try to detect
    // For now, default to 'fr' for Cameroon context
    if (ctx.request.sourceLang === 'auto') {
      ctx.request.sourceLang = 'fr'; // Will be replaced with real detector
      ctx.result.warnings = [...(ctx.result.warnings || []), 'LANG_AUTO_DETECTED_HEURISTIC'];
    }
    return ctx;
  }
}
