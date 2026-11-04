import { describe, it, expect } from 'vitest';
import {
  extractFinancialEntities,
  computeSha256Fingerprint,
  verifyZeroDriftAST,
} from '../helpers/test-utils';

/**
 * Tier 3: Cross-Feature Combinations — Pairwise: CLI Verify -> Core AST Comparison
 * Authoritative Source: ORIGINAL_REQUEST.md (R2) & PROJECT.md (§2 & §Financial Zero-Drift AST Contract)
 */
describe('Tier 3: Pairwise — CLI Verify -> Core AST Fingerprint Comparison', () => {
  it('3.2 should ensure CLI zero-drift verification matches Core AST fingerprinting algorithm', () => {
    const sourceText = 'Transfert de 65 000 FCFA vers le 699112233 avec frais de 650 FCFA. Ref: TXN-445566.';
    const validTranslation = 'O mané lóm móni 65 000 FCFA é be 699112233 nǐ nfák 650 FCFA. Ref: TXN-445566.';

    // 1. Core AST extraction
    const sourceEntities = extractFinancialEntities(sourceText);
    const targetEntities = extractFinancialEntities(validTranslation);

    const sourceFp = computeSha256Fingerprint(sourceEntities);
    const targetFp = computeSha256Fingerprint(targetEntities);

    // 2. Both fingerprints must match exactly
    expect(sourceFp).toBe(targetFp);
    expect(sourceFp).toHaveLength(64);

    // 3. Compare using zero-drift comparator
    const check = verifyZeroDriftAST(sourceText, validTranslation);
    expect(check.safe).toBe(true);
    expect(check.sourceFingerprint).toBe(sourceFp);
    expect(check.translatedFingerprint).toBe(targetFp);
    expect(check.violations).toHaveLength(0);
  });
});
