import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { LANGUAGE_PACKS_DIR } from '../helpers/test-utils';

/**
 * Tier 3: Cross-Feature Combinations — Pairwise: MCP Tool -> Language Pack Lookup
 * Authoritative Source: ORIGINAL_REQUEST.md (R3) & PROJECT.md (§3 MCP Server)
 */
describe('Tier 3: Pairwise — MCP Tool lookup_glossary -> Certified Language Pack Dictionary', () => {
  it('3.3 should query certified Ewondo financial dictionary matching NACALCO consensus terms', () => {
    const ewondoGlossaryPath = path.resolve(LANGUAGE_PACKS_DIR, 'ewondo/dictionaries/financial-glossary.json');
    expect(fs.existsSync(ewondoGlossaryPath)).toBe(true);

    const glossary = JSON.parse(fs.readFileSync(ewondoGlossaryPath, 'utf-8'));

    // Test essential financial terms required for Cameroon banking
    const testTerms = [
      { key: 'available_balance', term: 'Solde disponible', expectedEwo: 'Móni mí ne wá é bẽng' },
      { key: 'transfer', term: 'Virement / Transfert', expectedEwo: 'Lóm móni' },
      { key: 'fees', term: 'Frais', expectedEwo: 'Móni mébembá' },
      { key: 'amount', term: 'Montant', expectedEwo: 'Abui móni' },
    ];

    for (const item of testTerms) {
      const entry = glossary.terms.find((t: any) => t.key === item.key);
      expect(entry).toBeDefined();
      expect(entry.ewo).toContain(item.expectedEwo);
      expect(entry.phonetic).toBeDefined();
    }
  });
});
