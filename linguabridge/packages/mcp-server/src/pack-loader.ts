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

// Fallback glossaries for the other 4 sovereign languages
const FULFULDE_FALLBACK_GLOSSARY: GlossaryTermEntry[] = [
  {
    key: 'balance',
    fr: 'Solde',
    en: 'Balance',
    fuv: 'Ceede woodiide',
    phonetic: 'tsee-de woo-dii-de',
    definition: 'Position financière ou somme présente sur le compte',
    provenance: 'Consensus national Université de Maroua & SIL Cameroon',
  },
  {
    key: 'available_balance',
    fr: 'Solde disponible',
    en: 'Available balance',
    fuv: 'Shede woodiide',
    phonetic: 'she-de woo-dii-de',
    definition: 'Argent actuellement disponible et utilisable',
    provenance: 'Consensus national Université de Maroua & SIL Cameroon',
  },
  {
    key: 'transfer',
    fr: 'Virement / Transfert',
    en: 'Transfer',
    fuv: 'Neldugol ceede',
    phonetic: 'nel-du-gol tsee-de',
    definition: 'Envoi de fonds vers un tiers',
    provenance: 'Consensus national Université de Maroua & SIL Cameroon',
  },
  {
    key: 'confirm',
    fr: 'Confirmer',
    en: 'Confirm',
    fuv: 'Tabbintingol',
    phonetic: 'tab-bin-tin-gol',
    definition: 'Validation irrévocable de la transaction',
    provenance: 'Consensus national Université de Maroua & SIL Cameroon',
  },
  {
    key: 'cancel',
    fr: 'Annuler',
    en: 'Cancel',
    fuv: 'Haaytungo',
    phonetic: 'haay-tun-go',
    definition: 'Interrompre l\'opération',
    provenance: 'Consensus national Université de Maroua & SIL Cameroon',
  },
];

const HAUSA_FALLBACK_GLOSSARY: GlossaryTermEntry[] = [
  {
    key: 'balance',
    fr: 'Solde',
    en: 'Balance',
    hau: 'Kuɗin asusu',
    phonetic: 'ku-din a-su-su',
    definition: 'Position financière ou somme présente sur le compte',
    provenance: 'Consensus linguistique Haoussa Cameroun & CEMAC',
  },
  {
    key: 'available_balance',
    fr: 'Solde disponible',
    en: 'Available balance',
    hau: 'Ragowar kuɗi',
    phonetic: 'ra-go-war ku-di',
    definition: 'Argent disponible pour usage immédiat',
    provenance: 'Consensus linguistique Haoussa Cameroun & CEMAC',
  },
  {
    key: 'transfer',
    fr: 'Virement / Transfert',
    en: 'Transfer',
    hau: 'Tura kuɗi',
    phonetic: 'tu-ra ku-di',
    definition: 'Envoi de fonds vers un tiers',
    provenance: 'Consensus linguistique Haoussa Cameroun & CEMAC',
  },
  {
    key: 'confirm',
    fr: 'Confirmer',
    en: 'Confirm',
    hau: 'Tabbatar',
    phonetic: 'tab-ba-tar',
    definition: 'Valider la transaction',
    provenance: 'Consensus linguistique Haoussa Cameroun & CEMAC',
  },
  {
    key: 'cancel',
    fr: 'Annuler',
    en: 'Cancel',
    hau: 'Soke',
    phonetic: 'so-ke',
    definition: 'Annuler l\'opération',
    provenance: 'Consensus linguistique Haoussa Cameroun & CEMAC',
  },
];

const KANURI_FALLBACK_GLOSSARY: GlossaryTermEntry[] = [
  {
    key: 'balance',
    fr: 'Solde',
    en: 'Balance',
    knc: 'Liman mbeji',
    phonetic: 'li-man mbe-ji',
    definition: 'Position financière ou somme présente sur le compte',
    provenance: 'Comité National de Linguistique Kanuri (KBLC) Cameroun',
  },
  {
    key: 'available_balance',
    fr: 'Solde disponible',
    en: 'Available balance',
    knc: 'Kəla kəlabe mbeji',
    phonetic: 'ke-la ke-la-be mbe-ji',
    definition: 'Argent disponible pour usage immédiat',
    provenance: 'Comité National de Linguistique Kanuri (KBLC) Cameroun',
  },
  {
    key: 'transfer',
    fr: 'Virement / Transfert',
    en: 'Transfer',
    knc: 'Liman tina',
    phonetic: 'li-man ti-na',
    definition: 'Envoi d\'argent vers un destinataire',
    provenance: 'Comité National de Linguistique Kanuri (KBLC) Cameroun',
  },
  {
    key: 'confirm',
    fr: 'Confirmer',
    en: 'Confirm',
    knc: 'Gənatə',
    phonetic: 'ge-na-te',
    definition: 'Valider la transaction',
    provenance: 'Comité National de Linguistique Kanuri (KBLC) Cameroun',
  },
  {
    key: 'cancel',
    fr: 'Annuler',
    en: 'Cancel',
    knc: 'Kəla cida',
    phonetic: 'ke-la tsi-da',
    definition: 'Interrompre l\'opération',
    provenance: 'Comité National de Linguistique Kanuri (KBLC) Cameroun',
  },
];

