import { translateSentenceToEwondo, getEwondoPhonetic } from './ewondo-lexicon';

interface GuardedEntity {
  placeholder: string;
  raw: string;
  start: number;
  end: number;
}

function extractAndGuardEntities(text: string): { guardedText: string; entities: GuardedEntity[] } {
  const spans: { start: number; end: number; raw: string }[] = [];

  const PATTERNS: RegExp[] = [
    /\b(?:\d[\d\s,\.]*(?:\s*\d{3})*|\d+(?:[.,]\d+)?\s*k)\s*(?:FCFA|XAF|CFA|EUR|USD|GBP|NGN|GHS|FRS|F)\b/gi,
    /\b[A-Z]{2}\d{2}(?:[\s-]?[A-Z0-9]{4}){2,7}(?:[\s-]?[A-Z0-9]{1,4})?\b|\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/gi,
    /\b(?:TXN|REF|ID|ORDER|TX-)[A-Z0-9\-]{4,25}\b/gi,
    /#\d{3,10}\b/g,
    /(?:^|[^\w+])((?:\+237|00237|237)?[\s-]?[6-9](?:[\s-]?\d){8})\b/g,
    /\b\d+(?:[.,]\d+)?\s*(?:%|pour\s*cent\b|percent\b)/gi,
  ];

  for (const pat of PATTERNS) {
    const rx = new RegExp(pat.source, pat.flags);
    let m;
    while ((m = rx.exec(text)) !== null) {
      let raw = m[0];
      let start = m.index;
      if (m[1]) {
        raw = m[1].trim();
        start = m.index + m[0].indexOf(raw);
      }
      const end = start + raw.length;
      spans.push({ start, end, raw });
    }
  }

  spans.sort((a, b) => a.start - b.start);

  const nonOverlapping: { start: number; end: number; raw: string }[] = [];
  for (const span of spans) {
    if (nonOverlapping.length === 0) {
      nonOverlapping.push(span);
      continue;
    }
    const last = nonOverlapping[nonOverlapping.length - 1];
    if (span.start < last.end) {
      if (span.end - span.start > last.end - last.start) {
        nonOverlapping[nonOverlapping.length - 1] = span;
      }
    } else {
      nonOverlapping.push(span);
    }
  }

  const entities: GuardedEntity[] = [];
  let result = '';
  let cursor = 0;
  for (let i = 0; i < nonOverlapping.length; i++) {
    const s = nonOverlapping[i];
    result += text.slice(cursor, s.start);
    const placeholder = `___FIN_GUARD_${i}___`;
    result += placeholder;
    entities.push({ placeholder, raw: s.raw, start: s.start, end: s.end });
    cursor = s.end;
  }
  result += text.slice(cursor);

  return { guardedText: result, entities };
}

