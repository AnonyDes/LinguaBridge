import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function resolveLanguagePacksDir(customPath?: string): string | null {
  if (customPath && existsSync(customPath)) {
    return resolve(customPath);
  }

  if (process.env.LINGUABRIDGE_PACKS_DIR && existsSync(process.env.LINGUABRIDGE_PACKS_DIR)) {
    return resolve(process.env.LINGUABRIDGE_PACKS_DIR);
  }

  const cwdCandidates = [
    resolve(process.cwd(), 'language-packs'),
    resolve(process.cwd(), '..', 'language-packs'),
    resolve(process.cwd(), '..', '..', 'language-packs'),
    resolve(process.cwd(), '..', '..', '..', 'language-packs'),
  ];

  for (const cand of cwdCandidates) {
    if (existsSync(cand)) {
      return cand;
    }
  }

  try {
    const currentDir = typeof __dirname !== 'undefined'
      ? __dirname
      : dirname(fileURLToPath(import.meta.url));

    const fileCandidates = [
      resolve(currentDir, '..', '..', '..', 'language-packs'),
      resolve(currentDir, '..', '..', 'language-packs'),
      resolve(currentDir, '..', 'language-packs'),
      resolve(currentDir, 'language-packs'),
    ];

    for (const cand of fileCandidates) {
      if (existsSync(cand)) {
        return cand;
      }
    }
  } catch {
    // ignore
  }

  return null;
}
