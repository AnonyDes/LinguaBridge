import { describe, it, expect } from 'vitest';
import {
  extractFinancialEntities,
  computeSha256Fingerprint,
  verifyZeroDriftAST,
} from '../helpers/test-utils';

/**
 * Tier 4: Real-World Application Scenarios — Douala E-Commerce Checkout Localization
 * Authoritative Source: ORIGINAL_REQUEST.md (R4, R5) & PROJECT.md (§Milestones E2E Tier 4)
 */
describe('Tier 4: Real-World Scenario — Douala E-Commerce Multi-Currency Checkout', () => {
  it('4.4 should secure Douala e-commerce cart totals during multi-language translation', () => {
    // 1. E-commerce shopping cart checkout payload
    const cartSummary = {
      orderId: 'DLA-SHOP-4401',
      items: [
        { name: 'Sac de riz 50kg', price: '28 500 FCFA', qty: 2, total: '57 000 FCFA' },
        { name: 'Bidon huile 5L', price: '7 500 FCFA', qty: 1, total: '7 500 FCFA' },
      ],
      shipping: '2 500 FCFA',
      grandTotal: '67 000 FCFA',
      recipientPhone: '237699554433',
    };

    const cartCheckoutString =
      `Commande ${cartSummary.orderId}: Total des articles: 64 500 FCFA. ` +
      `Frais de livraison à Akwa Douala: 2 500 FCFA. Montant total à payer: 67 000 FCFA au numéro 237699554433.`;

    // 2. Compute source entity fingerprint
    const sourceEntities = extractFinancialEntities(cartCheckoutString);
    const sourceFingerprint = computeSha256Fingerprint(sourceEntities);

    // 3. Translated checkout prompt for customer in Ewondo
    const localizedCheckoutString =
      `Nfúbás ${cartSummary.orderId}: Móni bǐyem: 64 500 FCFA. ` +
      `Nfák nloman é be Akwa Douala: 2 500 FCFA. Ngum móni: 67 000 FCFA é be telefon 237699554433.`;

    // 4. Zero-drift verification
    const check = verifyZeroDriftAST(cartCheckoutString, localizedCheckoutString);

    expect(check.safe).toBe(true);
    expect(check.violations).toHaveLength(0);
    expect(check.sourceFingerprint).toBe(sourceFingerprint);
    expect(check.translatedFingerprint).toBe(sourceFingerprint);

    // 5. Assert that no amounts or phone numbers have drifted
    expect(localizedCheckoutString).toContain('64 500 FCFA');
    expect(localizedCheckoutString).toContain('2 500 FCFA');
    expect(localizedCheckoutString).toContain('67 000 FCFA');
    expect(localizedCheckoutString).toContain('237699554433');
  });
});