// Sovereign financial terms dictionary per language
const SOVEREIGN_DICTIONARIES: Record<string, Record<string, string>> = {
  // Fulfulde (fuv-CM / fuv)
  fuv: {
    'solde disponible (compte principal)': 'Shede woodiide (asusu mawɗo)',
    'solde disponible': 'Shede woodiide',
    'available balance': 'Shede woodiide',
    'solde actuel': 'Ceede jooni',
    'current balance': 'Ceede jooni',
    'solde insuffisant': 'Ceede ɗon ŋaɓɓi',
    'insufficient balance': 'Ceede ɗon ŋaɓɓi',
    'solde': 'Ceede',
    'balance': 'Ceede',
    'effectuer un transfert d\'argent': 'Neldugol ceede',
    'effectuer un transfert': 'Neldugol ceede',
    'frais de transfert': 'Ceede neldugol',
    'transfer fees': 'Ceede neldugol',
    'virement / transfert': 'Neldugol ceede',
    'virement': 'Neldugol ceede',
    'transfert': 'Neldugol ceede',
    'transfer': 'Neldugol ceede',
    'confirmer le transfert': 'Tabbintingol neldugol',
    'confirmer': 'Tabbintingol',
    'confirm': 'Tabbintingol',
    'annuler': 'Haaytungo',
    'cancel': 'Haaytungo',
    'frais': 'Ceede kuugal',
    'fees': 'Ceede kuugal',
    'dépôt': 'Wattingol ceede',
    'deposit': 'Wattingol ceede',
    'retrait': 'Ittugol ceede',
    'withdrawal': 'Ittugol ceede',
    'bénéficiaire': 'Jaɓoowo ceede',
    'beneficiary': 'Jaɓoowo ceede',
    'numéro de téléphone': 'Lamba talafon',
    'phone number': 'Lamba talafon',
    'montant du transfert': 'Ceede neldugo',
    'montant': 'Ceede',
    'amount': 'Ceede',
  },

  // Haoussa (hau-CM / hau)
  hau: {
    'solde disponible (compte principal)': 'Ragowar kuɗi (babban asusu)',
    'solde disponible': 'Ragowar kuɗi',
    'available balance': 'Ragowar kuɗi',
    'solde actuel': 'Kuɗin da ke ciki yanzu',
    'current balance': 'Kuɗin da ke ciki yanzu',
    'solde insuffisant': 'Kuɗin asusu ba su isa ba',
    'insufficient balance': 'Kuɗin asusu ba su isa ba',
    'solde': 'Kuɗin asusu',
    'balance': 'Kuɗin asusu',
    'effectuer un transfert d\'argent': 'Tura kuɗi',
    'effectuer un transfert': 'Tura kuɗi',
    'frais de transfert': 'Kuɗin aiki',
    'transfer fees': 'Kuɗin aiki',
    'virement / transfert': 'Tura kuɗi',
    'virement': 'Tura kuɗi',
    'transfert': 'Tura kuɗi',
    'transfer': 'Tura kuɗi',
    'confirmer le transfert': 'Tabbatar da turawa',
    'confirmer': 'Tabbatar',
    'confirm': 'Tabbatar',
    'annuler': 'Soke',
    'cancel': 'Soke',
    'frais': 'Kuɗin aiki',
    'fees': 'Kuɗin aiki',
    'dépôt': 'Ajiye kuɗi',
    'deposit': 'Ajiye kuɗi',
    'retrait': 'Cire kuɗi',
    'withdrawal': 'Cire kuɗi',
    'bénéficiaire': 'Mai karɓa',
    'beneficiary': 'Mai karɓa',
    'numéro de téléphone': 'Lambar waya',
    'phone number': 'Lambar waya',
    'montant du transfert': 'Yawan kuɗin turawa',
    'montant': 'Yawan kuɗi',
    'amount': 'Yawan kuɗi',
  },

  // Kanuri (knc-CM / knc)
  knc: {
    'solde disponible (compte principal)': 'Kəla kəlabe mbeji (asusu kura)',
    'solde disponible': 'Kəla kəlabe mbeji',
    'available balance': 'Kəla kəlabe mbeji',
    'solde actuel': 'Liman ngowo',
    'current balance': 'Liman ngowo',
    'solde insuffisant': 'Liman gana',
    'insufficient balance': 'Liman gana',
    'solde': 'Liman mbeji',
    'balance': 'Liman mbeji',
    'effectuer un transfert d\'argent': 'Liman tina',
    'effectuer un transfert': 'Liman tina',
    'frais de transfert': 'Hakki liman',
    'transfer fees': 'Hakki liman',
    'virement / transfert': 'Liman tina',
    'virement': 'Liman tina',
    'transfert': 'Liman tina',
    'transfer': 'Liman tina',
    'confirmer le transfert': 'Gənatə tina',
    'confirmer': 'Gənatə',
    'confirm': 'Gənatə',
    'annuler': 'Kəla cida',
    'cancel': 'Kəla cida',
    'frais': 'Hakki',
    'fees': 'Hakki',
    'dépôt': 'Fattə',
    'deposit': 'Fattə',
    'retrait': 'Kusu',
    'withdrawal': 'Kusu',
    'bénéficiaire': 'Kam cida cina',
    'beneficiary': 'Kam cida cina',
    'numéro de téléphone': 'Lamba talawon',
    'phone number': 'Lamba talawon',
    'montant du transfert': 'Liman tina',
    'montant': 'Liman',
    'amount': 'Liman',
  },

  // Cameroon Pidgin (pcm-CM / pcm)
  pcm: {
    'solde disponible (compte principal)': 'Money wey dey available (main account)',
    'solde disponible': 'Money wey dey available',
    'available balance': 'Money wey dey available',
    'solde actuel': 'Money for account now',
    'current balance': 'Money for account now',
    'solde insuffisant': 'Money no reach',
    'insufficient balance': 'Money no reach',
    'solde': 'Balance',
    'balance': 'Balance',
    'effectuer un transfert d\'argent': 'Send money',
    'effectuer un transfert': 'Send money',
    'frais de transfert': 'Transfer charges',
    'transfer fees': 'Transfer charges',
    'virement / transfert': 'Send money',
    'virement': 'Send money',
    'transfert': 'Send money',
    'transfer': 'Send money',
    'confirmer le transfert': 'Confirm transfer',
    'confirmer': 'Confirm',
    'confirm': 'Confirm',
    'annuler': 'Cancel',
    'cancel': 'Cancel',
    'frais': 'Charges',
    'fees': 'Charges',
    'dépôt': 'Deposit',
    'deposit': 'Deposit',
    'retrait': 'Withdraw',
    'withdrawal': 'Withdraw',
    'bénéficiaire': 'Person wey get money',
    'beneficiary': 'Person wey get money',
    'numéro de téléphone': 'Phone number',
    'phone number': 'Phone number',
    'montant du transfert': 'Transfer amount',
    'montant': 'Total money',
    'amount': 'Total money',
  },
};

