import { describe, it, expect } from 'vitest';
import { runTranslate } from '../commands/translate';

describe('lb translate command', () => {
  it('translates French financial text to Ewondo preserving zero-drift AST', async () => {
    const res = await runTranslate('Solde disponible: 15 000 FCFA', {
      target: 'ewo-CM',
      source: 'fr',
      exit: false,
    });

    expect(res.safe).toBe(true);
    expect(res.exitCode).toBe(0);
    expect(res.result.translatedText).toContain('15 000 FCFA');
    expect(res.result.translatedText).toContain('Móni mí ne wá é bẽng');
    expect(res.sourceEntities).toHaveLength(1);
    expect(res.sourceEntities[0].normalized).toBe('15000_FCFA');
    expect(res.sourceFingerprint).toBe(res.translatedFingerprint);
  });

  it('detects multiple financial entities during translation', async () => {
    const text = 'Transfert de 5 000 FCFA vers +237 699 123 456';
    const res = await runTranslate(text, {
      target: 'ewo-CM',
      source: 'fr',
      exit: false,
    });

    expect(res.safe).toBe(true);
    expect(res.exitCode).toBe(0);
    expect(res.sourceEntities.length).toBeGreaterThanOrEqual(2);

    const types = res.sourceEntities.map((e) => e.type);
    expect(types).toContain('amount');
    expect(types).toContain('phone');
  });

  it('supports JSON output mode', async () => {
    const res = await runTranslate('Solde: 20 000 FCFA', {
      target: 'ewo-CM',
      json: true,
      exit: false,
    });

    expect(res.result.status).toBe('success');
    expect(res.safe).toBe(true);
  });

  it('throws an error when target language is missing', async () => {
    await expect(
      runTranslate('Hello', {
        target: '',
        exit: false,
      })
    ).rejects.toThrow(/Target language is required/);
  });

  it('throws an error when text is empty', async () => {
    await expect(
      runTranslate('   ', {
        target: 'ewo-CM',
        exit: false,
      })
    ).rejects.toThrow('No text provided to translate.');
  });
});
