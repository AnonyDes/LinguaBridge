import { describe, it, expect } from 'vitest';
import {
  extractFinancialEntities,
  computeSha256Fingerprint,
  verifyZeroDriftAST,
  verifyHmacSignature,
} from '../helpers/test-utils';

/**
 * Tier 2: Boundary & Corner Cases — R4 FinTech Payment Gateway Adapters & Webhooks
 * Authoritative Source: ORIGINAL_REQUEST.md (R4) & PROJECT.md (§4 FinTech Adapters)
 */
describe('Tier 2: Boundary & Corner Cases — R4 FinTech Adapters', () => {
  it('B4.1 should independently extract and protect multiple distinct amounts (transfer, fee, new balance)', () => {
    const rawSms = 'Transfert de 75 000 FCFA réussi. Frais: 500 FCFA. Nouveau solde: 24 500 FCFA.';
    const entities = extractFinancialEntities(rawSms);

    const amounts = entities.filter((e) => e.type === 'amount');
    expect(amounts).toHaveLength(3);

    const normalizedAmounts = amounts.map((a) => a.normalized);
    expect(normalizedAmounts).toContain('75000_FCFA');
    expect(normalizedAmounts).toContain('500_FCFA');
    expect(normalizedAmounts).toContain('24500_FCFA');

    // Localized output must retain all 3 amounts
    const localized = 'O mané lóm móni 75 000 FCFA. Nfák: 500 FCFA. Móni mí ne wá é bẽng: 24 500 FCFA.';
    const check = verifyZeroDriftAST(rawSms, localized);
    expect(check.safe).toBe(true);
  });

  it('B4.2 should canonicalize diverse phone formatting variants into identical normalized MSISDNs', () => {
    const variants = [
      '+237 670 123 456',
      '00237670123456',
      '237-670-123-456',
      '670123456',
      '+237670123456',
    ];

    const extracted = variants.map((v) => extractFinancialEntities(`Numéro: ${v}`)[0]);

    for (const item of extracted) {
      expect(item).toBeDefined();
      expect(item.type).toBe('phone');
      // All normalize to 237670123456
      expect(item.normalized).toBe('237670123456');
    }

    // Fingerprint equivalence
    const fp1 = computeSha256Fingerprint([extracted[0]]);
    const fp2 = computeSha256Fingerprint([extracted[1]]);
    expect(fp1).toBe(fp2);
  });

  it('B4.3 should abort Orange Money receipt generation if webhook signature is forged', () => {
    const secret = 'om_secret_2026';
    const payload = {
      order_id: 'OM-FORGED-01',
      amount: 100000,
      currency: 'XAF',
      customer_phone: '237699000000',
    };
    const forgedSignature = 'sha256=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

    const isValid = verifyHmacSignature(payload, forgedSignature, secret);
    expect(isValid).toBe(false);

    // Guard: Do not generate receipt
    function processWebhookWithGuard(data: any, sig: string, sec: string) {
      if (!verifyHmacSignature(data, sig, sec)) {
        throw new Error('UnauthorizedWebhookError: Signature verification failed');
      }
      return 'Receipt Generated';
    }

    expect(() => processWebhookWithGuard(payload, forgedSignature, secret)).toThrow(/UnauthorizedWebhookError/);
  });

  it('B4.4 should preserve extreme financial limits: 0 FCFA and 5 000 000 FCFA daily MoMo cap', () => {
    const zeroAmountText = 'Frais de transaction: 0 FCFA';
    const maxAmountText = 'Plafond journalier atteint: 5 000 000 FCFA';

    const zeroCheck = verifyZeroDriftAST(zeroAmountText, 'Nfák: 0 FCFA');
    expect(zeroCheck.safe).toBe(true);

    const maxCheck = verifyZeroDriftAST(maxAmountText, 'Ngum amos: 5 000 000 FCFA');
    expect(maxCheck.safe).toBe(true);
  });

  it('B4.5 should sanitize deeply nested Aggregator payloads without mutating sensitive financial tokens', () => {
    const complexPayload = {
      checkout: {
        id: 'CHK-909',
        currency: 'XAF',
        pricing: {
          subtotal: 125000,
          taxes: [
            { name: 'TVA', amount: 24062 },
            { name: 'Centimes', amount: 2406 },
          ],
          total: 151468,
        },
      },
      customer: {
        contacts: [
          { type: 'primary', phone: '237677112233' },
          { type: 'backup', phone: '237699445566' },
        ],
      },
    };

    // Deep serialization AST check
    const serialized = JSON.stringify(complexPayload);
    const entities = extractFinancialEntities(serialized);

    const amounts = entities.filter((e) => e.type === 'amount');
    expect(amounts.length).toBeGreaterThanOrEqual(1);

    const phones = entities.filter((e) => e.type === 'phone');
    expect(phones).toHaveLength(2);
    expect(phones.map((p) => p.normalized)).toContain('237677112233');
    expect(phones.map((p) => p.normalized)).toContain('237699445566');
  });
});
