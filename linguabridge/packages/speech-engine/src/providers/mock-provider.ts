import type { SpeechSynthesisResult } from '@linguabridge/shared-types';
import type { SpeechProvider, SpeechSynthesisOptions } from '../types';

export class MockSpeechProvider implements SpeechProvider {
  public id = 'mock-speech-provider';
  public name = 'LinguaBridge Mock Speech Engine';
  public supportedLanguages: string[];

  constructor(supportedLanguages: string[] = ['fr', 'en', 'fr-FR', 'en-US', 'en-GB']) {
    this.supportedLanguages = supportedLanguages;
  }

  isLanguageSupported(lang: string): boolean {
    const normalized = lang.toLowerCase();
    return this.supportedLanguages.some((l) => l.toLowerCase() === normalized || normalized.startsWith(l.toLowerCase()));
  }

  async synthesize(text: string, lang: string, options?: SpeechSynthesisOptions): Promise<SpeechSynthesisResult> {
    if (!this.isLanguageSupported(lang)) {
      return {
        available: false,
        lang,
        unavailableReason: `Language '${lang}' is not supported by ${this.name}.`,
        fallbackLang: null,
      };
    }

    // Generate mock base64 audio payload (minimal RIFF wav header)
    const mockWavBase64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

    return {
      available: true,
      lang,
      audioBase64: mockWavBase64,
      audioUrl: `data:audio/wav;base64,${mockWavBase64}`,
      engine: this.id,
      fallbackLang: null,
    };
  }
}