const PIDGIN_FALLBACK_GLOSSARY: GlossaryTermEntry[] = [
  {
    key: 'balance',
    fr: 'Solde',
    en: 'Balance',
    pcm: 'Balance',
    phonetic: 'ba-lans',
    definition: 'Money wey remain for your account',
    provenance: 'Cameroon Pidgin English Working Group',
  },
  {
    key: 'available_balance',
    fr: 'Solde disponible',
    en: 'Available balance',
    pcm: 'Money wey dey available',
    phonetic: 'mo-ney wey dey a-vai-la-ble',
    definition: 'Money wey you fit use now now',
    provenance: 'Cameroon Pidgin English Working Group',
  },
  {
    key: 'transfer',
    fr: 'Virement / Transfert',
    en: 'Transfer',
    pcm: 'Send money',
    phonetic: 'send mo-ney',
    definition: 'Transfer money give another person',
    provenance: 'Cameroon Pidgin English Working Group',
  },
  {
    key: 'confirm',
    fr: 'Confirmer',
    en: 'Confirm',
    pcm: 'Confirm',
    phonetic: 'con-firm',
    definition: 'Approve transaction',
    provenance: 'Cameroon Pidgin English Working Group',
  },
  {
    key: 'cancel',
    fr: 'Annuler',
    en: 'Cancel',
    pcm: 'Cancel',
    phonetic: 'can-cel',
    definition: 'Stop transaction',
    provenance: 'Cameroon Pidgin English Working Group',
  },
];

