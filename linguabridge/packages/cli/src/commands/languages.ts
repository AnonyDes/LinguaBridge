import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolveLanguagePacksDir } from '../utils/pack-locator';
import { printJson } from '../utils/output';

export interface LanguagesOptions {
  all?: boolean;
  quarantined?: boolean;
  json?: boolean;
  exit?: boolean;
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  iso639_3: string;
  status: string;
  qualityStatus: string;
  isCertified: boolean;
  isAvailable: boolean;
  termCount?: number;
}

export interface LanguagesReport {
  total: number;
  activeCount: number;
  quarantinedCount: number;
  activeLanguages: LanguageInfo[];
  quarantinedLanguages: LanguageInfo[];
}

export const SOVEREIGN_CAMEROON_LANGUAGES: LanguageInfo[] = [
  {
    code: 'ewo-CM',
    name: 'Ewondo',
    nativeName: 'Èwóndó',
    iso639_3: 'ewo',
    status: 'production_approved',
    qualityStatus: 'certified',
    isCertified: true,
    isAvailable: true,
  },
  {
    code: 'fuv-CM',
    name: 'Fulfulde',
    nativeName: 'Fulfulde',
    iso639_3: 'fuv',
    status: 'production_approved',
    qualityStatus: 'certified',
    isCertified: true,
    isAvailable: true,
  },
  {
    code: 'hau-CM',
    name: 'Haoussa',
    nativeName: 'Harshen Hausa',
    iso639_3: 'hau',
    status: 'production_approved',
    qualityStatus: 'certified',
    isCertified: true,
    isAvailable: true,
  },
  {
    code: 'knc-CM',
    name: 'Kanuri',
    nativeName: 'Kànurí',
    iso639_3: 'knc',
    status: 'production_approved',
    qualityStatus: 'certified',
    isCertified: true,
    isAvailable: true,
  },
  {
    code: 'pcm-CM',
    name: 'Cameroon Pidgin',
    nativeName: 'Cameroon Pidgin English',
    iso639_3: 'pcm',
    status: 'production_approved',
    qualityStatus: 'certified',
    isCertified: true,
    isAvailable: true,
  },
];

export async function runLanguages(options: LanguagesOptions = {}): Promise<LanguagesReport> {
  const packsDir = resolveLanguagePacksDir();

  const active: LanguageInfo[] = [...SOVEREIGN_CAMEROON_LANGUAGES];
  const quarantined: LanguageInfo[] = [
    {
      code: 'dua-CM',
      name: 'Duala',
      nativeName: 'Dùálá',
      iso639_3: 'dua',
      status: 'not_installed',
      qualityStatus: 'unverified',
      isCertified: false,
      isAvailable: false,
    },
    {
      code: 'bas-CM',
      name: 'Basaa',
      nativeName: 'Ɓàsàa',
      iso639_3: 'bas',
      status: 'not_installed',
      qualityStatus: 'unverified',
      isCertified: false,
      isAvailable: false,
    },
    {
      code: 'bum-CM',
      name: 'Bulu',
      nativeName: 'Bulu',
      iso639_3: 'bum',
      status: 'not_installed',
      qualityStatus: 'unverified',
      isCertified: false,
      isAvailable: false,
    },
  ];

  // Enrich with pack directory term counts if available
  if (packsDir && existsSync(packsDir)) {
    try {
      const entries = readdirSync(packsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
          const glossaryFile = join(packsDir, entry.name, 'dictionaries', 'financial-glossary.json');
          if (existsSync(glossaryFile)) {
            try {
              const glossary = JSON.parse(readFileSync(glossaryFile, 'utf8'));
              const targetLang = active.find((l) => l.code === glossary.locale || entry.name.includes(l.iso639_3));
              if (targetLang && Array.isArray(glossary.terms)) {
                targetLang.termCount = glossary.terms.length;
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const showQuarantined = Boolean(options.all || options.quarantined);

  const report: LanguagesReport = {
    total: active.length + (showQuarantined ? quarantined.length : 0),
    activeCount: active.length,
    quarantinedCount: quarantined.length,
    activeLanguages: active,
    quarantinedLanguages: showQuarantined ? quarantined : [],
  };

  if (options.json) {
    printJson(report);
  } else {
    console.log('\n======================================================');
    console.log('       LinguaBridge Sovereign National Languages      ');
    console.log('======================================================');
    console.log(`Active Certified Languages:    ${active.length}`);
    console.log(`Quarantined Languages:         ${quarantined.length} (Masked from production)`);
    console.log('\n[Active Sovereign Cameroonian Languages]');
    for (const lang of active) {
      const terms = lang.termCount ? ` (${lang.termCount} certified terms)` : '';
      console.log(`  ✔ \x1b[32m[CERTIFIED]\x1b[0m ${lang.name} - ${lang.nativeName} (${lang.code})${terms}`);
    }

    if (showQuarantined) {
      console.log('\n[Quarantined & Unverified Languages]');
      for (const lang of quarantined) {
        console.log(`  ✖ \x1b[33m[QUARANTINED]\x1b[0m ${lang.name} (${lang.code}) - status: ${lang.status}`);
      }
    } else {
      console.log('\nNote: Duala is quarantined and masked. Use --all to view quarantined packs.');
    }
    console.log('======================================================\n');
  }

  process.exitCode = 0;
  if (options.exit !== false && !process.env.VITEST) {
    process.exit(0);
  }

  return report;
}
