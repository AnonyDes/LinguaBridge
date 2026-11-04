import { describe, it, expect } from 'vitest';
import { runVerify } from '../commands/verify';

describe('lb verify command', () => {
  it('returns exitCode 0 and safe: true for exact monetary entity match', async () => {
    const result = await runVerify(
      'Solde: 50 000 FCFA',
      'Móni mí ne: 50 000 FCFA',
      { exit: false }
    );

    expect(result.safe).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.violations).toHaveLength(0);
    expect(result.sourceFingerprint).toBe(result.translatedFingerprint);
    expect(result.sourceFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(result.sourceEntities).toHaveLength(1);
    expect(result.sourceEntities[0].normalized).toBe('50000_FCFA');
  });

  it('returns exitCode 1 and safe: false when amount is altered', async () => {
    const result = await runVerify(
      'Solde: 50 000 FCFA',
      'Móni mí ne: 60 000 FCFA',
      { exit: false }
    );

    expect(result.safe).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.sourceFingerprint).not.toBe(result.translatedFingerprint);
    expect(result.violations[0].issue).toContain('ENTITY_VALUE_CHANGED');
    expect(result.violations[0].sourceValue).toBe('50000_FCFA');
  });

  it('returns exitCode 1 and safe: false when phone number is altered', async () => {
    const result = await runVerify(
      'Envoyé au +237 699 123 456',
      'Lóm móni au +237 699 999 999',
      { exit: false }
    );

    expect(result.safe).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('returns exitCode 1 and safe: false when entity is missing in translation', async () => {
    const result = await runVerify(
      'Paiement de 15 000 FCFA effectué',
      'Paiement effectué',
      { exit: false }
    );

    expect(result.safe).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.violations[0].issue).toContain('ENTITY_MISSING');
  });

  it('returns exitCode 0 for text with zero financial entities', async () => {
    const result = await runVerify(
      'Bonjour le monde',
      'Mbóló émo',
      { exit: false }
    );

    expect(result.safe).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.sourceEntities).toHaveLength(0);
    expect(result.sourceFingerprint).toBe('0000000000000000000000000000000000000000000000000000000000000000');
  });

  it('normalizes currency formats like 15k vs 15 000 FCFA', async () => {
    const result = await runVerify(
      'Frais: 15k FCFA',
      'Frais: 15 000 FCFA',
      { exit: false }
    );

    expect(result.safe).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.sourceFingerprint).toBe(result.translatedFingerprint);
  });

  it('supports --json mode without throwing', async () => {
    const result = await runVerify(
      'Solde: 10 000 FCFA',
      'Móni: 10 000 FCFA',
      { json: true, exit: false }
    );

    expect(result.safe).toBe(true);
    expect(result.exitCode).toBe(0);
  });
});
