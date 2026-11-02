import type { SpeechSynthesisResult } from '@linguabridge/shared-types';
import type { SpeechProvider, SpeechSynthesisOptions } from './types';
import { MockSpeechProvider } from './providers/mock-provider';

export interface SpeechOrchestratorConfig {
  providers?: SpeechProvider[];
  unsupportedReasonTemplates?: Record<string, string>;
}

export class SpeechOrchestrator {
  private providers: SpeechProvider[] = [];
  private audioCache: Map<string, SpeechSynthesisResult> = new Map();

  constructor(config?: SpeechOrchestratorConfig) {
    if (config?.providers && config.providers.length > 0) {
      this.providers = [...config.providers];
    } else {
      // Default to MockSpeechProvider if none specified
      this.providers = [new MockSpeechProvider()];
    }
  }

  registerProvider(provider: SpeechProvider): void {
    this.providers.unshift(provider);
  }

  getProviders(): SpeechProvider[] {
    return [...this.providers];
  }

  isLanguageSupported(lang: string): boolean {
    if (!lang) return false;
    // Known deferred Cameroonian languages strictly lack approved acoustic models
    const unverifiedLocales = [
      'ewo', 'ewo-cm',
      'dua', 'dua-cm',
      'bas', 'bas-cm',
      'fub', 'fub-cm',
      'fuv', 'fuv-cm',
      'bum', 'bum-cm',
    ];
    if (unverifiedLocales.includes(lang.toLowerCase())) {
      return false;
    }

    return this.providers.some((p) => p.isLanguageSupported(lang));
  }

  async synthesize(
    text: string,
    lang: string,
    options?: SpeechSynthesisOptions
  ): Promise<SpeechSynthesisResult> {
    if (!text || text.trim().length === 0) {
      return {
        available: false,
        lang,
        unavailableReason: 'Cannot synthesize speech for empty text.',
        fallbackLang: null,
      };
    }

    // Check Degrade-First Policy for uncertified or unsupported languages
    const normalizedLang = lang.trim().toLowerCase();
    const deferredLanguages: Record<string, string> = {
      'ewo': 'Ewondo (ewo-CM)',
      'ewo-cm': 'Ewondo (ewo-CM)',
      'dua': 'Duala (dua-CM)',
      'dua-cm': 'Duala (dua-CM)',
      'bas': 'Basaa (bas-CM)',
      'bas-cm': 'Basaa (bas-CM)',
      'fub': 'Fulfulde (fub-CM)',
      'fub-cm': 'Fulfulde (fub-CM)',
      'fuv': 'Fulfulde (fuv-CM)',
      'fuv-cm': 'Fulfulde (fuv-CM)',
      'bum': 'Bulu (bum-CM)',
      'bum-cm': 'Bulu (bum-CM)',
    };

    if (deferredLanguages[normalizedLang]) {
      const langName = deferredLanguages[normalizedLang];
      return {
        available: false,
        lang,
        unavailableReason: `Audio synthesis is currently unavailable for ${langName}. Acoustic models are pending qualified native phonetic certification. Silent fallback to another language is prevented by safety policy.`,
        fallbackLang: null,
      };
    }

    // Check cache
    const cacheKey = `${lang}:${text}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    // Find provider that supports language
    const provider = this.providers.find((p) => p.isLanguageSupported(lang));
    if (!provider) {
      return {
        available: false,
        lang,
        unavailableReason: `No verified speech provider configured for language code '${lang}'. Cross-lingual phonetic fallback is disabled.`,
        fallbackLang: null,
      };
    }

    try {
      const result = await provider.synthesize(text, lang, options);
      if (result.available) {
        this.audioCache.set(cacheKey, result);
      }
      return result;
    } catch (err) {
      // Degrade gracefully on provider failure
      return {
        available: false,
        lang,
        unavailableReason: `Speech synthesis failed due to engine error: ${(err as Error).message}`,
        fallbackLang: null,
      };
    }
  }

  clearCache(): void {
    this.audioCache.clear();
  }
}
