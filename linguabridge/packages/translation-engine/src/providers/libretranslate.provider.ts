import type { TranslationProvider, TranslationRequest, TranslationResult, ProviderHealth } from '@linguabridge/shared-types';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface LibreTranslateConfig {
  baseUrl: string;
  apiKey?: string;
}

export class LibreTranslateProvider implements TranslationProvider {
  id = 'libretranslate';
  name = 'LibreTranslate';
  private baseUrl: string;
  private apiKey?: string;
  private supportedPairs: Set<string> = new Set();

  constructor(config: LibreTranslateConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const startTime = Date.now();

    const body: Record<string, string> = {
      q: request.sourceText,
      source: request.sourceLang,
      target: request.targetLang,
      format: 'text',
    };

    if (this.apiKey) body.api_key = this.apiKey;

    const response = await fetch(`${this.baseUrl}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(request.maxLatencyMs || 10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LibreTranslate error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as { translatedText: string };

    return {
      id: request.id || generateUUID(),
      originalText: request.sourceText,
      translatedText: data.translatedText,
      sourceLang: request.sourceLang,
      targetLang: request.targetLang,
      provider: this.id,
      status: 'success',
      cacheStatus: 'miss',
      warnings: [],
      latencyMs: Date.now() - startTime,
      speechAvailable: false,
    };
  }

  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    return Promise.all(requests.map((r) => this.translate(r)));
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/languages`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const langs = await response.json() as Array<{ code: string }>;

      // Cache supported pairs
      for (const src of langs) {
        for (const tgt of langs) {
          if (src.code !== tgt.code) {
            this.supportedPairs.add(`${src.code}→${tgt.code}`);
          }
        }
      }

      return {
        healthy: true,
        latencyMs: Date.now() - start,
        supportedPairs: Array.from(this.supportedPairs),
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: (err as Error).message,
      };
    }
  }

  supports(sourceLang: string, targetLang: string): boolean {
    if (this.supportedPairs.size === 0) {
      // Default supported pairs before health check
      return (sourceLang === 'fr' && targetLang === 'en') ||
             (sourceLang === 'en' && targetLang === 'fr');
    }
    return this.supportedPairs.has(`${sourceLang}→${targetLang}`);
  }
}
