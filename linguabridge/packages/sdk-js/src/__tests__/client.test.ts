import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LinguaBridgeClient, LinguaBridgeError } from '../client';

describe('LinguaBridgeClient (SDK-JS)', () => {
  let client: LinguaBridgeClient;

  beforeEach(() => {
    client = new LinguaBridgeClient({
      baseUrl: 'http://localhost:3001',
      apiKey: 'test-api-key',
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
    expect(global.fetch).toHaveBeenCalledTimes(1); // Second call served from cache
  });

  it('translates batch requests', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { originalText: 'Envoyer', translatedText: 'Send', status: 'success' },
          { originalText: 'Recevoir', translatedText: 'Receive', status: 'success' },
        ],
      }),
    });

    const results = await client.translateBatch([
      { text: 'Envoyer', sourceLang: 'fr', targetLang: 'en' },
      { text: 'Recevoir', sourceLang: 'fr', targetLang: 'en' },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].translatedText).toBe('Send');
    expect(results[1].translatedText).toBe('Receive');
  });

  it('throws typed LinguaBridgeError on HTTP error status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Target language pack not available' }),
    });

    await expect(
      client.translate({ text: 'Test', sourceLang: 'fr', targetLang: 'unknown' })
    ).rejects.toThrow(LinguaBridgeError);
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
});
