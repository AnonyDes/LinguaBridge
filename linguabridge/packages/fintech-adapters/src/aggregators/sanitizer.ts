import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { translateSentenceToEwondo } from '@linguabridge/translation-engine';
import { FinancialDriftException } from '../errors';
import type { AggregatorSanitizeOptions } from '../types';

const extractor = new FinancialEntityExtractor();

const DEFAULT_TRANSLATABLE_FIELDS = new Set([
  'description',
  'message',
  'title',
  'note',
  'reason',
  'item_name',
  'summary',
  'comment',
]);

const STRICTLY_PROTECTED_FIELDS = new Set([
  'amount',
  'fee',
  'fees',
  'charges',
  'total',
  'total_amount',
  'subtotal',
  'unit_price',
  'price',
  'currency',
  'phone',
  'customer_phone',
  'phone_number',
  'msisdn',
  'mobile',
  'reference',
  'ref',
  'transaction_id',
  'txn_id',
  'order_id',
  'paystack_reference',
  'cinetpay_transaction_id',
  'notchpay_reference',
  'id',
  'cpm_trans_id',
  'cpm_site_id',
  'signature',
  'token',
  'status',
  'email',
  'customer_email',
]);

/**
 * Extracts all financial entities from any arbitrary JSON value by traversing strings and numbers.
 */
function extractEntitiesFromValue(val: unknown): string[] {
  const strings: string[] = [];

  function walk(node: unknown) {
    if (node === null || node === undefined) return;
    if (typeof node === 'string') {
      strings.push(node);
    } else if (typeof node === 'number') {
      strings.push(String(node));
    } else if (Array.isArray(node)) {
      for (const item of node) walk(item);
    } else if (typeof node === 'object') {
      for (const [key, v] of Object.entries(node as Record<string, unknown>)) {
        if (typeof v === 'number' && /amount|fee|charge|total|price/i.test(key)) {
          strings.push(`${v} FCFA`);
        } else {
          walk(v);
        }
      }
    }
  }

  walk(val);
  return strings;
}

/**
 * Generic payload sanitizer for payment aggregators (CinetPay, Notch Pay, Paystack).
 * Recursively protects payment amounts, currencies, customer phones, and transaction references,
 * while safely translating descriptive text fields into certified sovereign languages (e.g. Ewondo).
 */
export function sanitizeAggregatorPayload<T extends Record<string, any>>(
  payload: T,
  targetLangOrOptions: string | AggregatorSanitizeOptions = 'ewo-CM',
  options?: AggregatorSanitizeOptions
): T {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const targetLang = typeof targetLangOrOptions === 'string'
    ? targetLangOrOptions
    : (targetLangOrOptions as any)?.targetLang || 'ewo-CM';
  const effectiveOpts = typeof targetLangOrOptions === 'object'
    ? targetLangOrOptions
    : options;

  const translatableSet = effectiveOpts?.translatableFields
    ? new Set(effectiveOpts.translatableFields.map((f) => f.toLowerCase()))
    : DEFAULT_TRANSLATABLE_FIELDS;

  const strict = effectiveOpts?.strictZeroDrift ?? true;
  const shouldThrow = effectiveOpts?.throwOnDrift ?? true;

  // 1. Snapshot all financial entities from the original payload
  const sourceStrings = extractEntitiesFromValue(payload);
  const sourceEntities = sourceStrings.flatMap((s) => extractor.extract(s));

  // 2. Deep clone and selectively localize translatable fields
  function sanitizeNode(node: any, currentKey?: string): any {
    if (node === null || node === undefined) return node;

    // Primitives
    if (typeof node !== 'object') {
      if (typeof node === 'string' && currentKey && translatableSet.has(currentKey.toLowerCase())) {
        if (targetLang.startsWith('ewo')) {
          return translateSentenceToEwondo(node);
        }
        return node;
      }
      return node;
    }

    // Arrays
    if (Array.isArray(node)) {
      return node.map((item) => sanitizeNode(item, currentKey));
    }

    // Objects
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(node)) {
      const lowerKey = key.toLowerCase();

      // Protected fields: keep strictly intact
      if (STRICTLY_PROTECTED_FIELDS.has(lowerKey)) {
        result[key] = val;
      } else if (translatableSet.has(lowerKey) && typeof val === 'string') {
        // Targeted text field for localization
        result[key] = targetLang.startsWith('ewo') ? translateSentenceToEwondo(val) : val;
      } else {
        result[key] = sanitizeNode(val, key);
      }
    }
    return result;
  }

  const sanitized = sanitizeNode(payload);

  // 3. Cryptographic Zero-Drift verification
  const sanitizedStrings = extractEntitiesFromValue(sanitized);
  const sanitizedEntities = sanitizedStrings.flatMap((s) => extractor.extract(s));

  const guard = extractor.compare(sourceEntities, sanitizedEntities);

  if (!guard.safe) {
    if (strict && shouldThrow) {
      const issues = guard.violations.map((v) => v.issue).join('; ');
      throw new FinancialDriftException(
        `Zero-drift corruption detected in aggregator payload: ${issues}`,
        guard.violations
      );
    }
    // Revert to original payload if drift occurs and not throwing
    return payload;
  }

  return sanitized as T;
}

/**
 * Creates a reusable aggregator payload sanitizer with preset options.
 */
export function createAggregatorSanitizer(defaultOptions?: AggregatorSanitizeOptions) {
  return function sanitize<T extends Record<string, any>>(
    payload: T,
    targetLang?: string,
    overrideOptions?: AggregatorSanitizeOptions
  ): T {
    const merged = { ...defaultOptions, ...overrideOptions };
    return sanitizeAggregatorPayload(payload, targetLang || merged.targetLang, merged);
  };
}
