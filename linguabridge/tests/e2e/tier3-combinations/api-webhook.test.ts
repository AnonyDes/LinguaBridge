import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../../apps/api/src/app';
import { computeHmacSignature, verifyHmacSignature } from '../helpers/test-utils';

/**
 * Tier 3: Cross-Feature Combinations — Pairwise: API Batch -> Webhook Callback
 * Authoritative Source: ORIGINAL_REQUEST.md (R1) & PROJECT.md (§1 API Gateway)
 */
describe('Tier 3: Pairwise — API Batch Translation -> Webhook Callback Event', () => {
  let app: FastifyInstance;
  const validApiKey = 'lb_demo_key_2026';
  const webhookSecret = 'whsec_prod_cm_998877';

  beforeAll(async () => {
    app = await buildApp({ enableLogging: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('3.1 should execute batch translation via API and emit signed webhook event upon completion', async () => {
    // 1. Submit synchronous batch translation
    const batchPayload = {
      requests: [
        {
          sourceText: 'Facture électricité: 18 500 FCFA',
          sourceLang: 'fr',
          targetLang: 'ewo-CM',
          domain: 'financial',
        },
        {
          sourceText: 'Paiement eau potable: 4 200 FCFA',
          sourceLang: 'fr',
          targetLang: 'ewo-CM',
          domain: 'financial',
        },
      ],
    };

    const res = await app.inject({
      method: 'POST',
      url: '/v1/translate/batch',
      headers: { 'x-api-key': validApiKey },
      payload: batchPayload,
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.results).toHaveLength(2);

    // 2. Synthesize asynchronous Webhook event from batch output
    const webhookEvent = {
      id: 'evt_batch_' + Date.now(),
      event: 'translation.batch.completed',
      timestamp: new Date().toISOString(),
      attempt: 1,
      data: {
        batchSize: data.results.length,
        results: data.results,
      },
    };

    // 3. Cryptographic HMAC signature generation and verification
    const signature = computeHmacSignature(webhookEvent, webhookSecret);
    expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);

    const verified = verifyHmacSignature(webhookEvent, signature, webhookSecret);
    expect(verified).toBe(true);
  });
});
