import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  LinguaBridgeClient,
  LinguaBridgeError,
  AuthenticationError,
  ValidationError,
  FinancialDriftError,
  verifyZeroDrift,
} from '../index';

describe('LinguaBridgeClient (SDK-JS)', () => {
  let client: LinguaBridgeClient;

  beforeEach(() => {
    client = new LinguaBridgeClient({
      baseUrl: 'http://localhost:3001',
      apiKey: 'test-api-key',
      retryDelayMs: 10,
      maxRetries: 2,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('translates text successfully and sets auth headers', async () => {
    const mockResult = {
      id: 'res-1',
      originalText: 'Transferer de l argent',
      translatedText: 'Transfer money',
      sourceLang: 'fr',
      targetLang: 'en',
      provider: 'mock-engine',
      status: 'success',
      cacheStatus: 'miss',
      warnings: [],
      latencyMs: 15,
      speechAvailable: true,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResult,
    });

    const res = await client.translate({
      text: 'Transferer de l argent',
      sourceLang: 'fr',
      targetLang: 'en',
    });

    expect(res.translatedText).toBe('Transfer money');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/v1/translate',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key',
          'x-api-key': 'test-api-key',
        }),
      })
    );
  });

  it('caches repeated translation calls in memory', async () => {
    const mockResult = {
      id: 'res-2',
      originalText: 'Solde',
      translatedText: 'Balance',
      sourceLang: 'fr',
      targetLang: 'en',
      provider: 'mock-engine',
      status: 'success',
      cacheStatus: 'miss',
      warnings: [],
      latencyMs: 10,
      speechAvailable: true,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResult,
    });

    const first = await client.translate({ text: 'Solde', sourceLang: 'fr', targetLang: 'en' });
    const second = await client.translate({ text: 'Solde', sourceLang: 'fr', targetLang: 'en' });

    expect(first.translatedText).toBe('Balance');
    expect(second.translatedText).toBe('Balance');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('translates batch requests sending { requests: [...] } payload', async () => {
    let capturedBody: any = null;

    global.fetch = vi.fn().mockImplementation(async (_url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          results: [
            { originalText: 'Envoyer', translatedText: 'Send', status: 'success' },
            { originalText: 'Recevoir', translatedText: 'Receive', status: 'success' },
          ],
        }),
      };
    });

    const results = await client.translateBatch([
      { text: 'Envoyer', sourceLang: 'fr', targetLang: 'en' },
      { text: 'Recevoir', sourceLang: 'fr', targetLang: 'en' },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].translatedText).toBe('Send');
    expect(results[1].translatedText).toBe('Receive');

    // Verify critical fix: { requests: [...] } matching apps/api schema
    expect(capturedBody).toHaveProperty('requests');
    expect(capturedBody).not.toHaveProperty('items');
    expect(Array.isArray(capturedBody.requests)).toBe(true);
    expect(capturedBody.requests[0].sourceText).toBe('Envoyer');
    expect(capturedBody.requests[1].sourceText).toBe('Recevoir');
  });

  it('throws typed AuthenticationError on HTTP 401', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid or missing API key' }),
    });

    await expect(
      client.translate({ text: 'Test', sourceLang: 'fr', targetLang: 'en' })
    ).rejects.toThrow(AuthenticationError);

    // Should not retry on 401
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws typed ValidationError on HTTP 400', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'sourceText cannot be empty' }),
    });

    await expect(
      client.translate({ text: '', sourceLang: 'fr', targetLang: 'en' })
    ).rejects.toThrow(ValidationError);

    // Should not retry on 400
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries with exponential backoff on transient 503 error then succeeds', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 2) {
        return {
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: async () => ({ message: 'Temporary overload' }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          id: 'res-retry',
          originalText: 'Bonjour',
          translatedText: 'Mbolo',
          status: 'success',
        }),
      };
    });

    const result = await client.translate({ text: 'Bonjour', sourceLang: 'fr', targetLang: 'ewo-CM' });
    expect(result.translatedText).toBe('Mbolo');
    expect(callCount).toBe(2);
  });

  it('retries on network failure up to maxRetries then throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection lost'));

    await expect(
      client.translate({ text: 'Test', sourceLang: 'fr', targetLang: 'en' })
    ).rejects.toThrow(/Network failure/);

    // Initial attempt + 2 retries = 3 calls
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('fetches available languages', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        languages: [
          { code: 'fr', name: 'French' },
          { code: 'en', name: 'English' },
        ],
      }),
    });

    const languages = await client.getLanguages();
    expect(languages).toHaveLength(2);
    expect(languages[0].code).toBe('fr');
  });

  describe('verifyZeroDrift', () => {
    it('confirms safe translation when entities match perfectly', () => {
      const source = 'Veuillez transférer 50 000 FCFA au numéro 677123456';
      const translation = 'Please transfer 50 000 FCFA to number 677123456';

      const result = client.verifyZeroDrift(source, translation);
      expect(result.safe).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.sourceFingerprint).toBe(result.translatedFingerprint);
    });

    it('detects financial drift when monetary amounts are modified', () => {
      const source = 'Votre solde est de 50 000 FCFA';
      const corruptedTranslation = 'Your balance is 25 000 FCFA';

      const result = client.verifyZeroDrift(source, corruptedTranslation);
      expect(result.safe).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.sourceFingerprint).not.toBe(result.translatedFingerprint);
    });

    it('throws FinancialDriftError when throwOnError is true', () => {
      const source = 'Paiement de 15 000 FCFA reçu';
      const corrupted = 'Payment of 1 500 FCFA received';

      expect(() => {
        verifyZeroDrift(source, corrupted, { throwOnError: true });
      }).toThrow(FinancialDriftError);
    });

    it('throws FinancialDriftError in translate with strictZeroDrift option', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'res-drift',
          originalText: 'Payer 50 000 FCFA',
          translatedText: 'Pay 10 000 FCFA',
          status: 'success',
        }),
      });

      await expect(
        client.translate({
          text: 'Payer 50 000 FCFA',
          sourceLang: 'fr',
          targetLang: 'en',
          strictZeroDrift: true,
        })
      ).rejects.toThrow(FinancialDriftError);
    });
  });
});
