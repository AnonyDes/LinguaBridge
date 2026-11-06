import { describe, it, expect, beforeEach } from 'vitest';
import { SpeechOrchestrator } from '../orchestrator';
import { MockSpeechProvider } from '../providers/mock-provider';

describe('SpeechOrchestrator - Degrade-First Speech Architecture', () => {
  let orchestrator: SpeechOrchestrator;

  beforeEach(() => {
    orchestrator = new SpeechOrchestrator();
  });

  it('synthesizes speech for supported languages (fr, en)', async () => {
    const res = await orchestrator.synthesize('Bonjour le monde', 'fr');
    expect(res.available).toBe(true);
    expect(res.lang).toBe('fr');
    expect(res.audioBase64).toBeDefined();
    expect(res.audioUrl).toContain('data:audio/wav;base64,');
    expect(res.fallbackLang).toBeNull();
  });

  it('synthesizes fluid live speech for the 5 Sovereign Cameroonian Languages', async () => {
    const sovereignLanguages = [
      { code: 'ewo-CM', sample: 'Mbólo, móni mí ne wá é bẽng' },
      { code: 'fuv-CM', sample: 'Jam bandu, ceede maada heddiiɗe' },
      { code: 'hau-CM', sample: 'Sannu, kudin asusunka' },
      { code: 'knc-CM', sample: 'Ndawuro, kudi asusunəmye' },
      { code: 'pcm-CM', sample: 'How far, your money balance na' },
    ];

    for (const item of sovereignLanguages) {
      const res = await orchestrator.synthesize(item.sample, item.code);
      expect(res.available).toBe(true);
      expect(res.lang).toBe(item.code);
      expect(res.audioBase64).toBeDefined();
      expect(res.audioUrl).toContain('data:audio/wav;base64,');
      expect(['african-neural-mms', 'meta-mms-neural-live']).toContain(res.engine);
      expect(res.fallbackLang).toBeNull();
    }
  }, 25000);

  it('strictly quarantines Duala and refuses voice synthesis', async () => {
    const dualaCodes = ['dua', 'dua-CM', 'dua-cm'];

    for (const code of dualaCodes) {
      const res = await orchestrator.synthesize('Mbolo mosso', code);
      expect(res.available).toBe(false);
      expect(res.lang).toBe(code);
      expect(res.unavailableReason).toContain('strictly quarantined');
      expect(res.fallbackLang).toBeNull();
    }
  });

  it('strictly refuses uncertified non-sovereign Cameroonian languages with explicit degrade message', async () => {
    const uncertifiedCodes = ['bas', 'bas-CM', 'bum', 'bum-CM'];

    for (const code of uncertifiedCodes) {
      const res = await orchestrator.synthesize('Mbôk', code);
      expect(res.available).toBe(false);
      expect(res.lang).toBe(code);
      expect(res.unavailableReason).toContain('Audio synthesis is currently unavailable');
      expect(res.unavailableReason).toContain('Silent fallback to another language is prevented');
      expect(res.fallbackLang).toBeNull();
    }
  });

  it('never substitutes an unsupported language with English or French audio', async () => {
    const res = await orchestrator.synthesize('Mbôk', 'bas-CM');
    expect(res.available).toBe(false);
    expect(res.fallbackLang).toBeNull();
    expect(res.audioBase64).toBeUndefined();
  });

  it('rejects empty input text gracefully', async () => {
    const res = await orchestrator.synthesize('   ', 'fr');
    expect(res.available).toBe(false);
    expect(res.unavailableReason).toContain('empty text');
  });

  it('reports language support accurately through isLanguageSupported', () => {
    expect(orchestrator.isLanguageSupported('fr')).toBe(true);
    expect(orchestrator.isLanguageSupported('en')).toBe(true);
    expect(orchestrator.isLanguageSupported('ewo-CM')).toBe(true);
    expect(orchestrator.isLanguageSupported('fuv-CM')).toBe(true);
    expect(orchestrator.isLanguageSupported('hau-CM')).toBe(true);
    expect(orchestrator.isLanguageSupported('knc-CM')).toBe(true);
    expect(orchestrator.isLanguageSupported('pcm-CM')).toBe(true);
    expect(orchestrator.isLanguageSupported('dua-CM')).toBe(false);
    expect(orchestrator.isLanguageSupported('bas-CM')).toBe(false);
    expect(orchestrator.isLanguageSupported('xyz-unknown')).toBe(false);
  });

  it('handles provider runtime failures gracefully without crashing', async () => {
    const faultyProvider = {
      id: 'faulty',
      name: 'Faulty Provider',
      supportedLanguages: ['de'],
      isLanguageSupported: (l: string) => l === 'de',
      synthesize: async () => {
        throw new Error('Connection timed out to TTS cluster');
      },
    };

    orchestrator.registerProvider(faultyProvider);
    const res = await orchestrator.synthesize('Guten Tag', 'de');
    expect(res.available).toBe(false);
    expect(res.unavailableReason).toContain('Connection timed out to TTS cluster');
    expect(res.fallbackLang).toBeNull();
  });
});
