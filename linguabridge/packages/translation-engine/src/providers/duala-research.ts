import pairs from './duala-research-pairs.json';

const researchPairs: Record<string, string> = pairs;
// Attested everyday expressions, duala.org/learn (retrieved 2026-11-05).
// Experimental UI demo only; no reviewed banking terminology.
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
  if (targetLang === 'ewo' || targetLang === 'ewo-CM') {
    // Lazily imported below via the regular module dependency to keep languages isolated.
    const translatedText = translateSentenceToEwondo(text);
    return { translatedText, status: translatedText === text ? 'unverified' : 'success', warnings: translatedText === text ? ['EWONDO_NO_MATCH'] : [] };
  }
  if (targetLang === 'dua' || targetLang === 'dua-CM') {
    const match = lookupDualaResearchSentence(text, sourceLang);
    return { translatedText: match || text, status: 'unverified', warnings: [match ? 'DUALA_RESEARCH_SENTENCE_NOT_LINGUIST_VERIFIED' : 'DUALA_NO_VERIFIED_TRANSLATION'] };
  }
  return { translatedText: text, status: 'unverified', warnings: ['NO_LOCAL_TRANSLATION'] };
}

import { translateSentenceToEwondo } from './ewondo-lexicon';
