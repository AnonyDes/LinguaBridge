import { describe, it, expect } from 'vitest';
import { FinancialEntityExtractor } from '../entity-extractor';

const extractor = new FinancialEntityExtractor();

describe('FinancialEntityExtractor', () => {
  it('extracts FCFA amounts', () => {
    const entities = extractor.extract('Votre solde est de 50 000 FCFA');
    expect(entities.some((e) => e.type === 'amount' && e.normalized.includes('50000'))).toBe(true);
  });

  it('extracts percentages', () => {
    const entities = extractor.extract('Taux d\'intérêt: 12.5%');
    expect(entities.some((e) => e.type === 'percentage' && e.normalized === '12.5')).toBe(true);
  });

  it('detects amount modification as unsafe', () => {
    const source = extractor.extract('Transfer 75 000 FCFA to Jean');
    const translated = extractor.extract('Transfer 7 500 FCFA to Jean'); // WRONG amount
    const result = extractor.compare(source, translated);
    expect(result.safe).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('passes when amounts are preserved', () => {
    const source = extractor.extract('Transfer 75 000 FCFA to Jean');
    const translated = extractor.extract('Transférer 75 000 FCFA à Jean');
    const result = extractor.compare(source, translated);
    expect(result.safe).toBe(true);
  });

  it('detects missing entity as unsafe', () => {
    const source = extractor.extract('Fee: 2.5%');
    const translated = extractor.extract('Fee: montant variable'); // percentage removed
    const result = extractor.compare(source, translated);
    expect(result.safe).toBe(false);
  });

  it('extracts Cameroonian phone numbers', () => {
    const entities = extractor.extract('Envoyer à +237 655 123 456');
    expect(entities.some((e) => e.type === 'phone')).toBe(true);
  });

  it('handles empty text and text without financial entities safely', () => {
    const emptyEntities = extractor.extract('');
    expect(emptyEntities).toEqual([]);
    const plainEntities = extractor.extract('Bonjour le monde');
    expect(plainEntities).toEqual([]);
    const comparison = extractor.compare(emptyEntities, plainEntities);
    expect(comparison.safe).toBe(true);
    expect(comparison.violations).toEqual([]);
  });

  it('extracts multiple amounts in the same text and verifies all', () => {
    const source = extractor.extract('Montant: 50 000 FCFA, Frais: 1 500 FCFA');
    expect(source.length).toBe(2);
    // Translation preserving both amounts
    const validTranslated = extractor.extract('Amount: 50 000 FCFA, Fee: 1 500 FCFA');
    expect(extractor.compare(source, validTranslated).safe).toBe(true);

    // Translation missing the second amount (triggers ENTITY_VALUE_CHANGED because amount type exists but value 1500 is missing)
    const invalidTranslated = extractor.extract('Amount: 50 000 FCFA, Fee: gratuit');
    const comp = extractor.compare(source, invalidTranslated);
    expect(comp.safe).toBe(false);
    expect(comp.violations.some((v) => v.issue.includes('ENTITY_VALUE_CHANGED'))).toBe(true);

    // Translation with all amounts omitted (triggers ENTITY_MISSING)
    const omittedTranslated = extractor.extract('Amount: gratuit, Fee: gratuit');
    const compMissing = extractor.compare(source, omittedTranslated);
    expect(compMissing.safe).toBe(false);
    expect(compMissing.violations.some((v) => v.issue.includes('ENTITY_MISSING'))).toBe(true);
  });

  it('extracts transaction IDs and account IBANs', () => {
    const entities = extractor.extract('Ref: TXN987654321 Account: CM2110001000123456789012345');
    expect(entities.some((e) => e.type === 'transaction_id' && e.normalized === 'TXN987654321')).toBe(true);
    expect(entities.some((e) => e.type === 'account_id')).toBe(true);
  });
});
