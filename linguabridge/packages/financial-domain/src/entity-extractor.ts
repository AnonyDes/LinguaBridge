import type { FinancialEntity, FinancialGuardResult } from '@linguabridge/shared-types';

// Zero-dependency universal FIPS 180-4 SHA-256 for Node.js, Web, and Service Worker environments
function sha256(str: string): string {
  function rotr(n: number, x: number): number {
    return (x >>> n) | (x << (32 - n));
  }
  function ch(x: number, y: number, z: number): number {
    return (x & y) ^ (~x & z);
  }
  function maj(x: number, y: number, z: number): number {
    return (x & y) ^ (x & z) ^ (y & z);
  }
  function sigma0(x: number): number {
    return rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
  }
  function sigma1(x: number): number {
    return rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
  }
  function gamma0(x: number): number {
    return rotr(7, x) ^ rotr(18, x) ^ (x >>> 3);
  }
  function gamma1(x: number): number {
    return rotr(17, x) ^ rotr(19, x) ^ (x >>> 10);
  }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a;
  let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c < 0xd800 || c >= 0xe000) {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      i++;
      c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }

  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }

  const hi = Math.floor(bitLen / 0x100000000);
  const lo = bitLen >>> 0;
  bytes.push(
    (hi >>> 24) & 0xff, (hi >>> 16) & 0xff, (hi >>> 8) & 0xff, hi & 0xff,
    (lo >>> 24) & 0xff, (lo >>> 16) & 0xff, (lo >>> 8) & 0xff, lo & 0xff
  );

  const W = new Uint32Array(64);
  for (let i = 0; i < bytes.length; i += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = (bytes[i + t * 4] << 24) |
             (bytes[i + t * 4 + 1] << 16) |
             (bytes[i + t * 4 + 2] << 8) |
             (bytes[i + t * 4 + 3]);
    }
    for (let t = 16; t < 64; t++) {
      W[t] = (gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16]) >>> 0;
    }

    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;

    for (let t = 0; t < 64; t++) {
      const T1 = (h + sigma1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0;
      const T2 = (sigma0(a) + maj(a, b, c)) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + T1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) >>> 0;
    }

    H0 = (H0 + a) >>> 0;
    H1 = (H1 + b) >>> 0;
    H2 = (H2 + c) >>> 0;
    H3 = (H3 + d) >>> 0;
    H4 = (H4 + e) >>> 0;
    H5 = (H5 + f) >>> 0;
    H6 = (H6 + g) >>> 0;
    H7 = (H7 + h) >>> 0;
  }

  function toHex(n: number): string {
    return (n >>> 0).toString(16).padStart(8, '0');
  }

  return toHex(H0) + toHex(H1) + toHex(H2) + toHex(H3) + toHex(H4) + toHex(H5) + toHex(H6) + toHex(H7);
}

const AMOUNT_PATTERNS = [
  // FCFA/XAF amounts with currency: 50 000 FCFA, 50,000 XAF, 50.000 CFA, 15000frs, 15000f, 15k cfa
  /(?<![\w])([+−-]?(?:\d+(?:[.,]\d+)?[ \u00a0\u202f]*k|(?:\d{1,3}(?:[ \u00a0\u202f.,]\d{3})+|\d+)(?:[.,]\d+)?))\s*(FCFA|XAF|CFA|EUR|USD|GBP|NGN|GHS|FRS|F)\b/gi,
  // Standalone large numbers in financial context (thousands separated)
  /(?<![\w])([+−-]?\d{1,3}(?:[ \u00a0\u202f,.]\d{3})+)(?!\d)(?:\s*(FCFA|XAF|CFA|EUR|USD|GBP|NGN|GHS|FRS|F))?\b/gi,
];

const PERCENTAGE_PATTERN = /(?<![\w])([+−-]?\d+(?:[.,]\d+)?)\s*(?:%|pour\s*cent\b|percent\b)/gi;
const IBAN_PATTERN = /\b[A-Z]{2}\d{2}(?:[\s-]?[A-Z0-9]{4}){2,7}(?:[\s-]?[A-Z0-9]{1,4})?\b|\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/gi;
const PHONE_PATTERN = /(?:^|[^\w+])((?:\+237|00237|237)?[\s-]?[6-9](?:[\s-]?\d){8})\b/g;
const DATE_PATTERN = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g;
const TRANSACTION_ID_PATTERN = /\b(?:TXN|REF|ID|ORDER|TX-)[A-Z0-9\-]{4,25}\b/gi;

export function normalizeAmount(raw: string): string {
  const trimmed = raw.trim().replace(/^−/, '-').replace(/^\+/, '');

  // Handle 'k' multiplier (e.g. 15k -> 15000, 2.5k -> 2500)
  const kMatch = trimmed.match(/^(-?\d+(?:[.,]\d+)?)\s*k$/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(',', '.'));
    return String(Math.round(val * 1000));
  }

  // Remove whitespace
  let clean = trimmed.replace(/\s+/g, '');

  const hasComma = clean.includes(',');
  const hasDot = clean.includes('.');

  if (hasComma && hasDot) {
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');
    if (lastDot > lastComma) {
      // 15,500.50 -> US format (comma thousands, dot decimal)
      clean = clean.replace(/,/g, '');
    } else {
      // 15.500,50 -> FR format (dot thousands, comma decimal)
      clean = clean.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasComma) {
    const parts = clean.split(',');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1) {
      // 15,000 -> thousands comma
      clean = clean.replace(',', '');
    } else if (parts.length > 2) {
      // 1,000,000 -> thousands commas
      clean = clean.replace(/,/g, '');
    } else {
      // 15,50 -> decimal comma
      clean = clean.replace(',', '.');
    }
  } else if (hasDot) {
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1) {
      // 15.000 -> European thousands dot
      clean = clean.replace('.', '');
    } else if (parts.length > 2) {
      // 1.000.000 -> multiple thousands dots
      clean = clean.replace(/\./g, '');
    }
  }

  return clean;
}

