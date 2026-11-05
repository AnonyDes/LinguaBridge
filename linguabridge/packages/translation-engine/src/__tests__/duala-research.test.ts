import { describe, expect, it } from 'vitest';
import { lookupDualaResearchSentence, translateLocalText } from '../providers/duala-research';
import { FixtureProvider } from '../providers/fixture.provider';

const example = 'A vine supports the branches .';

describe('Duala research mode', () => {
  it('uses only an attested exact English sentence', () => {
    expect(lookupDualaResearchSentence(example, 'en')).toBe('Bwele nde bo bambe ̱ mikanjo .');
    expect(lookupDualaResearchSentence(example, 'fr')).toBeNull();
  });
  it('never invents a French banking translation', async () => {
    const result = await new FixtureProvider().translate({ id: 'dua-1', sourceText: 'Solde disponible : 15 000 FCFA', sourceLang: 'fr', targetLang: 'dua-CM', domain: 'financial' });
    expect(result.translatedText).toBe('Solde disponible : 15 000 FCFA');
    expect(result.status).toBe('unverified');
    expect(result.warnings).toContain('DUALA_NO_VERIFIED_TRANSLATION');
  });
  it('preserves the existing Ewondo financial translator', () => {
    expect(translateLocalText('Solde disponible', 'fr', 'ewo-CM').translatedText).toBe('Móni mí ne wá é bẽng');
  });
});
