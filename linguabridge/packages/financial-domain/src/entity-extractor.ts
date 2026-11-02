import type { FinancialEntity, FinancialGuardResult } from '@linguabridge/shared-types';

const AMOUNT_PATTERNS = [
  // FCFA/XAF amounts: 50 000 FCFA, 50,000 XAF, 50.000 CFA
  /\b(\d[\d\s,\.]*(?:\s*\d{3})*)\s*(FCFA|XAF|CFA|EUR|USD|GBP|NGN|GHS)\b/gi,
  // Standalone large numbers in financial context
  /\b(\d{1,3}(?:[\s,]\d{3})+)(?:\s*(FCFA|XAF|CFA|EUR|USD|GBP))?\b/g,
];

const PERCENTAGE_PATTERN = /\b(\d+(?:[.,]\d+)?)\s*(?:%|pour\s*cent\b|percent\b)/gi;
const IBAN_PATTERN = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g;
const PHONE_PATTERN = /(?:^|[^\w+])((?:\+237|00237|237)?[\s-]?[6-9](?:[\s-]?\d){8})\b/g;
const DATE_PATTERN = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g;
const TRANSACTION_ID_PATTERN = /\b(?:TXN|REF|ID|ORDER)[A-Z0-9]{6,20}\b/gi;

function normalizeAmount(raw: string): string {
  // Remove all whitespace separators, normalize decimal
  return raw
    .replace(/\s/g, '')
    .replace(/,(\d{3})/g, '$1') // Remove thousands comma
    .replace(',', '.') // Normalize decimal comma to dot
    .trim();
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
        const normalized = normalizeAmount(match[1]) + (match[2] ? '_' + match[2].toUpperCase() : '');
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
  ): FinancialGuardResult {
    const violations: FinancialGuardResult['violations'] = [];

    for (const sourceEntity of sourceEntities) {
      // Find matching entity by type and normalized value in translation
      const match = translatedEntities.find(
        (te) => te.type === sourceEntity.type && te.normalized === sourceEntity.normalized
      );

      if (!match) {
        // Check if entity exists with different value (CRITICAL: amount changed)
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
      safe: violations.length === 0,
      violations,
    };
  }
}