export function computeEntityFingerprint(entities: FinancialEntity[]): string {
  if (entities.length === 0) return '0000000000000000000000000000000000000000000000000000000000000000';
  const canonical = entities
    .map((e) => `${e.type}:${e.normalized}`)
    .sort()
    .join('|');
  return sha256(canonical);
}

export class FinancialEntityExtractor {
  extract(text: string): FinancialEntity[] {
    const entities: FinancialEntity[] = [];
    const addEntity = (
      type: FinancialEntity['type'],
      raw: string,
      normalized: string,
      start: number,
      end: number
    ) => {
      entities.push({ type, raw, normalized, position: { start, end } });
    };

    // Extract monetary amounts
    for (const [index, pattern] of AMOUNT_PATTERNS.entries()) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const raw = match[0];
        const start = match.index;
        if (index > 0 && entities.some((entity) =>
          entity.position.start < start + raw.length && start < entity.position.end)) continue;
        let currency = match[2] ? match[2].toUpperCase() : '';
        // Canonicalize CEMAC currency names to FCFA
        if (currency === 'F' || currency === 'FRS' || currency === 'CFA' || currency === 'XAF') {
          currency = 'FCFA';
        }

        const normalizedVal = normalizeAmount(match[1]);
        const normalized = normalizedVal + (currency ? '_' + currency : '');
        addEntity('amount', raw, normalized, match.index, match.index + raw.length);
      }
    }

    // Extract percentages
    const percentRegex = new RegExp(PERCENTAGE_PATTERN.source, PERCENTAGE_PATTERN.flags);
    let match;
    while ((match = percentRegex.exec(text)) !== null) {
      const raw = match[0];
      const normalized = normalizeAmount(match[1]);
      addEntity('percentage', raw, normalized, match.index, match.index + raw.length);
    }

    // Extract IBANs / account IDs
    const ibanRegex = new RegExp(IBAN_PATTERN.source, IBAN_PATTERN.flags);
    while ((match = ibanRegex.exec(text)) !== null) {
      addEntity('account_id', match[0], match[0].replace(/[\s-]/g, '').toUpperCase(), match.index, match.index + match[0].length);
    }

    // Extract phone numbers
    const phoneRegex = new RegExp(PHONE_PATTERN.source, PHONE_PATTERN.flags);
    while ((match = phoneRegex.exec(text)) !== null) {
      const matchedStr = match[1].trim();
      const start = match.index + match[0].indexOf(matchedStr);
      const normalized = matchedStr.replace(/[\s-]/g, '').replace(/^(?:00237|\+237)/, '237');
      addEntity('phone', matchedStr, normalized, start, start + matchedStr.length);
    }

    // Extract transaction IDs
    const txnRegex = new RegExp(TRANSACTION_ID_PATTERN.source, TRANSACTION_ID_PATTERN.flags);
    while ((match = txnRegex.exec(text)) !== null) {
      addEntity('transaction_id', match[0], match[0].toUpperCase(), match.index, match.index + match[0].length);
    }

    // Extract dates
    const dateRegex = new RegExp(DATE_PATTERN.source, DATE_PATTERN.flags);
    while ((match = dateRegex.exec(text)) !== null) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3].length === 2 ? `20${match[3]}` : match[3];
      addEntity('date', match[0], `${year}-${month}-${day}`, match.index, match.index + match[0].length);
    }

    return entities.sort((a, b) => a.position.start - b.position.start);
  }

  compare(
    sourceEntities: FinancialEntity[],
    translatedEntities: FinancialEntity[]
  ): FinancialGuardResult & { sourceFingerprint: string; translatedFingerprint: string } {
    const violations: FinancialGuardResult['violations'] = [];
    const sourceFingerprint = computeEntityFingerprint(sourceEntities);
    const translatedFingerprint = computeEntityFingerprint(translatedEntities);

    const remaining = [...translatedEntities];
    for (const sourceEntity of sourceEntities) {
      const matchIndex = remaining.findIndex(
        (te) => te.type === sourceEntity.type && te.normalized === sourceEntity.normalized
      );

      if (matchIndex >= 0) {
        remaining.splice(matchIndex, 1);
      } else {
        const sameType = translatedEntities.filter((te) => te.type === sourceEntity.type);

        if (sameType.length > 0) {
          violations.push({
            entity: sourceEntity,
            issue: `ENTITY_VALUE_CHANGED: ${sourceEntity.type} value "${sourceEntity.normalized}" not found in translation`,
            sourceValue: sourceEntity.normalized,
            translatedValue: sameType.map((e) => e.normalized).join(', '),
          });
        } else {
          violations.push({
            entity: sourceEntity,
            issue: `ENTITY_MISSING: ${sourceEntity.type} "${sourceEntity.raw}" not found in translation`,
            sourceValue: sourceEntity.normalized,
          });
        }
      }
    }

    for (const entity of remaining) {
      violations.push({
        entity,
        issue: `ENTITY_INTRODUCED: ${entity.type}`,
        sourceValue: '',
        translatedValue: entity.normalized,
      });
    }

    return {
      safe: violations.length === 0 && sourceFingerprint === translatedFingerprint,
      violations,
      sourceFingerprint,
      translatedFingerprint,
    };
  }
}
