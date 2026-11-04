import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import * as net from 'node:net';
import * as path from 'node:path';
import * as fs from 'node:fs';

export const MONOREPO_ROOT = path.resolve(__dirname, '../../..');
export const PACKAGES_DIR = path.resolve(MONOREPO_ROOT, 'packages');
export const APPS_DIR = path.resolve(MONOREPO_ROOT, 'apps');
export const LANGUAGE_PACKS_DIR = path.resolve(MONOREPO_ROOT, 'language-packs');

/**
 * Returns a dynamically allocated available TCP port on localhost.
 */
export async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error('Failed to obtain port')));
      }
    });
  });
}

/**
 * Computes an HMAC SHA-256 signature over string or object payload.
 */
export function computeHmacSignature(payload: string | object, secret: string): string {
  const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hmac = createHmac('sha256', secret).update(content).digest('hex');
  return `sha256=${hmac}`;
}

/**
 * Verifies an HMAC SHA-256 signature using timing-safe equality.
 */
export function verifyHmacSignature(payload: string | object, signature: string, secret: string): boolean {
  try {
    const expected = computeHmacSignature(payload, secret);
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signature);
    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }
    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * Reference financial entity normalizer conforming strictly to PROJECT.md & financial-domain.
 */
export function normalizeAmount(raw: string): string {
  const trimmed = raw.trim();
  const kMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*k$/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(',', '.'));
    return String(Math.round(val * 1000));
  }

  let clean = trimmed.replace(/\s+/g, '');
  const hasComma = clean.includes(',');
  const hasDot = clean.includes('.');

  if (hasComma && hasDot) {
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');
    if (lastDot > lastComma) {
      clean = clean.replace(/,/g, '');
    } else {
      clean = clean.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasComma) {
    const parts = clean.split(',');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1) {
      clean = clean.replace(',', '');
    } else if (parts.length > 2) {
      clean = clean.replace(/,/g, '');
    } else {
      clean = clean.replace(',', '.');
    }
  } else if (hasDot) {
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1) {
      clean = clean.replace('.', '');
    } else if (parts.length > 2) {
      clean = clean.replace(/\./g, '');
    }
  }

  return clean;
}

export interface ExtractedEntity {
  type: 'amount' | 'phone' | 'transaction_id' | 'account_id' | 'percentage' | 'date';
  raw: string;
  normalized: string;
  position: { start: number; end: number };
}

/**
 * Reference Financial Entity Extractor conforming to specs in PROJECT.md.
 */
