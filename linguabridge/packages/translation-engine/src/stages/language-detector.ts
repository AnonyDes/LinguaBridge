import type { PipelineStage } from '../pipeline-stage';
import type { PipelineContext } from '../pipeline-context';

export function detectFrenchOrEnglish(text: string): 'fr' | 'en' | null {
  const tokens = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  let french = 0;
  let english = 0;
  for (const token of tokens) {
    if (/^(?:le|la|les|des|vous|votre|pour|avec|compte|solde|frais|envoyer|bienvenue|merci|bonjour|aide)$/.test(token)) french++;
    if (/^(?:the|your|account|balance|fees|send|transfer|with|from|payment|welcome|thank|hello|help)$/.test(token)) english++;
  }
  if (french === english) return null;
  return french > english ? 'fr' : 'en';
}

export class LanguageDetector implements PipelineStage {
  name = 'language-detector';

  shouldSkip(ctx: PipelineContext): boolean {
    return ctx.request.sourceLang !== 'auto';
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const detected = detectFrenchOrEnglish(ctx.request.sourceText);
    if (!detected) {
      ctx.result.status = 'unverified';
      ctx.result.translatedText = ctx.request.sourceText;
      ctx.result.warnings = ['SOURCE_LANGUAGE_UNCERTAIN'];
      ctx.shouldStop = true;
      return ctx;
    }
    ctx.request.sourceLang = detected;
    ctx.result.sourceLang = detected;
    ctx.result.warnings = ['LANG_AUTO_DETECTED_HEURISTIC'];
    return ctx;
  }
}
