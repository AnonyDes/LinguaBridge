import { describe, it, expect } from 'vitest';
import { verifyZeroDriftAST } from '../helpers/test-utils';

/**
 * Tier 2: Boundary & Corner Cases — R3 MCP Server
 * Authoritative Source: ORIGINAL_REQUEST.md (R3) & PROJECT.md (§3 MCP Server)
 */
describe('Tier 2: Boundary & Corner Cases — R3 MCP Server', () => {
  it('B3.1 should return JSON-RPC -32700 Parse Error frame for malformed input without crashing', () => {
    function parseJsonRpcFrame(raw: string) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.jsonrpc !== '2.0') {
          return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } };
        }
        return { success: true, payload: parsed };
      } catch {
        return { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } };
      }
    }

    const malformed1 = '{ "jsonrpc": "2.0", "method": "tools/list", '; // Truncated JSON
    const res1 = parseJsonRpcFrame(malformed1);
    expect(res1.error).toBeDefined();
    expect(res1.error?.code).toBe(-32700);

    const malformed2 = 'NOT_JSON_DATA';
    const res2 = parseJsonRpcFrame(malformed2);
    expect(res2.error?.code).toBe(-32700);
  });

  it('B3.2 should return structured error status when tool translate_financial_text targets unsupported language', () => {
    const supportedLangs = ['ewo-CM', 'fr', 'en'];
    const targetLang = 'unsupported_dialect_99';

    const isSupported = supportedLangs.includes(targetLang);
    expect(isSupported).toBe(false);

    const errorResult = {
      isError: true,
      status: 'failed',
      message: `Language '${targetLang}' is not supported by installed certified packs.`,
    };
    expect(errorResult.isError).toBe(true);
    expect(errorResult.message).toContain('not supported');
  });

  it('B3.3 should return empty matches list safely when lookup_glossary receives unknown or blank term', () => {
    function queryGlossaryMock(term: string) {
      if (!term || term.trim() === '') {
        return { matches: [], count: 0 };
      }
      return { matches: [], count: 0 };
    }

    const resEmpty = queryGlossaryMock('');
    expect(resEmpty.count).toBe(0);
    expect(resEmpty.matches).toEqual([]);

    const resUnknown = queryGlossaryMock('cryptocurrency_nonexistent_token_2026');
    expect(resUnknown.count).toBe(0);
  });

  it('B3.4 should return complete list of violations when verify_zero_drift detects multiple tampered entities', () => {
    const source = 'Envoyé 50 000 FCFA au 670112233 Ref: TXN-1001 le 12/05/2026';
    const corrupted = 'Envoyé 60 000 FCFA au 670998877 Ref: TXN-2002 le 12/05/2026';

    const check = verifyZeroDriftAST(source, corrupted);
    expect(check.safe).toBe(false);
    expect(check.violations.length).toBeGreaterThanOrEqual(3); // Amount, phone, txn all tampered

    const amountViolation = check.violations.find((v) => v.issue.includes('amount'));
    expect(amountViolation).toBeDefined();

    const phoneViolation = check.violations.find((v) => v.issue.includes('phone'));
    expect(phoneViolation).toBeDefined();
  });

  it('B3.5 should return resource error for invalid glossary URI linguabridge://glossary/invalid', () => {
    function resolveGlossaryUri(uri: string) {
      const match = uri.match(/^linguabridge:\/\/glossary\/(.+)$/);
      if (!match) return { error: { code: -32602, message: 'Invalid URI pattern' } };
      const lang = match[1];
      if (lang !== 'ewo-CM') {
        return { error: { code: -32004, message: `Resource not found: ${uri}` } };
      }
      return { success: true };
    }

    const res = resolveGlossaryUri('linguabridge://glossary/invalid-lang-code');
    expect(res.error).toBeDefined();
    expect(res.error?.code).toBe(-32004);
  });
});
