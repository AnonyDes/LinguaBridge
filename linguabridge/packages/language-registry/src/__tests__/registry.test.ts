import { describe, it, expect } from 'vitest';
import { LanguageRegistry } from '../registry';
import type { LanguagePackManifest } from '@linguabridge/shared-types';

const samplePack: LanguagePackManifest = {
  id: 'en-fr',
  name: 'English - French',
  iso639_3: 'fra',
  locale: 'fr-FR',
  version: '1.0.0',
  schemaVersion: '1.0.0',
  status: 'production_approved',
  capabilities: {
    hasDictionary: true,
    hasParallelCorpus: true,
    hasSpeech: true,
    hasPronunciation: true,
    hasGlossary: true,
  },
  supportedSourceLangs: ['en'],
  supportedTargetLangs: ['fr'],
  license: 'MIT',
  provenance: 'Standard dataset',
  qualityStatus: 'certified',
};

const ewondoTemplate: LanguagePackManifest = {
  id: 'ewondo',
  name: 'Ewondo',
  iso639_3: 'ewo',
  locale: 'ewo-CM',
  version: '0.0.1-template',
  schemaVersion: '1.0.0',
  status: 'not_installed',
  capabilities: {
    hasDictionary: false,
    hasParallelCorpus: false,
    hasSpeech: false,
    hasPronunciation: false,
    hasGlossary: false,
  },
  supportedSourceLangs: [],
  supportedTargetLangs: [],
  license: 'TBD',
  provenance: 'Configuration template only',
  qualityStatus: 'unverified',
};

describe('LanguageRegistry', () => {
  it('loads valid manifest', async () => {
    const registry = new LanguageRegistry();
    const result = await registry.loadManifest(samplePack);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid manifest', async () => {
    const registry = new LanguageRegistry();
    // @ts-expect-error testing invalid manifest
    const result = await registry.loadManifest({ id: 'broken' });
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('only exposes production_approved packs to getAvailableLanguages()', async () => {
    const registry = new LanguageRegistry();
    await registry.loadManifest(samplePack);
    await registry.loadManifest(ewondoTemplate);

    const available = registry.getAvailableLanguages();
    expect(available.length).toBe(1);
    expect(available[0].code).toBe('fr-FR');
    expect(available.some((l) => l.code === 'ewo-CM')).toBe(false);
  });

  it('prohibits activating unverified Cameroonian language packs', async () => {
    const registry = new LanguageRegistry();
    const packs = ['ewondo', 'duala', 'basaa', 'fulfulde', 'bulu'];
    for (const id of packs) {
      await registry.loadManifest({ ...ewondoTemplate, id });
      expect(() => {
        registry.updatePackStatus(id, 'production_approved');
      }).toThrowError(/Cameroonian language resources not yet verified/);
    }
  });

  it('correctly checks canTranslateTo', async () => {
    const registry = new LanguageRegistry();
    await registry.loadManifest(samplePack);
    await registry.loadManifest(ewondoTemplate);

    expect(registry.canTranslateTo('fr')).toBe(true);
    expect(registry.canTranslateTo('ewo-CM')).toBe(false);
  });

  it('exposes all packs to admin view', async () => {
    const registry = new LanguageRegistry();
    await registry.loadManifest(samplePack);
    await registry.loadManifest(ewondoTemplate);

    const all = registry.getAllLanguagesForAdmin();
    expect(all.length).toBe(2);
    expect(all.find((p) => p.code === 'ewo-CM')?.isAvailable).toBe(false);
    expect(all.find((p) => p.code === 'fr-FR')?.isAvailable).toBe(true);
  });
});
