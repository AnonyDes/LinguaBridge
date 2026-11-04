import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import {
  createWebhookSignature,
  verifyWebhookSignature,
  WebhookDispatcher,
} from '../webhooks/webhook-dispatcher';

describe('R1: OpenAPI 3.1 & Interactive Documentation Gateway', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ enableLogging: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('OpenAPI 3.1 Schema Specification (/docs/json)', () => {
    it('serves valid OpenAPI 3.1.0 specification at /docs/json with status 200', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);

      const spec = JSON.parse(response.body);
      expect(spec.openapi).toBe('3.1.0');
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toContain('LinguaBridge');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.servers).toBeDefined();
      expect(spec.servers.length).toBeGreaterThan(0);
    });

    it('defines ApiKeyAuth security scheme and tags in OpenAPI root', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });

      const spec = JSON.parse(response.body);
      expect(spec.components?.securitySchemes?.ApiKeyAuth).toBeDefined();
      expect(spec.components.securitySchemes.ApiKeyAuth.type).toBe('apiKey');
      expect(spec.components.securitySchemes.ApiKeyAuth.name).toBe('x-api-key');
      expect(spec.components.securitySchemes.ApiKeyAuth.in).toBe('header');

      const tagNames = spec.tags?.map((t: { name: string }) => t.name) || [];
      expect(tagNames).toContain('Translation');
      expect(tagNames).toContain('Languages');
      expect(tagNames).toContain('Packs');
      expect(tagNames).toContain('System');
    });

    it('documents all reusable components.schemas including error models and payloads', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });

      const spec = JSON.parse(response.body);
      const schemas = spec.components?.schemas || {};

      const requiredSchemas = [
        'TranslateRequest',
        'TranslationResult',
        'BatchTranslateRequest',
        'BatchTranslateResponse',
        'AsyncBatchTranslateRequest',
        'AsyncBatchTranslateResponse',
        'LanguageItem',
        'LanguagesListResponse',
        'PackSummary',
        'PacksListResponse',
        'FullPackManifest',
        'UpdatePackStatusBody',
        'UpdatePackStatusResponse',
        'HealthResponse',
        'BatchCompletedWebhookPayload',
        'BatchFailedWebhookPayload',
        'FinancialDriftWebhookPayload',
        'Error400',
        'Error401',
        'Error404',
        'Error422',
        'Error500',
      ];

      for (const schemaName of requiredSchemas) {
        expect(schemas[schemaName], `Missing component schema: ${schemaName}`).toBeDefined();
      }
    });

    it('documents OpenAPI 3.1 root webhooks for batch completions, failures, and financial drift', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });

      const spec = JSON.parse(response.body);
      expect(spec.webhooks).toBeDefined();

      const webhookKeys = Object.keys(spec.webhooks);
      expect(webhookKeys).toContain('translation.batch.completed');
      expect(webhookKeys).toContain('translation.batch.failed');
      expect(webhookKeys).toContain('audit.financial_drift_detected');

      // Verify batch completed webhook operation
      const batchCompleted = spec.webhooks['translation.batch.completed'].post;
      expect(batchCompleted.summary).toBeDefined();
      expect(batchCompleted.description).toBeDefined();
      expect(batchCompleted.requestBody.content['application/json'].schema).toBeDefined();
      expect(batchCompleted.responses['200']).toBeDefined();

      // Verify financial drift webhook operation
      const financialDrift = spec.webhooks['audit.financial_drift_detected'].post;
      expect(financialDrift.summary).toBeDefined();
      expect(financialDrift.description).toContain('AST Financial Guard');
      expect(financialDrift.requestBody.content['application/json'].schema).toBeDefined();
      expect(financialDrift.responses['200']).toBeDefined();
    });

    it('includes interactive cURL snippets in description and x-codeSamples across endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });

      const spec = JSON.parse(response.body);
      const paths = spec.paths || {};

      const endpointsToCheck = [
        { path: '/api/v1/translate', method: 'post' },
        { path: '/api/v1/translate/batch', method: 'post' },
        { path: '/api/v1/languages', method: 'get' },
        { path: '/api/v1/languages/{code}', method: 'get' },
        { path: '/api/v1/packs', method: 'get' },
        { path: '/api/v1/packs/{id}', method: 'get' },
        { path: '/api/v1/packs/{id}/status', method: 'patch' },
        { path: '/health', method: 'get' },
      ];

      for (const { path, method } of endpointsToCheck) {
        expect(paths[path], `Missing path in spec: ${path}`).toBeDefined();
        const operation = paths[path][method];
        expect(operation, `Missing operation ${method} for ${path}`).toBeDefined();

        // Must have description containing cURL snippet block
        expect(operation.description, `Missing description for ${path}`).toBeDefined();
        expect(operation.description).toContain('curl -X');

        // Must have x-codeSamples extension
        const codeSamples = operation['x-codeSamples'];
        expect(Array.isArray(codeSamples), `Missing x-codeSamples for ${path}`).toBe(true);
        expect(codeSamples[0].lang).toBe('Shell');
        expect(codeSamples[0].source).toContain('curl');
      }
    });
  });

  describe('Swagger UI (/docs)', () => {
    it('serves responsive Swagger UI HTML gateway at /docs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/html/);
      expect(response.body).toContain('swagger-ui');
    });
  });

  describe('Dual Route Registration (/api/v1/* and /v1/*)', () => {
    it('executes single translation via /api/v1/translate and /v1/translate identically', async () => {
      const payload = {
        sourceText: 'Solde',
        sourceLang: 'fr',
        targetLang: 'en',
      };
      const headers = { 'x-api-key': 'lb_demo_key_2026' };

      const resApi = await app.inject({
        method: 'POST',
        url: '/api/v1/translate',
        headers,
        payload,
      });

      const resLegacy = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers,
        payload,
      });

      expect(resApi.statusCode).toBe(200);
      expect(resLegacy.statusCode).toBe(200);

      const dataApi = JSON.parse(resApi.body);
      const dataLegacy = JSON.parse(resLegacy.body);

      expect(dataApi.translatedText).toBe('Balance');
      expect(dataLegacy.translatedText).toBe('Balance');
    });

    it('executes batch translation via /api/v1/translate/batch and /v1/translate/batch', async () => {
      const payload = {
        requests: [
          { sourceText: 'Bonjour', sourceLang: 'fr', targetLang: 'en' },
          { sourceText: 'Solde', sourceLang: 'fr', targetLang: 'en' },
        ],
      };
      const headers = { 'x-api-key': 'lb_demo_key_2026' };

      const resApi = await app.inject({
        method: 'POST',
        url: '/api/v1/translate/batch',
        headers,
        payload,
      });

      const resLegacy = await app.inject({
        method: 'POST',
        url: '/v1/translate/batch',
        headers,
        payload,
      });

      expect(resApi.statusCode).toBe(200);
      expect(resLegacy.statusCode).toBe(200);

      const dataApi = JSON.parse(resApi.body);
      const dataLegacy = JSON.parse(resLegacy.body);

      expect(dataApi.results.length).toBe(2);
      expect(dataLegacy.results.length).toBe(2);
    });

    it('executes languages queries via /api/v1/languages and /v1/languages', async () => {
      const resApi = await app.inject({ method: 'GET', url: '/api/v1/languages' });
      const resLegacy = await app.inject({ method: 'GET', url: '/v1/languages' });

      expect(resApi.statusCode).toBe(200);
      expect(resLegacy.statusCode).toBe(200);

      const dataApi = JSON.parse(resApi.body);
      const dataLegacy = JSON.parse(resLegacy.body);

      expect(dataApi.count).toBe(dataLegacy.count);
      expect(dataApi.languages.some((l: { code: string }) => l.code === 'ewo-CM')).toBe(true);
    });

    it('executes language detail queries via /api/v1/languages/:code and /v1/languages/:code', async () => {
      const resApi = await app.inject({ method: 'GET', url: '/api/v1/languages/ewo-CM' });
      const resLegacy = await app.inject({ method: 'GET', url: '/v1/languages/ewo-CM' });

      expect(resApi.statusCode).toBe(200);
      expect(resLegacy.statusCode).toBe(200);

      const dataApi = JSON.parse(resApi.body);
      const dataLegacy = JSON.parse(resLegacy.body);

      expect(dataApi.code).toBe('ewo-CM');
      expect(dataLegacy.code).toBe('ewo-CM');
    });

    it('executes packs queries via /api/v1/packs and /v1/packs', async () => {
      const resApi = await app.inject({ method: 'GET', url: '/api/v1/packs' });
      const resLegacy = await app.inject({ method: 'GET', url: '/v1/packs' });

      expect(resApi.statusCode).toBe(200);
      expect(resLegacy.statusCode).toBe(200);

      const dataApi = JSON.parse(resApi.body);
      const dataLegacy = JSON.parse(resLegacy.body);

      expect(dataApi.count).toBe(dataLegacy.count);
    });

    it('executes pack detail via /api/v1/packs/:id and /v1/packs/:id', async () => {
      const resApi = await app.inject({ method: 'GET', url: '/api/v1/packs/ewondo' });
      const resLegacy = await app.inject({ method: 'GET', url: '/v1/packs/ewondo' });

      expect(resApi.statusCode).toBe(200);
      expect(resLegacy.statusCode).toBe(200);

      const dataApi = JSON.parse(resApi.body);
      const dataLegacy = JSON.parse(resLegacy.body);

      expect(dataApi.id).toBe('ewondo');
      expect(dataLegacy.id).toBe('ewondo');
    });
  });

  describe('Error Response Model Validation', () => {
    it('returns 400 Bad Request with standardized error schema on empty text', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/translate',
        headers: { 'x-api-key': 'lb_demo_key_2026' },
        payload: {
          sourceText: '',
          sourceLang: 'fr',
          targetLang: 'en',
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Bad Request');
      expect(data.message).toBeDefined();
    });

    it('returns 401 Unauthorized with standardized error schema on invalid API key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/translate',
        headers: { 'x-api-key': 'bad_unauthorized_key' },
        payload: {
          sourceText: 'Bonjour',
          sourceLang: 'fr',
          targetLang: 'en',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toContain('API key');
    });

    it('returns 404 Not Found on nonexistent language code', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/languages/nonexistent-lang',
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Not Found');
    });

    it('returns 422 Unprocessable Entity when activating uncertified Cameroonian pack', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/packs/duala/status',
        payload: {
          status: 'production_approved',
        },
      });

      expect(response.statusCode).toBe(422);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Unprocessable Entity');
      expect(data.message).toMatch(/Cameroonian language resources not yet verified/);
    });
  });

  describe('Standardized Webhooks & HMAC SHA-256 Signatures', () => {
    const secret = 'test_webhook_hmac_secret_123';
    const payload = JSON.stringify({
      id: 'evt-12345',
      event: 'translation.batch.completed',
      timestamp: '2026-11-04T16:00:00Z',
      attempt: 1,
      data: { batchId: 'batch-abc', totalCount: 1, successCount: 1, failedCount: 0 },
    });

    it('computes and verifies HMAC SHA-256 signatures with X-LinguaBridge-Signature format', () => {
      const signatureHex = createWebhookSignature(payload, secret);
      expect(signatureHex).toHaveLength(64);

      // Verify with raw hex
      expect(verifyWebhookSignature(payload, signatureHex, secret)).toBe(true);

      // Verify with sha256= prefix
      expect(verifyWebhookSignature(payload, `sha256=${signatureHex}`, secret)).toBe(true);

      // Reject tampered payload
      const tampered = payload.replace('batch-abc', 'batch-tampered');
      expect(verifyWebhookSignature(tampered, signatureHex, secret)).toBe(false);

      // Reject incorrect secret
      expect(verifyWebhookSignature(payload, signatureHex, 'wrong_secret')).toBe(false);
    });

    it('dispatches webhook with headers and payload via WebhookDispatcher', async () => {
      const dispatcher = new WebhookDispatcher(secret);

      // Mock global fetch
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await dispatcher.dispatchBatchCompleted(
        'https://fintech.example.com/webhook',
        {
          batchId: 'batch-001',
          totalCount: 2,
          successCount: 2,
          failedCount: 0,
          results: [],
          durationMs: 45,
        },
        secret
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.attempts).toBe(1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
      expect(calledUrl).toBe('https://fintech.example.com/webhook');
      expect(calledOptions?.headers).toBeDefined();

      const headers = calledOptions?.headers as Record<string, string>;
      expect(headers['X-LinguaBridge-Event']).toBe('translation.batch.completed');
      expect(headers['X-LinguaBridge-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/);
      expect(headers['X-LinguaBridge-Delivery']).toBeDefined();

      fetchSpy.mockRestore();
    });

    it('handles async batch translation endpoint (/api/v1/translate/async)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/translate/async',
        headers: { 'x-api-key': 'lb_demo_key_2026' },
        payload: {
          requests: [
            { sourceText: 'Bonjour', sourceLang: 'fr', targetLang: 'en' },
          ],
          webhookUrl: 'https://fintech.example.com/webhook-callback',
        },
      });

      expect(response.statusCode).toBe(202);
      const data = JSON.parse(response.body);
      expect(data.status).toBe('queued');
      expect(data.batchId).toBeDefined();
      expect(data.totalCount).toBe(1);
      expect(data.webhookUrl).toBe('https://fintech.example.com/webhook-callback');
    });

    it('dispatches financial drift alert on entity tampering detection', async () => {
      const dispatcher = new WebhookDispatcher(secret);

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ received: true }), { status: 200 })
      );

      const result = await dispatcher.dispatchFinancialDrift(
        'https://compliance.fintech.example.com/drift-alerts',
        {
          translationId: 'trans-999',
          sourceText: 'Solde de 50 000 FCFA',
          translatedText: 'Balance of 25 000 FCFA',
          sourceLang: 'fr',
          targetLang: 'en',
          violations: ['FINANCIAL_ENTITY_MISMATCH: amount 50000_FCFA altered to 25000_FCFA'],
          detectedAt: new Date().toISOString(),
        },
        secret
      );

      expect(result.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const [, callOpts] = fetchSpy.mock.calls[0];
      const headers = callOpts?.headers as Record<string, string>;
      expect(headers['X-LinguaBridge-Event']).toBe('audit.financial_drift_detected');
      expect(headers['X-LinguaBridge-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/);

      fetchSpy.mockRestore();
    });
  });
});
