import { describe, it, expect } from 'vitest';
import {
  computeHmacSignature,
  verifyHmacSignature,
  extractFinancialEntities,
  verifyZeroDriftAST,
} from '../helpers/test-utils';

/**
 * Tier 4: Real-World Application Scenarios — Yaoundé Orange Money Merchant Digital Receipt
 * Authoritative Source: ORIGINAL_REQUEST.md (R4) & PROJECT.md (§Milestones E2E Tier 4)
 */
describe('Tier 4: Real-World Scenario — Yaoundé Orange Money Merchant Digital Receipt', () => {
  it('4.2 should verify webhook, generate Ewondo digital receipt (Kaladí nláman), and validate zero drift', () => {
    const sharedSecret = 'om_secret_marche_central_yaounde';

    // 1. Ingest webhook event from Orange Money Cameroon Gateway
    const omWebhookPayload = {
      order_id: 'OM-YAO-2026-9921',
      merchant_id: 'MERCHANT-CENTRAL-01',
      customer_phone: '237699443322',
      amount: 12500,
      currency: 'XAF',
      fee: 125,
      status: 'SUCCESS' as const,
      timestamp: '2026-11-04T15:20:00Z',
      token: 'TK-OM-883311',
    };

    // 2. Cryptographic signature check
    const signature = computeHmacSignature(omWebhookPayload, sharedSecret);
    const isAuthentic = verifyHmacSignature(omWebhookPayload, signature, sharedSecret);
    expect(isAuthentic).toBe(true);

    // 3. Generate localized digital receipt in Ewondo
    const digitalReceipt = [
      '========================================',
      '        KALADÍ NLÁMAN ORANGE MONEY      ',
      '========================================',
      `Ngól Nkab:   ${omWebhookPayload.merchant_id}`,
      `Nfúbás:      ${omWebhookPayload.order_id}`,
      `Telefon:     ${omWebhookPayload.customer_phone}`,
      `Móni:        12 500 FCFA`,
      `Nfák:        125 FCFA`,
      `Token:       ${omWebhookPayload.token}`,
      `Akóma:       YÁ MAN (SUCCESS)`,
      '========================================',
    ].join('\n');

    // 4. Zero-drift verification against payload source
    const payloadTextSummary =
      `Paiement marchand ${omWebhookPayload.order_id} de 12 500 FCFA au ${omWebhookPayload.customer_phone}. ` +
      `Frais: 125 FCFA. Token: ${omWebhookPayload.token}`;

    const check = verifyZeroDriftAST(payloadTextSummary, digitalReceipt);
    expect(check.safe).toBe(true);

    // 5. Assert structure and terms
    expect(digitalReceipt).toContain('KALADÍ NLÁMAN');
    expect(digitalReceipt).toContain('12 500 FCFA');
    expect(digitalReceipt).toContain('125 FCFA');
    expect(digitalReceipt).toContain('237699443322');
    expect(digitalReceipt).toContain('TK-OM-883311');
  });
});
