import type { TranslationRequest, TranslationResult, Language } from '@linguabridge/shared-types';
import { FinancialEntityExtractor } from '@linguabridge/financial-domain';

export interface LinguaBridgeClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  tenantId?: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class LinguaBridgeError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'LinguaBridgeError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends LinguaBridgeError {
  constructor(
    message: string = 'Authentication failed: Invalid or missing API key',
    details?: unknown
  ) {
    super(message, 401, details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends LinguaBridgeError {
  constructor(
    message: string = 'Validation error: Invalid request parameters',
    statusCode: number = 400,
    details?: unknown
  ) {
    super(message, statusCode, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FinancialDriftError extends LinguaBridgeError {
  constructor(
    message: string = 'Financial zero-drift verification failed',
    public violations: unknown[] = [],
    public sourceFingerprint?: string,
    public translatedFingerprint?: string
  ) {
    super(message, 422, { violations, sourceFingerprint, translatedFingerprint });
    this.name = 'FinancialDriftError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface ZeroDriftViolation {
  entity: any;
  issue: string;
  sourceValue?: string;
  translatedValue?: string;
}

export interface ZeroDriftResult {
  safe: boolean;
  sourceFingerprint: string;
  translatedFingerprint: string;
  violations: ZeroDriftViolation[];
}

export function verifyZeroDrift(
  sourceText: string,
  translatedText: string,
  options?: { throwOnError?: boolean }
): ZeroDriftResult {
  const extractor = new FinancialEntityExtractor();
  const sourceEntities = extractor.extract(sourceText);
  const translatedEntities = extractor.extract(translatedText);
  const comparison = extractor.compare(sourceEntities, translatedEntities);

  const result: ZeroDriftResult = {
    safe: comparison.safe,
    sourceFingerprint: comparison.sourceFingerprint,
    translatedFingerprint: comparison.translatedFingerprint,
    violations: comparison.violations,
  };

  if (!result.safe && options?.throwOnError) {
    const issues = result.violations.map((v) => v.issue).join('; ') || 'Cryptographic entity fingerprint mismatch';
    throw new FinancialDriftError(
      `Financial drift detected: ${issues}`,
      result.violations,
      result.sourceFingerprint,
      result.translatedFingerprint
    );
  }

  return result;
}

export interface BatchTranslateItem {
  id?: string;
  text?: string;
  sourceText?: string;
  sourceLang: string;
  targetLang: string;
  domain?: string;
  context?: string;
}

export class LinguaBridgeClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;
  private tenantId?: string;
  private maxRetries: number;
  private retryDelayMs: number;
  private memoryCache: Map<string, TranslationResult> = new Map();

  constructor(options: LinguaBridgeClientOptions = {}) {
    this.baseUrl = (options.baseUrl || 'http://localhost:3001').replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 10000;
    this.tenantId = options.tenantId;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 100;
  }

  private isRetryableError(err: any): boolean {
    if (err instanceof AuthenticationError) return false;
    if (err instanceof ValidationError) return false;
    if (err instanceof FinancialDriftError) return false;

    // Network errors (statusCode 0 or undefined)
    if (!err.statusCode || err.statusCode === 0) return true;

    // Transient HTTP status codes
    const transientCodes = [408, 429, 500, 502, 503, 504];
    return transientCodes.includes(err.statusCode);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await this.executeSingleRequest<T>(endpoint, options);
      } catch (err: any) {
        attempt++;
        const canRetry = this.isRetryableError(err);
        if (!canRetry || attempt > this.maxRetries) {
          throw err;
        }
        const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private async executeSingleRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
        const msg = errorData.message || `HTTP ${response.status}: ${response.statusText}`;

        if (response.status === 401) {
          throw new AuthenticationError(msg, errorData);
        }
        if (response.status === 400 || response.status === 422) {
          throw new ValidationError(msg, response.status, errorData);
        }
        throw new LinguaBridgeError(msg, response.status, errorData);
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
    strictZeroDrift?: boolean;
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

    if (params.strictZeroDrift) {
      this.verifyZeroDrift(params.text, result.translatedText, { throwOnError: true });
    }

    if (params.useCache !== false && result.status !== 'failed') {
      this.memoryCache.set(cacheKey, result);
    }

    return result;
  }

  async translateBatch(items: BatchTranslateItem[]): Promise<TranslationResult[]> {
    const requests: Partial<TranslationRequest>[] = items.map((item, index) => ({
      id: item.id || `req-${Date.now()}-${index}`,
      sourceText: item.sourceText || item.text || '',
      sourceLang: item.sourceLang,
      targetLang: item.targetLang,
      domain: (item.domain as any) || 'general',
      context: item.context,
    }));

    const response = await this.request<{ results: TranslationResult[] }>('/v1/translate/batch', {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });

    return response.results;
  }

  verifyZeroDrift(
    sourceText: string,
    translatedText: string,
    options?: { throwOnError?: boolean }
  ): ZeroDriftResult {
    return verifyZeroDrift(sourceText, translatedText, options);
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

  async health(): Promise<{ status: string; timestamp: string }> {
    return this.checkHealth();
  }

  async synthesizeSpeech(params: {
    text: string;
    lang: string;
    rate?: number;
    pitch?: number;
  }): Promise<any> {
    return this.request('/v1/speech/synthesize', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  clearLocalCache(): void {
    this.memoryCache.clear();
  }
}
