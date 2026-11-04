import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  MONOREPO_ROOT,
  LANGUAGE_PACKS_DIR,
  verifyZeroDriftAST,
  extractFinancialEntities,
} from '../helpers/test-utils';

/**
 * Tier 4: Real-World Application Scenarios — Offline CLI Developer Workflow
 * Authoritative Source: ORIGINAL_REQUEST.md (R2) & PROJECT.md (§Milestones E2E Tier 4)
 */
describe('Tier 4: Real-World Scenario — Offline Developer Workflow in Rural Cameroon', () => {
  it('4.3 should execute complete developer workflow without external internet services', () => {
    // 1. Developer verifies national certified Ewondo language pack offline
    const ewondoPackPath = path.resolve(LANGUAGE_PACKS_DIR, 'ewondo/manifest.json');
    expect(fs.existsSync(ewondoPackPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(ewondoPackPath, 'utf-8'));
    expect(manifest.status).toBe('production_approved');
    expect(manifest.qualityStatus).toBe('certified');
    expect(manifest.locale).toBe('ewo-CM');

    // 2. Developer reads local NACALCO consensus dictionary offline
    const glossaryPath = path.resolve(LANGUAGE_PACKS_DIR, 'ewondo/dictionaries/financial-glossary.json');
    expect(fs.existsSync(glossaryPath)).toBe(true);
    const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf-8'));
    const term = glossary.terms.find((t: any) => t.key === 'available_balance');
    expect(term).toBeDefined();
    expect(term.ewo).toBe('Móni mí ne wá é bẽng');

    // 3. Developer writes bank notification template in their local app
    const templateSource = 'Votre solde disponible est de 300 000 FCFA. Frais de tenue de compte: 1 500 FCFA.';
    const templateLocalized = 'Móni mí ne wá é bẽng: 300 000 FCFA. Nfák: 1 500 FCFA.';

    // 4. Developer runs standalone zero-drift AST verification offline (as in lb verify)
    const check = verifyZeroDriftAST(templateSource, templateLocalized);

    expect(check.safe).toBe(true);
    expect(check.violations).toHaveLength(0);
    expect(check.sourceFingerprint).toHaveLength(64);
    expect(check.sourceFingerprint).toBe(check.translatedFingerprint);
  });
});
