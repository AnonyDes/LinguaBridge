import { describe, it, expect } from 'vitest';
import {
  extractFinancialEntities,
  computeSha256Fingerprint,
  verifyZeroDriftAST,
} from '../helpers/test-utils';

/**
 * Tier 4: Real-World Application Scenarios — Cameroon MoMo P2P Transfer Workflow
 * Authoritative Source: ORIGINAL_REQUEST.md (R4) & PROJECT.md (§Milestones E2E Tier 4)
 */
describe('Tier 4: Real-World Scenario — Cameroon MTN MoMo P2P Transfer Localization', () => {
  it('4.1 should execute end-to-end P2P transfer notification localization into Ewondo with zero drift', () => {
    // 1. Raw SMS notification received by subscriber in Yaoundé/Mbalmayo
    const rawMoMoSms =
      'Vous avez envoyé 25 000 FCFA avec succès à AMVENE MVONDO (237670123456) le 04/11/2026 14:30:15. ' +
      'Frais: 250 FCFA. Nouveau solde: 84 750 FCFA. ID Transaction: TXN-CM-9081234.';

    // 2. Extract entities and compute source cryptographic fingerprint
    const sourceEntities = extractFinancialEntities(rawMoMoSms);
    const sourceFingerprint = computeSha256Fingerprint(sourceEntities);

    expect(sourceFingerprint).toHaveLength(64);
    expect(sourceEntities.map((e) => e.type)).toContain('amount');
    expect(sourceEntities.map((e) => e.type)).toContain('phone');
    expect(sourceEntities.map((e) => e.type)).toContain('transaction_id');

    // 3. Localize to sovereign Ewondo using consensus financial terms
    // "Envoyé" -> "O mané lóm"
    // "Frais" -> "Nfák"
    // "Solde" -> "Móni mí ne wá é bẽng"
    const localizedEwondoNotification =
      'O mané lóm móni 25 000 FCFA é be AMVENE MVONDO (237670123456) ngól 04/11/2026. ' +
      'Nfák: 250 FCFA. Móni mí ne wá é bẽng: 84 750 FCFA. ID Transaction: TXN-CM-9081234.';

    // 4. Cryptographic zero-drift verification
    const check = verifyZeroDriftAST(rawMoMoSms, localizedEwondoNotification);

    expect(check.safe).toBe(true);
    expect(check.violations).toHaveLength(0);
    expect(check.sourceFingerprint).toBe(sourceFingerprint);
    expect(check.translatedFingerprint).toBe(sourceFingerprint);

    // 5. Assert all financial entities preserved without single bit of modification
    expect(localizedEwondoNotification).toContain('25 000 FCFA');
    expect(localizedEwondoNotification).toContain('250 FCFA');
    expect(localizedEwondoNotification).toContain('84 750 FCFA');
    expect(localizedEwondoNotification).toContain('237670123456');
    expect(localizedEwondoNotification).toContain('TXN-CM-9081234');
  });
});
