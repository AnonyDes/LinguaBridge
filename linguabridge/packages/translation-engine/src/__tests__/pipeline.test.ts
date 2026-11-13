import { describe, it, expect } from 'vitest';
import { TranslationPipeline } from '../pipeline';
import { FixtureProvider } from '../providers/fixture.provider';
import { translationCacheKey, type CacheStore } from '../stages/cache-lookup';
import { PipelineContext } from '../pipeline-context';
import type { TranslationRequest, TranslationProvider, TranslationResult } from '@linguabridge/shared-types';

class MockCache implements CacheStore {
  private store = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }
  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
}

describe('TranslationPipeline', () => {
  it('translates successfully using FixtureProvider', async () => {
    const cache = new MockCache();
    const pipeline = new TranslationPipeline({
      providers: [new FixtureProvider()],
      cache,
    });

    const request: TranslationRequest = {
      id: 'req-1',
      sourceText: 'Solde',
      sourceLang: 'fr',
      targetLang: 'en',
    };

    const result = await pipeline.process(request);
    expect(result.status).toBe('success');
    expect(result.translatedText).toBe('Balance');
    expect(result.provider).toBe('fixture');
    expect(result.cacheStatus).toBe('miss');
  });

  it('serves translation from cache if present', async () => {
    const cache = new MockCache();
    const pipeline = new TranslationPipeline({
      providers: [new FixtureProvider()],
      cache,
    });

    const request: TranslationRequest = {
      id: 'req-cache',
      sourceText: 'Bonjour',
      sourceLang: 'fr',
      targetLang: 'en',
    };

    // Pre-populate cache
    const key = await translationCacheKey(new PipelineContext(request));
    await cache.set(key, JSON.stringify({
      translatedText: 'Hello from cache',
      provider: 'cached-provider',
      status: 'success',
      warnings: [],
    }));

    const result = await pipeline.process(request);
    expect(result.status).toBe('memory_hit');
    expect(result.cacheStatus).toBe('hit');
    expect(result.translatedText).toBe('Hello from cache');
  });

  it('triggers financial guard if amounts are altered in financial domain', async () => {
    // Provider that corrupts numbers
    const corruptingProvider: TranslationProvider = {
      id: 'corruptor',
      name: 'Corrupting Provider',
      translate: (req) => Promise.resolve({
        id: req.id,
        originalText: req.sourceText,
        translatedText: 'Transfer 500 FCFA to Jean', // corrupted from 50 000 FCFA
        sourceLang: req.sourceLang,
        targetLang: req.targetLang,
        provider: 'corruptor',
        status: 'success',
        cacheStatus: 'miss',
        warnings: [],
        latencyMs: 1,
        speechAvailable: false,
      }),
      translateBatch: () => Promise.resolve([]),
      healthCheck: () => Promise.resolve({ healthy: true, latencyMs: 0 }),
      supports: () => true,
    };

    const pipeline = new TranslationPipeline({
      providers: [corruptingProvider],
      cache: new MockCache(),
    });

    const request: TranslationRequest = {
      id: 'req-finance',
      sourceText: 'Transfer 50 000 FCFA to Jean',
      sourceLang: 'en',
      targetLang: 'fr',
      domain: 'financial',
    };

    const result = await pipeline.process(request);
    expect(result.status).toBe('unsafe');
    expect(result.translatedText).toBe('Transfer 50 000 FCFA to Jean'); // Reverted
    expect(result.warnings.some((w) => w.includes('FINANCIAL_ENTITY_MISMATCH'))).toBe(true);
  });

  it('handles missing provider gracefully', async () => {
    const pipeline = new TranslationPipeline({
      providers: [],
      cache: new MockCache(),
    });

    const request: TranslationRequest = {
      id: 'req-no-prov',
      sourceText: 'Hello',
      sourceLang: 'en',
      targetLang: 'ewo-CM',
    };

    const result = await pipeline.process(request);
    expect(result.status).toBe('failed');
    expect(result.warnings.some((w) => w.includes('NO_PROVIDER_FOR_PAIR'))).toBe(true);
  });

  it('bypasses cache when contentType is financial_confirmation', async () => {
    const cache = new MockCache();
    const pipeline = new TranslationPipeline({
      providers: [new FixtureProvider()],
      cache,
    });

    // Populate cache with stale text
    const key = `tm:fr:en:financial:default:${Buffer.from('Confirmer').toString('base64').substring(0, 32)}`;
    await cache.set(key, JSON.stringify({
      translatedText: 'STALE_CACHE_VALUE',
      provider: 'cached-provider',
    }));

    const request: TranslationRequest = {
      id: 'req-confirm',
      sourceText: 'Confirmer',
      sourceLang: 'fr',
      targetLang: 'en',
      domain: 'financial',
      contentType: 'financial_confirmation',
    };

    const result = await pipeline.process(request);
    // Should NOT use cache
    expect(result.cacheStatus).toBe('miss');
    expect(result.translatedText).toBe('Confirm');
  });

  it('detects language and adds warning when sourceLang is auto', async () => {
    const pipeline = new TranslationPipeline({
      providers: [new FixtureProvider()],
      cache: new MockCache(),
    });

    const request: TranslationRequest = {
      id: 'req-auto',
      sourceText: 'Solde',
      sourceLang: 'auto',
      targetLang: 'en',
    };

    const result = await pipeline.process(request);
    expect(result.status).toBe('success');
    expect(result.translatedText).toBe('Balance');
    expect(result.sourceLang).toBe('fr');
    expect(request.sourceLang).toBe('auto');
    expect(result.warnings.some((w) => w.includes('LANG_AUTO_DETECTED_HEURISTIC'))).toBe(true);
  });

  it('uses distinct cache entries for full text and verified tenant', async () => {
    const provider = new FixtureProvider();
    const translate = provider.translate.bind(provider);
    provider.translate = async (request) => ({
      ...await translate(request),
      status: 'success',
      translatedText: request.sourceText,
    });
    const pipeline = new TranslationPipeline({ providers: [provider], cache: new MockCache() });
    const first: TranslationRequest = {
      id: 'a', sourceText: 'The first twenty-four bytes are identical. First',
      sourceLang: 'en', targetLang: 'fr', tenantId: 'tenant-a',
    };
    expect((await pipeline.process(first)).cacheStatus).toBe('miss');
    expect((await pipeline.process({ ...first, tenantId: 'tenant-b' })).cacheStatus).toBe('miss');
    expect((await pipeline.process({ ...first, sourceText: first.sourceText.replace('First', 'Second') })).cacheStatus).toBe('miss');
    expect((await pipeline.process(first)).cacheStatus).toBe('hit');
  });

  it('selects only explicitly local providers for private text', async () => {
    const remote = new FixtureProvider();
    remote.id = 'remote';
    remote.isLocal = false;
    remote.translate = async () => { throw new Error('This provider should not receive the request'); };
    const pipeline = new TranslationPipeline({ providers: [remote, new FixtureProvider()], cache: new MockCache() });
    const result = await pipeline.process({
      id: 'private', sourceText: 'Bonjour', sourceLang: 'fr', targetLang: 'en',
      privacyPolicy: 'no_external', providerPreference: 'remote',
    });
    expect(result.provider).toBe('fixture');
  });

  it('processes batch translations correctly', async () => {
    const pipeline = new TranslationPipeline({
      providers: [new FixtureProvider()],
      cache: new MockCache(),
    });

    const requests: TranslationRequest[] = [
      { id: 'b1', sourceText: 'Bonjour', sourceLang: 'fr', targetLang: 'en' },
      { id: 'b2', sourceText: 'Solde', sourceLang: 'fr', targetLang: 'en' },
    ];

    const results = await pipeline.processBatch(requests);
    expect(results.length).toBe(2);
    expect(results[0].translatedText).toBe('Hello');
    expect(results[1].translatedText).toBe('Balance');
  });

  it('translates seamlessly into the 5 Sovereign Cameroonian Languages', async () => {
    const pipeline = new TranslationPipeline({
      providers: [new FixtureProvider()],
      cache: new MockCache(),
    });

    // 1. Ewondo (ewo-CM)
    const resEwo = await pipeline.process({
      id: 'req-ewo',
      sourceText: 'Solde disponible',
      sourceLang: 'fr',
      targetLang: 'ewo-CM',
    });
    expect(resEwo.status).toBe('success');
    expect(resEwo.translatedText).toBe('Móni mí ne wá é bẽng');

    // 2. Fulfulde (fuv-CM)
    const resFuv = await pipeline.process({
      id: 'req-fuv',
      sourceText: 'Solde disponible',
      sourceLang: 'fr',
      targetLang: 'fuv-CM',
    });
    expect(resFuv.status).toBe('success');
    expect(resFuv.translatedText).toBe('Ngalu heɓotoongu');

    // 3. Haoussa (hau-CM)
    const resHau = await pipeline.process({
      id: 'req-hau',
      sourceText: 'Solde disponible',
      sourceLang: 'fr',
      targetLang: 'hau-CM',
    });
    expect(resHau.status).toBe('success');
    expect(resHau.translatedText).toBe('Kuɗin da za a iya amfani da su');

    // 4. Kanuri (knc-CM)
    const resKnc = await pipeline.process({
      id: 'req-knc',
      sourceText: 'Solde disponible',
      sourceLang: 'fr',
      targetLang: 'knc-CM',
    });
    expect(resKnc.status).toBe('success');
    expect(resKnc.translatedText).toBe('Liman sawawa');

    // 5. Cameroon Pidgin English (pcm-CM)
    const resPcm = await pipeline.process({
      id: 'req-pcm',
      sourceText: 'Solde disponible',
      sourceLang: 'fr',
      targetLang: 'pcm-CM',
    });
    expect(resPcm.status).toBe('success');
    expect(resPcm.translatedText).toBe('Moni wey yu fit yuz');
  });

  it('strictly quarantines Duala from production providers', () => {
    const fixtureProvider = new FixtureProvider();
    expect(fixtureProvider.supports('fr', 'dua-CM')).toBe(false);
    expect(fixtureProvider.supports('en', 'dua-CM')).toBe(false);
  });
});
