import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { TranslationPipeline, type TranslationProvider } from '@linguabridge/translation-engine';
import type { TranslationRequest, TranslationResult, ProviderHealth } from '@linguabridge/shared-types';

describe('LinguaBridge API Security, Sovereign Routing & Penetration Suite', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ enableLogging: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // --------------------------------------------------------------------------
  // 1. API Key Lifecycle: Provisioning, Protection & Instant Revocation
  // --------------------------------------------------------------------------
  describe('API Key Lifecycle Management', () => {
    let createdKeyId: string;
    let createdRawKey: string;

    it('provisions a new API key with permissions and quota via POST /v1/keys', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/keys',
        payload: {
          name: 'Penetration-Test-Key',
          permissions: ['translate:read', 'translate:batch'],
          quota: {
            requestsPerMinute: 120,
            requestsPerDay: 5000,
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.id).toBeDefined();
      expect(data.name).toBe('Penetration-Test-Key');
      expect(data.key).toMatch(/^lb_live_/);
      expect(data.prefix).toBeDefined();
      expect(data.isActive).toBe(true);
      expect(data.permissions).toContain('translate:read');

      createdKeyId = data.id;
      createdRawKey = data.key;
    });

    it('lists all keys via GET /v1/keys without revealing secret plaintext keys', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/keys',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(Array.isArray(data.keys)).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(1);

      const found = data.keys.find((k: any) => k.id === createdKeyId);
      expect(found).toBeDefined();
      expect(found.name).toBe('Penetration-Test-Key');
      expect(found.isActive).toBe(true);
      // Security invariant: secret raw key MUST NOT be returned in list endpoint
      expect(found.key).toBeUndefined();
    });

    it('translates successfully using the newly provisioned key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: {
          'x-api-key': createdRawKey,
        },
        payload: {
          sourceText: 'Solde',
          sourceLang: 'fr',
          targetLang: 'en',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.translatedText).toBe('Balance');
      expect(data.status).toBe('success');
    });

    it('instantly revokes the API key via POST /v1/keys/:id/revoke', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/v1/keys/${createdKeyId}/revoke`,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.id).toBe(createdKeyId);
      expect(data.status).toBe('revoked');
      expect(data.key.isActive).toBe(false);
      expect(data.key.revokedAt).toBeDefined();
    });

    it('immediately blocks requests with HTTP 401 using the revoked key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: {
          'x-api-key': createdRawKey,
        },
        payload: {
          sourceText: 'Solde',
          sourceLang: 'fr',
          targetLang: 'en',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('API key revoked or invalid');
    });

    it('immediately blocks unknown or nonexistent API keys with HTTP 401', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: {
          'x-api-key': 'lb_live_fake_unknown_token_99999',
        },
        payload: {
          sourceText: 'Solde',
          sourceLang: 'fr',
          targetLang: 'en',
        },
      });

      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('API key revoked or invalid');
    });

    it('also supports DELETE /v1/keys/:id for standard REST revocation', async () => {
      // Create second key
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/keys',
        payload: { name: 'Temporary-Key-For-Delete' },
      });
      const keyData = JSON.parse(createRes.body);

      // Revoke with DELETE
      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/v1/keys/${keyData.id}`,
      });
      expect(deleteRes.statusCode).toBe(200);

      // Verify immediate 401
      const testRes = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: { 'x-api-key': keyData.key },
        payload: { sourceText: 'Solde', sourceLang: 'fr', targetLang: 'en' },
      });
      expect(testRes.statusCode).toBe(401);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Sovereign Linguistic Routing: The 5 Mastered Cameroonian Languages
  // --------------------------------------------------------------------------
  describe('Sovereign 5 Cameroonian Languages Routing', () => {
    it('returns all 5 certified national languages in GET /v1/languages', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/languages',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      const codes = data.languages.map((l: any) => l.code);

      // 1. Ewondo (ewo-CM)
      expect(codes).toContain('ewo-CM');
      // 2. Fulfulde (fuv-CM)
      expect(codes).toContain('fuv-CM');
      // 3. Haoussa (hau-CM)
      expect(codes).toContain('hau-CM');
      // 4. Kanuri (knc-CM)
      expect(codes).toContain('knc-CM');
      // 5. Pidgin English (pcm-CM)
      expect(codes).toContain('pcm-CM');
    });

    it('strictly isolates and quarantines Duala (dua-CM) from public catalog', async () => {
      const listResponse = await app.inject({
        method: 'GET',
        url: '/v1/languages',
      });
      const data = JSON.parse(listResponse.body);
      const codes = data.languages.map((l: any) => l.code);

      // Duala MUST NOT be in production available languages
      expect(codes).not.toContain('dua-CM');
      expect(codes).not.toContain('dua');

      // GET /v1/languages/dua-CM must return 404 Not Found
      const detailResponse = await app.inject({
        method: 'GET',
        url: '/v1/languages/dua-CM',
      });
      expect(detailResponse.statusCode).toBe(404);
    });

    it('translates financial terms and preserves exact FCFA amounts across all 5 languages', async () => {
      const testCases = [
        {
          lang: 'ewo-CM',
          source: 'Solde disponible: 25 000 FCFA',
          expectedTerm: 'Móni mí ne wá é bẽng',
          amount: '25 000 FCFA',
        },
        {
          lang: 'fuv-CM',
          source: 'Solde disponible: 25 000 FCFA',
          expectedTerm: 'Shede woodiide',
          amount: '25 000 FCFA',
        },
        {
          lang: 'hau-CM',
          source: 'Solde disponible: 25 000 FCFA',
          expectedTerm: 'Ragowar kuɗi',
          amount: '25 000 FCFA',
        },
        {
          lang: 'knc-CM',
          source: 'Solde disponible: 25 000 FCFA',
          expectedTerm: 'Kəla kəlabe mbeji',
          amount: '25 000 FCFA',
        },
        {
          lang: 'pcm-CM',
          source: 'Solde disponible: 25 000 FCFA',
          expectedTerm: 'Money wey dey available',
          amount: '25 000 FCFA',
        },
      ];

      for (const tc of testCases) {
        const response = await app.inject({
          method: 'POST',
          url: '/v1/translate',
          headers: { 'x-api-key': 'lb_demo_key_2026' },
          payload: {
            sourceText: tc.source,
            sourceLang: 'fr',
            targetLang: tc.lang,
            domain: 'financial',
          },
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.status).toBe('success');
        expect(result.targetLang).toBe(tc.lang);
        // Financial invariant: Amount 25 000 FCFA MUST be preserved identically!
        expect(result.translatedText).toContain(tc.amount);
        expect(result.translatedText).toContain(tc.expectedTerm);
      }
    });

    it('preserves mobile phone numbers (+237 699 123 456) across translations', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: { 'x-api-key': 'lb_demo_key_2026' },
        payload: {
          sourceText: 'Numéro du destinataire: +237 699 123 456',
          sourceLang: 'fr',
          targetLang: 'ewo-CM',
          domain: 'financial',
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.translatedText).toContain('+237 699 123 456');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Developer Audit Logs & Control Dashboard Telemetry
  // --------------------------------------------------------------------------
  describe('Audit Logging & Developer Control Dashboard', () => {
    it('records and returns detailed audit logs via GET /v1/logs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/logs?limit=10',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(Array.isArray(data.logs)).toBe(true);
      expect(data.total).toBeGreaterThan(0);

      const latest = data.logs[0];
      expect(latest.id).toBeDefined();
      expect(latest.timestamp).toBeDefined();
      expect(latest.method).toBeDefined();
      expect(latest.statusCode).toBeDefined();
      expect(latest.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('provides real-time metrics in GET /v1/dashboard/stats', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/dashboard/stats',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);

      expect(data.totalRequests).toBeGreaterThan(0);
      expect(data.activeKeys).toBeGreaterThanOrEqual(1);
      expect(data.revokedKeys).toBeGreaterThanOrEqual(1);
      expect(data.averageLatencyMs).toBeGreaterThanOrEqual(0);
      expect(data.systemStatus).toBe('healthy');
      expect(data.languageDistribution).toBeDefined();
      expect(data.languageDistribution['ewo-CM']).toBeDefined();
      expect(data.languageDistribution['fuv-CM']).toBeDefined();
      expect(data.languageDistribution['hau-CM']).toBeDefined();
      expect(data.languageDistribution['knc-CM']).toBeDefined();
      expect(data.languageDistribution['pcm-CM']).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 4. "Méthode de la Critique" — Penetration, Injection & Crash Resistance
  // --------------------------------------------------------------------------
  describe('"Méthode de la Critique" (Crash & Penetration Resistance)', () => {
    it('survives SQL injection attempts in financial payloads without crashing', async () => {
      const sqlInjectionPayloads = [
        "Solde: 50 000 FCFA' OR '1'='1",
        "Transfert de 10 000 FCFA; DROP TABLE api_keys; --",
        "Confirmer'; EXEC xp_cmdshell('whoami'); --",
        "1 UNION SELECT null, username, password FROM users--",
      ];

      for (const attackText of sqlInjectionPayloads) {
        const response = await app.inject({
          method: 'POST',
          url: '/v1/translate',
          headers: { 'x-api-key': 'lb_demo_key_2026' },
          payload: {
            sourceText: attackText,
            sourceLang: 'fr',
            targetLang: 'ewo-CM',
            domain: 'financial',
          },
        });

        // The API must NEVER crash or return 500
        expect([200, 400]).toContain(response.statusCode);
      }
    });

    it('survives command injection and shell escape sequences without executing commands', async () => {
      const commandInjectionPayloads = [
        'Solde de 25 000 FCFA $(rm -rf /tmp/test)',
        'Transfert `cat /etc/passwd` 15000 FCFA',
        'Frais: 150 FCFA | cat /dev/urandom',
        'Confirmer & ping -c 4 127.0.0.1 &',
      ];

      for (const attackText of commandInjectionPayloads) {
        const response = await app.inject({
          method: 'POST',
          url: '/v1/translate',
          headers: { 'x-api-key': 'lb_demo_key_2026' },
          payload: {
            sourceText: attackText,
            sourceLang: 'fr',
            targetLang: 'pcm-CM',
            domain: 'financial',
          },
        });

        expect([200, 400]).toContain(response.statusCode);
      }
    });

    it('handles Cross-Site Scripting (XSS) in transaction references safely', async () => {
      const xssPayload = 'Facture #48291 <script>alert("XSS_ATTACK")</script>';

      const response = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: { 'x-api-key': 'lb_demo_key_2026' },
        payload: {
          sourceText: xssPayload,
          sourceLang: 'fr',
          targetLang: 'ewo-CM',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.translatedText).toBeDefined();
    });

    it('rejects corrupted payload bodies with standard HTTP 400 without crashing', async () => {
      // 1. Invalid empty string
      const emptyRes = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: { 'x-api-key': 'lb_demo_key_2026' },
        payload: {
          sourceText: '',
          sourceLang: 'fr',
          targetLang: 'en',
        },
      });
      expect(emptyRes.statusCode).toBe(400);

      // 2. Missing sourceLang
      const missingLangRes = await app.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: { 'x-api-key': 'lb_demo_key_2026' },
        payload: {
          sourceText: 'Valid text',
          targetLang: 'en',
        },
      });
      expect(missingLangRes.statusCode).toBe(400);

      // 3. Batch exceeding 50 items limit
      const oversizedBatch = Array.from({ length: 55 }, (_, i) => ({
        sourceText: `Solde ${i}`,
        sourceLang: 'fr',
        targetLang: 'en',
      }));

      const batchRes = await app.inject({
        method: 'POST',
        url: '/v1/translate/batch',
        headers: { 'x-api-key': 'lb_demo_key_2026' },
        payload: {
          requests: oversizedBatch,
        },
      });
      expect(batchRes.statusCode).toBe(400);
    });

    it('detects financial drift and flags unsafe translation when entity is tampered with', async () => {
      // Create custom provider that simulates an adversarial LLM modifying 50 000 FCFA to 20 000 FCFA
      class AdversarialTamperingProvider implements TranslationProvider {
        id = 'adversarial-tamper';
        name = 'Adversarial Tampering Provider';
        supports() { return true; }
        translate(req: TranslationRequest): Promise<TranslationResult> {
          return Promise.resolve({
            id: req.id || 'tamper-1',
            originalText: req.sourceText,
            translatedText: 'Móni mí ne wá é bẽng: 20 000 FCFA', // Tampered! Changed 50 000 to 20 000
            sourceLang: req.sourceLang,
            targetLang: req.targetLang,
            provider: this.id,
            status: 'success',
            cacheStatus: 'miss',
            warnings: [],
            latencyMs: 1,
          });
        }
        translateBatch(reqs: TranslationRequest[]) { return Promise.all(reqs.map((r) => this.translate(r))); }
        healthCheck(): Promise<ProviderHealth> { return Promise.resolve({ healthy: true, latencyMs: 0, message: 'ok', supportedPairs: [] }); }
      }

      const driftApp = await buildApp({
        enableLogging: false,
        providers: [new AdversarialTamperingProvider()],
      });
      await driftApp.ready();

      const response = await driftApp.inject({
        method: 'POST',
        url: '/v1/translate',
        headers: { 'x-api-key': 'lb_demo_key_2026' },
        payload: {
          sourceText: 'Solde disponible: 50 000 FCFA',
          sourceLang: 'fr',
          targetLang: 'ewo-CM',
          domain: 'financial',
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);

      // AST Financial Guard must intercept the tampering!
      expect(result.status).toBe('unsafe');
      expect(result.warnings.some((w: string) => w.includes('FINANCIAL_ENTITY_MISMATCH'))).toBe(true);
      // Reverted to sourceText to prevent disastrous fraudulent financial display
      expect(result.translatedText).toBe('Solde disponible: 50 000 FCFA');

      // Check dashboard drift alerts incremented
      const statsRes = await driftApp.inject({
        method: 'GET',
        url: '/v1/dashboard/stats',
      });
      const stats = JSON.parse(statsRes.body);
      expect(stats.driftAlerts).toBeGreaterThanOrEqual(1);

      await driftApp.close();
    });
  });
});
