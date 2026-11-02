import { describe, it, expect } from 'vitest';
import { FinancialEntityExtractor, normalizeAmount, computeEntityFingerprint } from '../entity-extractor';

const extractor = new FinancialEntityExtractor();

describe('FinancialEntityExtractor', () => {
  it('extracts FCFA amounts', () => {
    const entities = extractor.extract('Votre solde est de 50 000 FCFA');
    expect(entities.some((e) => e.type === 'amount' && e.normalized.includes('50000'))).toBe(true);
  });

  it('correctly normalizes European and Anglo-Saxon decimal amounts without double dots', () => {
    expect(normalizeAmount('15.500,50')).toBe('15500.50');
    expect(normalizeAmount('15,500.50')).toBe('15500.50');
    expect(normalizeAmount('15 500,50')).toBe('15500.50');
    expect(normalizeAmount('15k')).toBe('15000');
    expect(normalizeAmount('2.5k')).toBe('2500');
  });

  it('extracts informal CEMAC currency expressions (frs, f, k cfa)', () => {
    const e1 = extractor.extract('Frais: 150frs');
    expect(e1.some((e) => e.type === 'amount' && e.normalized === '150_FCFA')).toBe(true);

    const e2 = extractor.extract('Envoyer 15k cfa');
    expect(e2.some((e) => e.type === 'amount' && e.normalized === '15000_FCFA')).toBe(true);
  });

  it('computes and validates SHA-256 cryptographic fingerprints', () => {
    const e1 = extractor.extract('Virement de 75 000 FCFA vers +237 699 123 456');
    const e2 = extractor.extract('Transfer of 75 000 FCFA to +237 699 123 456');
    const comp = extractor.compare(e1, e2);

    expect(comp.safe).toBe(true);
    expect(comp.sourceFingerprint).toHaveLength(64);
    expect(comp.sourceFingerprint).toBe(comp.translatedFingerprint);
  });

  it('detects amount modification as unsafe and mismatches fingerprints', () => {
    const source = extractor.extract('Transfer 75 000 FCFA to Jean');
    const translated = extractor.extract('Transfer 7 500 FCFA to Jean');
    const result = extractor.compare(source, translated);
    expect(result.safe).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.sourceFingerprint).not.toBe(result.translatedFingerprint);
  });

  it('extracts percentages', () => {
    const entities = extractor.extract('Taux d\'intérêt: 12.5%');
    expect(entities.some((e) => e.type === 'percentage' && e.normalized === '12.5')).toBe(true);
  });

  it('passes when amounts are preserved', () => {
    const source = extractor.extract('Transfer 75 000 FCFA to Jean');
    const translated = extractor.extract('Transférer 75 000 FCFA à Jean');
    const result = extractor.compare(source, translated);
    expect(result.safe).toBe(true);
  });

  it('detects missing entity as unsafe', () => {
    const source = extractor.extract('Fee: 2.5%');
    const translated = extractor.extract('Fee: montant variable');
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

  it('extracts transaction IDs and account IBANs', () => {
    const entities = extractor.extract('Ref: TXN987654321 Account: CM2110001000123456789012345');
    expect(entities.some((e) => e.type === 'transaction_id' && e.normalized === 'TXN987654321')).toBe(true);
    expect(entities.some((e) => e.type === 'account_id')).toBe(true);
  });
});
