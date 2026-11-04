import { describe, it, expect } from 'vitest';
import { runPackLint } from '../commands/pack';
import { resolve } from 'node:path';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';

function resolveRepoPackPath(subpath: string): string {
  const candidates = [
    resolve(process.cwd(), subpath),
    resolve(process.cwd(), '..', subpath),
    resolve(process.cwd(), '..', '..', subpath),
    resolve(__dirname, '..', '..', '..', '..', subpath),
  ];
  for (const c of candidates) {
    if (existsSync(c)) {
      return c;
    }
  }
  return resolve(process.cwd(), subpath);
}

describe('lb pack lint command', () => {
  it('validates language-packs/ewondo successfully with exit code 0', async () => {
    const ewondoPath = resolveRepoPackPath('language-packs/ewondo');
    const res = await runPackLint(ewondoPath, { exit: false });

    expect(res.valid).toBe(true);
    expect(res.exitCode).toBe(0);
    expect(res.packId).toBe('ewondo');
    expect(res.qualityStatus).toBe('certified');
    expect(res.status).toBe('production_approved');
    expect(res.errors).toHaveLength(0);
  });

  it('rejects uncertified/template pack (language-packs/basaa) with exit code 1', async () => {
    const basaaPath = resolveRepoPackPath('language-packs/basaa');
    const res = await runPackLint(basaaPath, { exit: false });

    expect(res.valid).toBe(false);
    expect(res.exitCode).toBe(1);
    expect(res.errors.some((e) => e.toLowerCase().includes('certification') || e.toLowerCase().includes('quarantine') || e.toLowerCase().includes('not_installed') || e.toLowerCase().includes('unverified'))).toBe(true);
  });

  it('fails with exit code 1 when pack path does not exist', async () => {
    const res = await runPackLint('language-packs/non-existent-pack', { exit: false });

    expect(res.valid).toBe(false);
    expect(res.exitCode).toBe(1);
    expect(res.errors[0]).toContain('Target path does not exist');
  });

  it('rejects unverified pack attempting production_approved status', async () => {
    const tempDir = resolve(process.cwd(), 'temp-pack-test-isolation');
    try {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
      mkdirSync(tempDir, { recursive: true });

      const fakeManifest = {
        id: 'fake-lang',
        name: 'Fake Language',
        iso639_3: 'fak',
        locale: 'fak-CM',
        version: '1.0.0',
        schemaVersion: '1.0.0',
        status: 'production_approved',
        capabilities: {
          hasDictionary: false,
          hasParallelCorpus: false,
          hasSpeech: false,
          hasPronunciation: false,
          hasGlossary: false,
        },
        supportedSourceLangs: ['fr'],
        supportedTargetLangs: ['fak-CM'],
        license: 'MIT',
        provenance: 'Mock pack',
        qualityStatus: 'unverified',
      };

      writeFileSync(resolve(tempDir, 'manifest.json'), JSON.stringify(fakeManifest, null, 2));

      const res = await runPackLint(tempDir, { exit: false });
      expect(res.valid).toBe(false);
      expect(res.exitCode).toBe(1);
      expect(res.errors.some((e) => e.includes('Isolation compliance'))).toBe(true);
    } finally {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  it('rejects invalid JSON syntax in manifest', async () => {
    const tempDir = resolve(process.cwd(), 'temp-pack-test-json-err');
    try {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
      mkdirSync(tempDir, { recursive: true });

      writeFileSync(resolve(tempDir, 'manifest.json'), '{\n  bad json,\n');

      const res = await runPackLint(tempDir, { exit: false });
      expect(res.valid).toBe(false);
      expect(res.exitCode).toBe(1);
      expect(res.errors.some((e) => e.includes('Invalid JSON in manifest.json'))).toBe(true);
    } finally {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });
});
