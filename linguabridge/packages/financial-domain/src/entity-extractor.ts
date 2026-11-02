import { createHash } from 'node:crypto';
import type { FinancialEntity, FinancialGuardResult } from '@linguabridge/shared-types';

const AMOUNT_PATTERNS = [
  // FCFA/XAF amounts with currency: 50 000 FCFA, 50,000 XAF, 50.000 CFA, 15000frs, 15000f, 15k cfa
  /\b(\d[\d\s,\.]*(?:\s*\d{3})*|\d+(?:[.,]\d+)?\s*k)\s*(FCFA|XAF|CFA|EUR|USD|GBP|NGN|GHS|FRS|F)\b/gi,
  // Standalone large numbers in financial context (thousands separated)
  /\b(\d{1,3}(?:[\s,\.]\d{3})+)(?:\s*(FCFA|XAF|CFA|EUR|USD|GBP|FRS|F))?\b/gi,
];

const PERCENTAGE_PATTERN = /\b(\d+(?:[.,]\d+)?)\s*(?:%|pour\s*cent\b|percent\b)/gi;
const IBAN_PATTERN = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g;
const PHONE_PATTERN = /(?:^|[^\w+])((?:\+237|00237|237)?[\s-]?[6-9](?:[\s-]?\d){8})\b/g;
const DATE_PATTERN = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g;
const TRANSACTION_ID_PATTERN = /\b(?:TXN|REF|ID|ORDER|TX-)[A-Z0-9]{4,20}\b/gi;

export function normalizeAmount(raw: string): string {
  const trimmed = raw.trim();

  // Handle 'k' multiplier (e.g. 15k -> 15000, 2.5k -> 2500)
  const kMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*k$/i);
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
  return createHash('sha256').update(canonical).digest('hex');
}

export class FinancialEntityExtractor {
  extract(text: string): FinancialEntity[] {
    const entities: FinancialEntity[] = [];
    const seen = new Set<string>();

    const addEntity = (
      type: FinancialEntity['type'],
      raw: string,
      normalized: string,
      start: number,
      end: number
    ) => {
      const key = `${type}:${normalized}`;
      if (!seen.has(key)) {
        seen.add(key);
        entities.push({ type, raw, normalized, position: { start, end } });
      }
    };

    // Extract monetary amounts
    for (const pattern of AMOUNT_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const raw = match[0];
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
      const normalized = match[1].replace(',', '.');
      addEntity('percentage', raw, normalized, match.index, match.index + raw.length);
    }

    // Extract IBANs / account IDs
    const ibanRegex = new RegExp(IBAN_PATTERN.source, IBAN_PATTERN.flags);
    while ((match = ibanRegex.exec(text)) !== null) {
      addEntity('account_id', match[0], match[0].toUpperCase(), match.index, match.index + match[0].length);
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

    for (const sourceEntity of sourceEntities) {
      const match = translatedEntities.find(
        (te) => te.type === sourceEntity.type && te.normalized === sourceEntity.normalized
      );

      if (!match) {
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

    return {
      safe: violations.length === 0 && sourceFingerprint === translatedFingerprint,
      violations,
      sourceFingerprint,
      translatedFingerprint,
    };
  }
}