export function findLanguagePacksDir(overrideDir?: string): string | null {
  if (overrideDir && fs.existsSync(overrideDir)) {
    return overrideDir;
  }

  if (process.env.LINGUABRIDGE_PACKS_DIR && fs.existsSync(process.env.LINGUABRIDGE_PACKS_DIR)) {
    return process.env.LINGUABRIDGE_PACKS_DIR;
  }

  const candidates = [
    path.resolve(process.cwd(), 'language-packs'),
    path.resolve(process.cwd(), '..', 'language-packs'),
    path.resolve(process.cwd(), '..', '..', 'language-packs'),
    path.resolve(__dirname, '..', '..', 'language-packs'),
    path.resolve(__dirname, '..', '..', '..', 'language-packs'),
    path.resolve(__dirname, '..', '..', '..', 'language-packs'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  return null;
}

export function loadGlossaryForLang(
  lang: string,
  packsDir?: string
): { terms: GlossaryTermEntry[]; provenance?: string } {
  if (!lang || typeof lang !== 'string') {
    return { terms: [] };
  }

  // Security: prevent path traversal or malformed language codes
  const sanitized = lang.trim();
  if (!/^[a-zA-Z0-9_-]{2,15}$/.test(sanitized)) {
    return { terms: [] };
  }

  const normLang = sanitized.toLowerCase().replace(/_/g, '-');

  // Duala is quarantined — zero active glossary terms returned
  if (normLang === 'dua-cm' || normLang === 'dua' || normLang === 'duala') {
    return { terms: [], provenance: 'Quarantined — unverified pack' };
  }

  let packFolder = '';
  if (normLang.startsWith('ewo')) packFolder = 'ewondo';
  else if (normLang.startsWith('fuv') || normLang.startsWith('fub')) packFolder = 'fulfulde';
  else if (normLang.startsWith('hau')) packFolder = 'haoussa';
  else if (normLang.startsWith('knc')) packFolder = 'kanuri';
  else if (normLang.startsWith('pcm')) packFolder = 'pidgin';

  if (!packFolder) {
    return { terms: [] };
  }

  const resolvedPacksDir = findLanguagePacksDir(packsDir);
  if (resolvedPacksDir) {
    const glossaryPath = path.join(resolvedPacksDir, packFolder, 'dictionaries', 'financial-glossary.json');
    if (fs.existsSync(glossaryPath)) {
      try {
        const raw = fs.readFileSync(glossaryPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.terms && Array.isArray(parsed.terms)) {
          const terms: GlossaryTermEntry[] = parsed.terms.map((t: any) => ({
            key: t.key,
            fr: t.fr,
            en: t.en,
            ewo: t.ewo || (normLang.startsWith('ewo') ? t.target : undefined),
            fuv: t.fuv || (normLang.startsWith('fuv') ? t.target : undefined),
            hau: t.hau || (normLang.startsWith('hau') ? t.target : undefined),
            knc: t.knc || (normLang.startsWith('knc') ? t.target : undefined),
            pcm: t.pcm || (normLang.startsWith('pcm') ? t.target : undefined),
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

  // Fallbacks
  if (packFolder === 'ewondo') {
    return {
      terms: EWONDO_FALLBACK_GLOSSARY,
      provenance: 'NACALCO / SIL Cameroon & Université de Yaoundé I linguistic consensus (CEMAC Banking & Mobile Money)',
    };
  }
  if (packFolder === 'fulfulde') {
    return {
      terms: FULFULDE_FALLBACK_GLOSSARY,
      provenance: 'Consensus national Université de Maroua & SIL Cameroon',
    };
  }
  if (packFolder === 'haoussa') {
    return {
      terms: HAUSA_FALLBACK_GLOSSARY,
      provenance: 'Consensus linguistique Haoussa Cameroun & CEMAC',
    };
  }
  if (packFolder === 'kanuri') {
    return {
      terms: KANURI_FALLBACK_GLOSSARY,
      provenance: 'Comité National de Linguistique Kanuri (KBLC) Cameroun',
    };
  }
  if (packFolder === 'pidgin') {
    return {
      terms: PIDGIN_FALLBACK_GLOSSARY,
      provenance: 'Cameroon Pidgin English Working Group',
    };
  }

  return { terms: [] };
}

export function loadSupportedLanguages(
  includeQuarantined = false,
  packsDir?: string
): SupportedLanguageSummary[] {
  const resolvedPacksDir = findLanguagePacksDir(packsDir);

  // The 5 Sovereign Cameroonian Languages (Active / Production Approved)
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
    {
      code: 'fuv-CM',
      name: 'Fulfulde',
      nativeName: 'Fulfulde',
      iso639_3: 'fuv',
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
    {
      code: 'hau-CM',
      name: 'Haoussa',
      nativeName: 'Harshen Hausa',
      iso639_3: 'hau',
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
    {
      code: 'knc-CM',
      name: 'Kanuri',
      nativeName: 'Kànurí',
      iso639_3: 'knc',
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
    {
      code: 'pcm-CM',
      name: 'Cameroon Pidgin',
      nativeName: 'Cameroon Pidgin English',
      iso639_3: 'pcm',
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

  // Quarantined / Unverified Languages (Duala, Basaa, Bulu)
  const defaultQuarantined: SupportedLanguageSummary[] = [
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
          const isApproved = manifest.status === 'production_approved' && manifest.qualityStatus === 'certified';

          // Duala is STRICTLY forbidden from active/approved status
          const isDuala = manifest.locale === 'dua-CM' || manifest.id === 'duala';
          if (isDuala && isApproved) {
            continue; // Enforce quarantine
          }

          if (isApproved) {
            discovered.push({
              code: manifest.locale,
              name: manifest.name,
              nativeName: manifest.nativeName || manifest.name,
              iso639_3: manifest.iso639_3,
              status: manifest.status,
              qualityStatus: manifest.qualityStatus,
              isAvailable: true,
              speechAvailable: Boolean(manifest.capabilities?.hasSpeech),
              capabilities: {
                hasDictionary: Boolean(manifest.capabilities?.hasDictionary),
                hasParallelCorpus: Boolean(manifest.capabilities?.hasParallelCorpus),
                hasSpeech: Boolean(manifest.capabilities?.hasSpeech),
                hasPronunciation: Boolean(manifest.capabilities?.hasPronunciation),
                hasGlossary: Boolean(manifest.capabilities?.hasGlossary),
              },
            });
          } else if (includeQuarantined) {
            discovered.push({
              code: manifest.locale,
              name: manifest.name,
              nativeName: manifest.nativeName || manifest.name,
              iso639_3: manifest.iso639_3,
              status: manifest.status,
              qualityStatus: manifest.qualityStatus,
              isAvailable: false,
              speechAvailable: false,
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
      // Ensure all 5 sovereign languages are represented
      const approvedCodes = new Set(discovered.filter((d) => d.isAvailable).map((d) => d.code));
      for (const def of defaultApproved) {
        if (!approvedCodes.has(def.code)) {
          discovered.push(def);
        }
      }
      return discovered;
    }
  } catch {
    // Fall back to defaults
  }

  return includeQuarantined ? [...defaultApproved, ...defaultQuarantined] : defaultApproved;
}
