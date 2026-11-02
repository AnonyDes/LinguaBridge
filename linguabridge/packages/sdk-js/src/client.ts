import type { TranslationRequest, TranslationResult, Language } from '@linguabridge/shared-types';

export interface LinguaBridgeClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  tenantId?: string;
}

export class LinguaBridgeError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'LinguaBridgeError';
  }
}

export class LinguaBridgeClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;
  private tenantId?: string;
  private memoryCache: Map<string, TranslationResult> = new Map();

  constructor(options: LinguaBridgeClientOptions = {}) {
    this.baseUrl = (options.baseUrl || 'http://localhost:3001').replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 10000;
    this.tenantId = options.tenantId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['x-api-key'] = this.apiKey;
    }
    if (this.tenantId) {
      headers['x-tenant-id'] = this.tenantId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // Non-JSON response
        }
        throw new LinguaBridgeError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return (await response.json()) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err instanceof LinguaBridgeError) throw err;
      if (err.name === 'AbortError') {
        throw new LinguaBridgeError(`Request timed out after ${this.timeout}ms`, 408);
      }
      throw new LinguaBridgeError(`Network failure: ${err.message}`, 0, err);
    }
  }

  async translate(params: {
    text: string;
    sourceLang: string;
    targetLang: string;
    domain?: string;
    context?: string;
    useCache?: boolean;
  }): Promise<TranslationResult> {
    const cacheKey = `${params.sourceLang}:${params.targetLang}:${params.text}`;
    if (params.useCache !== false && this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    const result = await this.request<TranslationResult>('/v1/translate', {
      method: 'POST',
      body: JSON.stringify({
        sourceText: params.text,
        sourceLang: params.sourceLang,
        targetLang: params.targetLang,
        domain: params.domain || 'general',
        context: params.context,
      }),
    });

    if (params.useCache !== false && result.status !== 'failed') {
      this.memoryCache.set(cacheKey, result);
    }

    return result;
  }

  async translateBatch(items: Array<{
    text: string;
    sourceLang: string;
    targetLang: string;
    domain?: string;
    context?: string;
  }>): Promise<TranslationResult[]> {
    const requests: Partial<TranslationRequest>[] = items.map((item, index) => ({
      id: `req-${Date.now()}-${index}`,
      sourceText: item.text,
      sourceLang: item.sourceLang,
      targetLang: item.targetLang,
      domain: (item.domain as any) || 'general',
      context: item.context,
    }));

    const response = await this.request<{ results: TranslationResult[] }>('/v1/translate/batch', {
      method: 'POST',
      body: JSON.stringify({ items: requests }),
    });

    return response.results;
  }

  async getLanguages(): Promise<Language[]> {
    const response = await this.request<{ languages: Language[] }>('/v1/languages');
    return response.languages;
  }

  async getPacks(): Promise<any[]> {
    const response = await this.request<{ packs: any[] }>('/v1/packs');
    return response.packs;
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  clearLocalCache(): void {
    this.memoryCache.clear();
  }
}
