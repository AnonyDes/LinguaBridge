import pairs from './duala-research-pairs.json';
import { translateSentenceToSovereign } from './sovereign-lexicon';

const researchPairs: Record<string, string> = pairs;
// Attested everyday expressions, duala.org/learn (retrieved 2026-11-05).
// Experimental UI demo only; no reviewed banking terminology. Duala is quarantined.
const frenchResearchPairs: Record<string, string> = {
  'bonjour': 'Mbolo',
  'salut': 'Mbolo',
  'bonjour (matin)': 'Mbolo mosso',
  'au revoir': 'Ná wèndi',
  'merci': 'Asè',
  'oui': 'Ewe',
  'non': 'Dè',
  'comment vas-tu ?': 'Wé̩sé̩ ?',
};
const normalize = (text: string) => text.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');

/** Experimental exact-sentence lookup. No inferred word translations or French pivot. */
export function lookupDualaResearchSentence(text: string, sourceLang: string): string | null {
  if (sourceLang === 'fr') return frenchResearchPairs[normalize(text)] || null;
  if (sourceLang === 'en') return researchPairs[normalize(text)] || null;
  return null;
}

export function translateLocalText(text: string, sourceLang: string, targetLang: string): {
  translatedText: string; status: 'success' | 'unverified'; warnings: string[];
} {
  const normTarget = targetLang.trim().toLowerCase();

  // 1. Sovereign Cameroonian Languages: Ewondo, Fulfulde, Haoussa, Kanuri, Pidgin
  const sovereignPrefixes = ['ewo', 'fuv', 'fub', 'hau', 'knc', 'pcm'];
  if (sovereignPrefixes.some((p) => normTarget.startsWith(p))) {
    return translateSentenceToSovereign(text, targetLang);
  }

  // 2. Duala is strictly in quarantine
  if (normTarget === 'dua' || normTarget === 'dua-cm') {
    return {
      translatedText: text,
      status: 'unverified',
      warnings: ['DUALA_QUARANTINED_UNVERIFIED', 'DUALA_NO_VERIFIED_TRANSLATION'],
    };
  }

  return { translatedText: text, status: 'unverified', warnings: ['NO_LOCAL_TRANSLATION'] };
}

export { translateSentenceToEwondo } from './ewondo-lexicon';
export { translateSentenceToSovereign } from './sovereign-lexicon';
