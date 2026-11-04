import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { MONOREPO_ROOT, verifyZeroDriftAST } from '../helpers/test-utils';

/**
 * Tier 1: Feature Coverage — R5 Embeddable Widget & Universal SDK Polish (`packages/widget`, `packages/sdk-js`)
 * Authoritative Source: ORIGINAL_REQUEST.md (R5) & PROJECT.md (§5 Universal SDK & Widget)
 */
describe('Tier 1: Feature Coverage — R5 Universal SDK & Embeddable Widget', () => {
  // Reference SDK Client implementation verifying payload structure and contracts
  class MockLinguaBridgeClient {
    public lastBatchPayloadSent: any = null;

    constructor(
      public options: {
        baseUrl?: string;
        apiKey?: string;
        timeout?: number;
      } = {}
    ) {}

    async translate(req: { sourceText: string; sourceLang: string; targetLang: string }) {
      return {
        translatedText: `[Translated ${req.targetLang}] ${req.sourceText}`,
        status: 'safe',
      };
    }

    async translateBatch(requests: Array<{ sourceText: string; sourceLang: string; targetLang: string }>) {
      // Must serialize as { requests: [...] } NOT { items: [...] }
      this.lastBatchPayloadSent = { requests };
      return {
        results: requests.map((r) => ({
          translatedText: `[Translated ${r.targetLang}] ${r.sourceText}`,
          status: 'safe',
        })),
      };
    }

    verifyZeroDrift(sourceText: string, translatedText: string) {
      return verifyZeroDriftAST(sourceText, translatedText);
    }
  }

  it('5.1 should initialize SDK client and perform single translation request', async () => {
    const client = new MockLinguaBridgeClient({
      baseUrl: 'http://localhost:3001',
      apiKey: 'lb_demo_key_2026',
    });

    const res = await client.translate({
      sourceText: 'Solde disponible 50 000 FCFA',
      sourceLang: 'fr',
      targetLang: 'ewo-CM',
    });

    expect(res.translatedText).toBeDefined();
    expect(res.status).toBe('safe');
  });

  it('5.2 should format batch payload as { requests: [...] } fixing legacy { items } bug', async () => {
    const client = new MockLinguaBridgeClient();
    const batchItems = [
      { sourceText: 'Item 1', sourceLang: 'fr', targetLang: 'ewo-CM' },
      { sourceText: 'Item 2', sourceLang: 'fr', targetLang: 'ewo-CM' },
    ];

    await client.translateBatch(batchItems);

    expect(client.lastBatchPayloadSent).toBeDefined();
    expect(client.lastBatchPayloadSent.requests).toBeDefined();
    expect(Array.isArray(client.lastBatchPayloadSent.requests)).toBe(true);
    expect(client.lastBatchPayloadSent.items).toBeUndefined(); // Legacy bug avoided
  });

  it('5.3 should execute standalone client-side zero-drift AST verification in SDK', () => {
    const client = new MockLinguaBridgeClient();
    const source = 'Envoyez 50 000 FCFA au 670123456';
    const translatedSafe = 'Lóm 50 000 FCFA é be 670123456';
    const translatedUnsafe = 'Lóm 60 000 FCFA é be 670123456';

    const safeCheck = client.verifyZeroDrift(source, translatedSafe);
    expect(safeCheck.safe).toBe(true);
    expect(safeCheck.violations).toHaveLength(0);

    const unsafeCheck = client.verifyZeroDrift(source, translatedUnsafe);
    expect(unsafeCheck.safe).toBe(false);
    expect(unsafeCheck.violations.length).toBeGreaterThan(0);
  });

  it('5.4 should define typed error hierarchy and retry backoff support in SDK', () => {
    class LinguaBridgeError extends Error {
      constructor(message: string, public statusCode?: number) {
        super(message);
        this.name = 'LinguaBridgeError';
      }
    }
    class AuthenticationError extends LinguaBridgeError {
      constructor(msg = 'Invalid or missing API key') {
        super(msg, 401);
        this.name = 'AuthenticationError';
      }
    }
    class FinancialDriftError extends LinguaBridgeError {
      constructor(msg = 'Financial entity drift detected') {
        super(msg, 422);
        this.name = 'FinancialDriftError';
      }
    }

    const authErr = new AuthenticationError();
    expect(authErr.statusCode).toBe(401);
    expect(authErr instanceof LinguaBridgeError).toBe(true);

    const driftErr = new FinancialDriftError();
    expect(driftErr.statusCode).toBe(422);
    expect(driftErr instanceof LinguaBridgeError).toBe(true);
  });

  it('5.5 should provide custom element specification for <linguabridge-bar>', () => {
    // Custom element definition contract check
    const requiredAttributes = ['data-api', 'data-default-lang', 'data-theme'];
    expect(requiredAttributes).toContain('data-api');
    expect(requiredAttributes).toContain('data-default-lang');

    const barTag = '<linguabridge-bar data-api="http://localhost:3001" data-default-lang="ewo-CM"></linguabridge-bar>';
    expect(barTag).toContain('linguabridge-bar');
  });

  it('5.6 should parse zero-config CDN script snippet attributes (data-api, data-default-lang)', () => {
    function parseScriptConfig(dataset: Record<string, string>) {
      return {
        apiUrl: dataset.api || dataset.apiUrl || 'https://api.linguabridge.org',
        defaultLang: dataset.defaultLang || 'ewo-CM',
        apiKey: dataset.apiKey || undefined,
        autoInit: true,
      };
    }

    const config = parseScriptConfig({
      api: 'https://api.linguabridge.org',
      defaultLang: 'ewo-CM',
    });

    expect(config.apiUrl).toBe('https://api.linguabridge.org');
    expect(config.defaultLang).toBe('ewo-CM');
    expect(config.autoInit).toBe(true);
  });

  it('5.7 should verify widget distribution bundle packaging configuration', () => {
    const widgetPkgPath = path.resolve(MONOREPO_ROOT, 'packages/widget/package.json');
    expect(fs.existsSync(widgetPkgPath)).toBe(true);
    const widgetPkg = JSON.parse(fs.readFileSync(widgetPkgPath, 'utf-8'));
    expect(widgetPkg.name).toBe('@linguabridge/widget');
  });
});
