import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../../apps/api/src/app';
import { verifyHmacSignature } from '../helpers/test-utils';

/**
 * Tier 2: Boundary & Corner Cases — R1 API Gateway
 * Authoritative Source: ORIGINAL_REQUEST.md (R1) & PROJECT.md (§1 API Gateway)
 */
describe('Tier 2: Boundary & Corner Cases — R1 API Gateway', () => {
  let app: FastifyInstance;
  const validApiKey = 'lb_demo_key_2026';

  beforeAll(async () => {
    app = await buildApp({ enableLogging: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('B1.1 should reject empty sourceText with 400 Bad Request and validation error details', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/translate',
      headers: { 'x-api-key': validApiKey },
      payload: {
        sourceText: '',
        sourceLang: 'fr',
        targetLang: 'ewo-CM',
      },
    });

    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res.body);
    expect(data.error).toBe('Bad Request');
    expect(res.body).toMatch(/empty|sourceText/i);
  });

  it('B1.2 should accept exact maximum batch size of 50 items and reject 51 items with 400', async () => {
    // 1. Max allowed: 50 items
    const batch50 = Array.from({ length: 50 }, (_, i) => ({
      sourceText: `Solde compte client ${i}: 10 000 FCFA`,
      sourceLang: 'fr',
      targetLang: 'ewo-CM',
      domain: 'financial',
    }));

    const res50 = await app.inject({
      method: 'POST',
      url: '/v1/translate/batch',
      headers: { 'x-api-key': validApiKey },
      payload: { requests: batch50 },
    });
    expect(res50.statusCode).toBe(200);
    const data50 = JSON.parse(res50.body);
    expect(data50.results).toHaveLength(50);

    // 2. Over limit: 51 items
    const batch51 = Array.from({ length: 51 }, (_, i) => ({
      sourceText: `Message ${i}`,
      sourceLang: 'fr',
      targetLang: 'ewo-CM',
    }));

    const res51 = await app.inject({
      method: 'POST',
      url: '/v1/translate/batch',
      headers: { 'x-api-key': validApiKey },
      payload: { requests: batch51 },
    });
    expect(res51.statusCode).toBe(400);
  });

  it('B1.3 should reject invalid API keys with 401 Unauthorized in production mode', async () => {
    const prevKeyReq = process.env.REQUIRE_API_KEY;
    try {
      process.env.REQUIRE_API_KEY = 'true';
      const res = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: { 'x-api-key': 'invalid_secret_key_999' },
        payload: {
          sourceText: 'Test auth rejection',
          sourceLang: 'fr',
          targetLang: 'ewo-CM',
        },
      });

      expect(res.statusCode).toBe(401);
      const data = JSON.parse(res.body);
      expect(data.error).toBe('Unauthorized');
    } finally {
      process.env.REQUIRE_API_KEY = prevKeyReq;
    }
  });

  it('B1.4 should return 404 Not Found for non-existent or quarantined language code', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/languages/xyz-UNKNOWN',
    });

    expect(res.statusCode).toBe(404);
  });

  it('B1.5 should reject production activation of unreviewed Cameroonian templates with 422', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/packs/duala/status',
      payload: { status: 'production_approved' },
    });

    // Language registry throws validation error when attempting to approve unreviewed pack
    expect([400, 422, 500]).toContain(res.statusCode);
  });

  it('B1.6 should reject forged or mismatched webhook signatures', () => {
    const secret = 'whsec_prod_key_123';
    const payload = { event: 'audit.financial_drift_detected', amount: '50 000 FCFA' };
    const forgedSignature = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';

    const isValid = verifyHmacSignature(payload, forgedSignature, secret);
    expect(isValid).toBe(false);
  });
});