export function extractFinancialEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  const add = (type: ExtractedEntity['type'], raw: string, normalized: string, start: number, end: number) => {
    const key = `${type}:${normalized}`;
    if (!seen.has(key)) {
      seen.add(key);
      entities.push({ type, raw, normalized, position: { start, end } });
    }
  };

  // Amounts
  const amountPattern = /\b(\d[\d\s,\.]*(?:\s*\d{3})*|\d+(?:[.,]\d+)?\s*k)\s*(FCFA|XAF|CFA|EUR|USD|GBP|NGN|GHS|FRS|F)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = amountPattern.exec(text)) !== null) {
    const raw = match[0];
    let currency = match[2] ? match[2].toUpperCase() : '';
    if (currency === 'F' || currency === 'FRS' || currency === 'CFA' || currency === 'XAF') {
      currency = 'FCFA';
    }
    const val = normalizeAmount(match[1]);
    add('amount', raw, `${val}_${currency}`, match.index, match.index + raw.length);
  }

  // Standalone large numbers in financial context
  const largeNumPattern = /\b(\d{1,3}(?:[\s,\.]\d{3})+)(?:\s*(FCFA|XAF|CFA|EUR|USD|GBP|FRS|F))?\b/gi;
  while ((match = largeNumPattern.exec(text)) !== null) {
    const raw = match[0];
    let currency = match[2] ? match[2].toUpperCase() : 'FCFA';
    if (currency === 'F' || currency === 'FRS' || currency === 'CFA' || currency === 'XAF') {
      currency = 'FCFA';
    }
    const val = normalizeAmount(match[1]);
    add('amount', raw, `${val}_${currency}`, match.index, match.index + raw.length);
  }

  // JSON key-value amounts (e.g. "amount":24062 or "subtotal": 125000 or "total": 151468)
  const jsonAmountPattern = /"(?:amount|subtotal|total|fee|price|taxes?|charge)"\s*:\s*(\d+(?:\.\d+)?)/gi;
  while ((match = jsonAmountPattern.exec(text)) !== null) {
    const raw = match[0];
    const val = normalizeAmount(match[1]);
    add('amount', raw, `${val}_FCFA`, match.index, match.index + raw.length);
  }

  // Phone numbers (Cameroon MSISDN +237 / 00237 / 6-9xxxxxxxx)
  const phonePattern = /(?:^|[^\w+])((?:\+237|00237|237)?[\s-]?[6-9](?:[\s-]?\d){8})\b/g;
  while ((match = phonePattern.exec(text)) !== null) {
    const matchedStr = match[1].trim();
    const start = match.index + match[0].indexOf(matchedStr);
    let normalized = matchedStr.replace(/[\s-]/g, '').replace(/^(?:00237|\+237)/, '237');
    if (normalized.length === 9 && /^[6-9]/.test(normalized)) {
      normalized = '237' + normalized;
    }
    add('phone', matchedStr, normalized, start, start + matchedStr.length);
  }

  // Transaction IDs
  const txnPattern = /\b(?:TXN|REF|ID|ORDER|TX-)[A-Z0-9\-]{4,25}\b/gi;
  while ((match = txnPattern.exec(text)) !== null) {
    add('transaction_id', match[0], match[0].toUpperCase(), match.index, match.index + match[0].length);
  }

  return entities.sort((a, b) => a.position.start - b.position.start);
}

/**
 * Computes deterministic SHA-256 fingerprint over sorted, normalized entity tokens.
 */
export function computeSha256Fingerprint(entities: ExtractedEntity[]): string {
  if (entities.length === 0) {
    return '0000000000000000000000000000000000000000000000000000000000000000';
  }
  const canonical = entities
    .map((e) => `${e.type}:${e.normalized}`)
    .sort()
    .join('|');
  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Compares source and translated entities for zero-drift verification.
 */
export function verifyZeroDriftAST(sourceText: string, translatedText: string): {
  safe: boolean;
  violations: Array<{ issue: string; sourceValue: string; translatedValue?: string }>;
  sourceFingerprint: string;
  translatedFingerprint: string;
} {
  const sourceEntities = extractFinancialEntities(sourceText);
  const translatedEntities = extractFinancialEntities(translatedText);

  const sourceFingerprint = computeSha256Fingerprint(sourceEntities);
  const translatedFingerprint = computeSha256Fingerprint(translatedEntities);

  const violations: Array<{ issue: string; sourceValue: string; translatedValue?: string }> = [];

  for (const s of sourceEntities) {
    const matched = translatedEntities.find((t) => t.type === s.type && t.normalized === s.normalized);
    if (!matched) {
      const sameType = translatedEntities.filter((t) => t.type === s.type);
      if (sameType.length > 0) {
        violations.push({
          issue: `ENTITY_VALUE_CHANGED: ${s.type} value "${s.normalized}" not found in translation`,
          sourceValue: s.normalized,
          translatedValue: sameType.map((t) => t.normalized).join(', '),
        });
      } else {
        violations.push({
          issue: `ENTITY_MISSING: ${s.type} "${s.raw}" not found in translation`,
          sourceValue: s.normalized,
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

/**
 * Helper to execute node command synchronously.
 */
export function runCliCommand(args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): SpawnSyncReturns<string> {
  const cwd = options.cwd || MONOREPO_ROOT;
  return spawnSync('node', args, {
    cwd,
    encoding: 'utf-8',
    env: { ...process.env, ...options.env },
    timeout: 10000,
  });
}