function normalizeLangCode(lang: string): string {
  const norm = lang.trim().toLowerCase().replace(/_/, '-');
  if (norm.startsWith('ewo')) return 'ewo';
  if (norm.startsWith('fuv') || norm.startsWith('fub')) return 'fuv';
  if (norm.startsWith('hau')) return 'hau';
  if (norm.startsWith('knc')) return 'knc';
  if (norm.startsWith('pcm')) return 'pcm';
  if (norm.startsWith('dua')) return 'dua';
  return norm;
}

export function translateSentenceToSovereign(
  text: string,
  targetLang: string
): { translatedText: string; status: 'success' | 'unverified'; warnings: string[] } {
  const normLang = normalizeLangCode(targetLang);

  if (normLang === 'ewo') {
    const translatedText = translateSentenceToEwondo(text);
    return {
      translatedText,
      status: translatedText === text ? 'unverified' : 'success',
      warnings: translatedText === text ? ['EWONDO_NO_MATCH'] : [],
    };
  }

  if (normLang === 'dua') {
    return {
      translatedText: text,
      status: 'unverified',
      warnings: ['DUALA_QUARANTINED_UNVERIFIED'],
    };
  }

  const dict = SOVEREIGN_DICTIONARIES[normLang];
  if (!dict) {
    return {
      translatedText: text,
      status: 'unverified',
      warnings: [`UNSUPPORTED_LANGUAGE_${targetLang}`],
    };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { translatedText: text, status: 'unverified', warnings: [] };
  }

  // 1. Guard financial entities with placeholder tokens
  const { guardedText, entities } = extractAndGuardEntities(trimmed);

  // 2. Perform dictionary substitution sorted by descending phrase length
  let workingText = guardedText;
  const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length);

  let matched = false;
  for (const key of sortedKeys) {
    const targetTerm = dict[key];
    const regex = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(key)})([^\\p{L}\\p{N}]|$)`, 'giu');
    if (regex.test(workingText)) {
      matched = true;
      workingText = workingText.replace(regex, (match, prefix, captured, suffix) => {
        let replacement = targetTerm;
        if (captured === captured.toUpperCase() && captured.length > 1) {
          replacement = targetTerm.toUpperCase();
        } else if (captured[0] === captured[0].toUpperCase()) {
          replacement = targetTerm.charAt(0).toUpperCase() + targetTerm.slice(1);
        }
        return `${prefix}${replacement}${suffix}`;
      });
    }
  }

  // 3. Restore guarded entities with absolute fidelity
  let restored = workingText;
  for (const ent of entities) {
    restored = restored.split(ent.placeholder).join(ent.raw);
  }

  return {
    translatedText: restored,
    status: matched || entities.length > 0 ? 'success' : 'unverified',
    warnings: matched ? [] : ['NO_DIRECT_TERM_MATCH'],
  };
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
