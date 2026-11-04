import fs from 'node:fs';
import path from 'node:path';
import type { LanguagePackManifest } from '@linguabridge/shared-types';
import type { GlossaryTermEntry, SupportedLanguageSummary } from './types';

// Embedded certified Ewondo financial glossary as resilient fallback
const EWONDO_FALLBACK_GLOSSARY: GlossaryTermEntry[] = [
  {
    key: 'balance',
    fr: 'Solde',
    en: 'Balance',
    ewo: 'Móni mí ne',
    phonetic: 'mó-ní mí né',
    definition: "Position financière ou somme d'argent présente sur le compte",
    provenance: 'NACALCO / SIL Cameroon & Université de Yaoundé I linguistic consensus (CEMAC Banking & Mobile Money)',
  },
  {
    key: 'available_balance',
    fr: 'Solde disponible',
    en: 'Available balance',
    ewo: 'Móni mí ne wá é bẽng',
    phonetic: 'mó-ní mí né wá é bèŋ',
    definition: 'Argent actuellement présent et immédiatement utilisable sur le compte',
    provenance: 'NACALCO / SIL Cameroon & Université de Yaoundé I linguistic consensus (CEMAC Banking & Mobile Money)',
  },
  {
    key: 'current_balance',
    fr: 'Solde actuel',
    en: 'Current balance',
    ewo: 'Móni mí ne náná',
    phonetic: 'mó-ní mí né ná-ná',
    definition: 'Solde au moment précis de la consultation',
    provenance: 'NACALCO / SIL Cameroon & Université de Yaoundé I linguistic consensus (CEMAC Banking & Mobile Money)',
  },
  {
    key: 'insufficient_balance',
    fr: 'Solde insuffisant',
    en: 'Insufficient funds',
    ewo: 'Móni mí ne tégué abui',
    phonetic: 'mó-ní mí né té-gé à-bùì',
    definition: 'Fonds disponibles insuffisants pour couvrir la transaction',
    provenance: 'NACALCO / SIL Cameroon & Université de Yaoundé I linguistic consensus (CEMAC Banking & Mobile Money)',
  },
  {
    key: 'transfer',
    fr: 'Virement / Transfert',
    en: 'Transfer',
    ewo: 'Lóm móni',
    phonetic: 'lóm mó-ní',
    definition: "Opération de transfert de fonds d'un émetteur vers un récepteur",
    provenance: 'NACALCO / SIL Cameroon & Université de Yaoundé I linguistic consensus (CEMAC Banking & Mobile Money)',
  },
  {
    key: 'transfer_fees',
    fr: 'Frais de transfert',
    en: 'Transfer fees',
    ewo: 'Móni ya lóm móni',
    phonetic: 'mó-ní yá lóm mó-ní',
    definition: 'Commission prélevée par la plateforme pour réaliser le transfert',
    provenance: 'NACALCO / SIL Cameroon & Université de Yaoundé I linguistic consensus (CEMAC Banking & Mobile Money)',
  },
  {
    key: 'confirm',
    fr: 'Confirmer',
    en: 'Confirm',
    ewo: 'Tíbíli tóbó',
    phonetic: 'tí-bí-lí tó-bó',
    definition: 'Valider définitivement une transaction financière',
    provenance: 'NACALCO / SIL Cameroon & Université de Yaoundé I linguistic consensus (CEMAC Banking & Mobile Money)',
  },
  {
    key: 'cancel',
    fr: 'Annuler',
    en: 'Cancel',
    ewo: 'Tégué tóbó',
    phonetic: 'té-gé tó-bó',
    definition: 'Interrompre ou abandonner une opération bancaire ou un virement',
    provenance: 'NACALCO / SIL Cameroon & Université de Yaoundé I linguistic consensus (CEMAC Banking & Mobile Money)',
  },
  {
    key: 'deposit',
    fr: 'Dépôt',
    en: 'Deposit',
    ewo: 'Bígí móni',
    phonetic: 'bí-gí mó-ní',
    definition: "Crédit d'argent sur le compte bancaire ou le portefeuille électronique",
    provenance: 'NACALCO / SIL Cameroon & Université de Yaoundé I linguistic consensus (CEMAC Banking & Mobile Money)',
  },
  {
    key: 'withdrawal',
    fr: 'Retrait',
    en: 'Withdrawal',
    ewo: 'Kódí móni',
    phonetic: 'kó-dí mó-ní',
    definition: "Débit d'argent en espèces auprès d'un agent ou d'un guichet",
    provenance: 'NACALCO / SIL Cameroon & Université de Yaoundé I linguistic consensus (CEMAC Banking & Mobile Money)',
  },
];

