import { ApiKeyService } from '../services/api-key-service';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app';

describe('LinguaBridge API Integration', () => {
  let app: FastifyInstance;
  const apiKeyService = new ApiKeyService();
  const adminToken = apiKeyService.createKey({ name: 'Test admin', permissions: ['admin', 'translate:webhook'] }).key!;

  beforeAll(async () => {
    app = await buildApp({ enableLogging: false, apiKeyService });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('returns healthy status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.status).toBe('ok');
      expect(Array.isArray(data.providers)).toBe(true);
    });
  });

  describe('GET /v1/languages', () => {
    it('returns only production_approved languages (FR/EN + certified Ewondo), omitting unreviewed Cameroonian templates', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/languages',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.count).toBeGreaterThan(0);
      // 'fr' is production approved
      expect(data.languages.some((l: { code: string }) => l.code === 'fr')).toBe(true);
      // 'ewo-CM' is production approved as first certified national language
      expect(data.languages.some((l: { code: string }) => l.code === 'ewo-CM')).toBe(true);
      // 'dua-CM' and 'bas-CM' must NOT be in public available languages (isolated templates)
      expect(data.languages.some((l: { code: string }) => l.code === 'dua-CM')).toBe(false);
      expect(data.languages.some((l: { code: string }) => l.code === 'bas-CM')).toBe(false);
    });
  });

  describe('POST /v1/translate & Authentication', () => {
    it('translates successfully using fixture provider', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: {
          'x-api-key': 'lb_demo_key_2026',
        },
        payload: {
          sourceText: 'Solde',
          sourceLang: 'fr',
          targetLang: 'en',
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.status).toBe('success');
      expect(result.translatedText).toBe('Balance');
      expect(result.originalText).toBe('Solde');
      expect(result.id).toBeDefined();
    });

    it('translates French to Ewondo using the certified national lexicon', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: {
          'x-api-key': 'lb_demo_key_2026',
        },
        payload: {
          sourceText: 'Solde disponible',
          sourceLang: 'fr',
          targetLang: 'ewo-CM',
          domain: 'financial',
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.status).toBe('success');
      expect(result.translatedText).toBe('Móni mí ne wá é bẽng');
      expect(result.targetLang).toBe('ewo-CM');
    });

    it('rejects invalid API key with 401 Unauthorized', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: {
          'x-api-key': 'invalid_secret_key',
        },
        payload: {
          sourceText: 'Bonjour',
          sourceLang: 'fr',
          targetLang: 'en',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Unauthorized');
    });

    it('rejects invalid request with 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: {
          'x-api-key': 'lb_demo_key_2026',
        },
        payload: {
          sourceText: '', // empty text
          sourceLang: 'fr',
          targetLang: 'en',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('enforces financial safety guard on monetary discrepancies', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: {
          'x-api-key': 'lb_demo_key_2026',
        },
        payload: {
          sourceText: 'Solde de 50 000 FCFA',
          sourceLang: 'fr',
          targetLang: 'en',
          domain: 'financial',
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      if (result.status === 'unsafe') {
        expect(result.warnings.some((w: string) => w.includes('FINANCIAL_ENTITY_MISMATCH'))).toBe(true);
      }
    });

    it('translates batches of requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/translate/batch',
        headers: {
          'x-api-key': 'lb_demo_key_2026',
        },
        payload: {
          requests: [
            { sourceText: 'Bonjour', sourceLang: 'fr', targetLang: 'en' },
            { sourceText: 'Solde', sourceLang: 'fr', targetLang: 'en' },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.results.length).toBe(2);
      expect(data.results[0].translatedText).toBe('Hello');
      expect(data.results[1].translatedText).toBe('Balance');
    });
  });

  describe('GET /v1/languages/:code', () => {
    it('returns 200 for available language', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/languages/fr',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.code).toBe('fr');
    });

    it('returns 200 for approved Ewondo language', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/languages/ewo-CM',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.code).toBe('ewo-CM');
    });

    it('returns 404 for unapproved language (Duala)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/languages/dua-CM',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /v1/packs (Admin)', () => {
    it('returns all packs including unreviewed templates for administrator review', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/packs',
        headers: { 'x-api-key': adminToken },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.packs.some((p: { code: string }) => p.code === 'ewo-CM')).toBe(true);
      expect(data.packs.some((p: { code: string }) => p.code === 'dua-CM')).toBe(true);
    });

    it('returns specific pack by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/packs/ewondo',
        headers: { 'x-api-key': adminToken },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.id).toBe('ewondo');
      expect(data.iso639_3).toBe('ewo');
    });

    it('allows updating pack status to non-production states such as under_review', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/v1/packs/duala/status',
        headers: { 'x-api-key': adminToken },
        payload: {
          status: 'under_review',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.status).toBe('under_review');
    });

    it('prevents activating unreviewed Cameroonian template to production_approved without linguist certification', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/v1/packs/duala/status',
        headers: { 'x-api-key': adminToken },
        payload: {
          status: 'production_approved',
        },
      });

      expect(response.statusCode).toBe(422);
      const data = JSON.parse(response.body);
      expect(data.message).toMatch(/Cameroonian language resources not yet verified/);
    });
  });
});
