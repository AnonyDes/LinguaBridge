import { randomUUID } from 'crypto';
import type { TranslationProvider, TranslationRequest, TranslationResult, ProviderHealth } from '@linguabridge/shared-types';

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class OpenRouterProvider implements TranslationProvider {
  id = 'openrouter';
  name = 'OpenRouter (LLM)';
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: OpenRouterConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.model = config.model || 'mistralai/mistral-7b-instruct';
  }

  private buildPrompt(request: TranslationRequest): string {
    const domainContext = request.domain === 'financial'
      ? 'This is a financial text. CRITICAL: You MUST preserve all monetary amounts, percentages, account numbers, and transaction IDs exactly as they appear in the source. Do NOT modify any numbers.'
      : '';

    return `You are a professional translator. Translate the following text from ${request.sourceLang} to ${request.targetLang}.
${domainContext}

Rules:
- Provide ONLY the translation, no explanations
- Preserve all numbers, amounts, dates, and identifiers exactly
- Do not add or remove information
- Do not translate proper names unless they have established translations

Text to translate:
${request.sourceText}

Translation:`;
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const startTime = Date.now();

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://linguabridge.cm',
        'X-Title': 'LinguaBridge',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: this.buildPrompt(request) }],
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for deterministic translation
      }),
      signal: AbortSignal.timeout(request.maxLatencyMs || 30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const translatedText = data.choices[0]?.message?.content?.trim() || '';

    return {
      id: request.id || randomUUID(),
      originalText: request.sourceText,
      translatedText,
      sourceLang: request.sourceLang,
      targetLang: request.targetLang,
      provider: this.id,
      status: 'success',
      cacheStatus: 'miss',
      warnings: ['LLM_TRANSLATION — Subject to financial guard validation'],
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
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return {
        healthy: response.ok,
        latencyMs: Date.now() - start,
        message: response.ok ? 'Connected' : `Status ${response.status}`,
      };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  }

  supports(_sourceLang: string, _targetLang: string): boolean {
    // OpenRouter LLMs support most language pairs
    // But should NEVER be used for Cameroonian languages not yet supported
    return true;
  }
}