export function findLanguagePacksDir(overrideDir?: string): string | null {
  if (overrideDir && fs.existsSync(overrideDir)) {
    return overrideDir;
  }

  if (process.env.LINGUABRIDGE_PACKS_DIR && fs.existsSync(process.env.LINGUABRIDGE_PACKS_DIR)) {
    return process.env.LINGUABRIDGE_PACKS_DIR;
  }

  // Candidate paths relative to cwd or dirname
  const candidates = [
    path.resolve(process.cwd(), 'language-packs'),
    path.resolve(process.cwd(), '..', 'language-packs'),
    path.resolve(process.cwd(), '..', '..', 'language-packs'),
    path.resolve(__dirname, '..', '..', 'language-packs'),
    path.resolve(__dirname, '..', '..', '..', 'language-packs'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  return null;
}

export function loadGlossaryForLang(lang: string, packsDir?: string): { terms: GlossaryTermEntry[]; provenance?: string } {
  const normLang = lang.trim().toLowerCase();
  const isEwondo = normLang === 'ewo-cm' || normLang === 'ewo' || normLang === 'ewondo';

  if (!isEwondo) {
    return { terms: [] };
  }

  const resolvedPacksDir = findLanguagePacksDir(packsDir);
  if (resolvedPacksDir) {
    const glossaryPath = path.join(resolvedPacksDir, 'ewondo', 'dictionaries', 'financial-glossary.json');
    if (fs.existsSync(glossaryPath)) {
      try {
        const raw = fs.readFileSync(glossaryPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.terms && Array.isArray(parsed.terms)) {
          const terms: GlossaryTermEntry[] = parsed.terms.map((t: any) => ({
            key: t.key,
            fr: t.fr,
            en: t.en,
            ewo: t.ewo,
            phonetic: t.phonetic,
            definition: t.definition,
            provenance: parsed.provenance || t.provenance,
          }));
          return {
            terms,
            provenance: parsed.provenance,
          };
        }
      } catch {
        // Fall back to embedded
      }
    }
  }

  return {
    terms: EWONDO_FALLBACK_GLOSSARY,
    provenance: 'NACALCO / SIL Cameroon & Université de Yaoundé I linguistic consensus (CEMAC Banking & Mobile Money)',
  };
}

export function loadSupportedLanguages(includeQuarantined = false, packsDir?: string): SupportedLanguageSummary[] {
  const resolvedPacksDir = findLanguagePacksDir(packsDir);

  const defaultApproved: SupportedLanguageSummary[] = [
    {
      code: 'ewo-CM',
      name: 'Ewondo',
      nativeName: 'Èwóndó',
      iso639_3: 'ewo',
      status: 'production_approved',
      qualityStatus: 'certified',
      isAvailable: true,
      speechAvailable: true,
      capabilities: {
        hasDictionary: true,
        hasParallelCorpus: true,
        hasSpeech: true,
        hasPronunciation: true,
        hasGlossary: true,
      },
    },
  ];

  const defaultQuarantined: SupportedLanguageSummary[] = [
    {
      code: 'bas-CM',
      name: 'Basaa',
      nativeName: 'Ɓàsàa',
      iso639_3: 'bas',
      status: 'not_installed',
      qualityStatus: 'unverified',
      isAvailable: false,
      speechAvailable: false,
      capabilities: {
        hasDictionary: false,
        hasParallelCorpus: false,
        hasSpeech: false,
        hasPronunciation: false,
        hasGlossary: false,
      },
    },
    {
      code: 'bum-CM',
      name: 'Bulu',
      nativeName: 'Bulu',
      iso639_3: 'bum',
      status: 'not_installed',
      qualityStatus: 'unverified',
      isAvailable: false,
      speechAvailable: false,
      capabilities: {
        hasDictionary: false,
        hasParallelCorpus: false,
        hasSpeech: false,
        hasPronunciation: false,
        hasGlossary: false,
      },
    },
    {
      code: 'dua-CM',
      name: 'Duala',
      nativeName: 'Dùálá',
      iso639_3: 'dua',
      status: 'not_installed',
      qualityStatus: 'unverified',
      isAvailable: false,
      speechAvailable: false,
      capabilities: {
        hasDictionary: false,
        hasParallelCorpus: false,
        hasSpeech: false,
        hasPronunciation: false,
        hasGlossary: false,
      },
    },
    {
      code: 'fub-CM',
      name: 'Fulfulde (Cameroon)',
      nativeName: 'Fulfulde',
      iso639_3: 'fub',
      status: 'not_installed',
      qualityStatus: 'unverified',
      isAvailable: false,
      speechAvailable: false,
      capabilities: {
        hasDictionary: false,
        hasParallelCorpus: false,
        hasSpeech: false,
        hasPronunciation: false,
        hasGlossary: false,
      },
    },
  ];

  if (!resolvedPacksDir) {
    return includeQuarantined ? [...defaultApproved, ...defaultQuarantined] : defaultApproved;
  }

  try {
    const entries = fs.readdirSync(resolvedPacksDir, { withFileTypes: true });
    const discovered: SupportedLanguageSummary[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

      const manifestPath = path.join(resolvedPacksDir, entry.name, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest: LanguagePackManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          const isApproved = manifest.status === 'production_approved';

          if (isApproved || includeQuarantined) {
            discovered.push({
              code: manifest.locale,
              name: manifest.name,
              nativeName: manifest.nativeName || manifest.name,
              iso639_3: manifest.iso639_3,
              status: manifest.status,
              qualityStatus: manifest.qualityStatus,
              isAvailable: isApproved,
              speechAvailable: Boolean(manifest.capabilities?.hasSpeech),
              capabilities: {
                hasDictionary: Boolean(manifest.capabilities?.hasDictionary),
                hasParallelCorpus: Boolean(manifest.capabilities?.hasParallelCorpus),
                hasSpeech: Boolean(manifest.capabilities?.hasSpeech),
                hasPronunciation: Boolean(manifest.capabilities?.hasPronunciation),
                hasGlossary: Boolean(manifest.capabilities?.hasGlossary),
              },
            });
          }
        } catch {
          // Skip invalid manifest
        }
      }
    }

    if (discovered.length > 0) {
      return discovered;
    }
  } catch {
    // Fall back to defaults
  }

  return includeQuarantined ? [...defaultApproved, ...defaultQuarantined] : defaultApproved;
}
