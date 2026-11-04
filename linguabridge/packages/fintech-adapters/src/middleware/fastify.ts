import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { translateSentenceToEwondo } from '@linguabridge/translation-engine';
import type { MiddlewareOptions } from '../types';

const extractor = new FinancialEntityExtractor();

const DEFAULT_TARGET_FIELDS = ['description', 'message', 'title', 'note', 'reason', 'item_name', 'summary'];

/**
 * Fastify plugin for transparent zero-drift response localization.
 * Hooks into the onSend lifecycle to intercept JSON responses, localize
 * marked fields, verify financial entity integrity, and attach X-LinguaBridge-Verified.
 */
export async function linguaBridgeFastify(
  fastify: any,
  options?: MiddlewareOptions
): Promise<void> {
  const headerName = options?.headerName ?? 'X-LinguaBridge-Verified';
  const targetFields = new Set((options?.fields ?? DEFAULT_TARGET_FIELDS).map((f) => f.toLowerCase()));
  const strict = options?.strict ?? false;

  fastify.addHook('onSend', async (request: any, reply: any, payload: any) => {
    // Determine target language
    let targetLang = 'ewo-CM';
    if (typeof options?.targetLang === 'function') {
      targetLang = options.targetLang(request) || 'ewo-CM';
    } else if (typeof options?.targetLang === 'string') {
      targetLang = options.targetLang;
    } else if (request.headers?.['x-target-lang']) {
      targetLang = String(request.headers['x-target-lang']);
    } else if (request.query?.lang) {
      targetLang = String(request.query.lang);
    }

    if (!payload || typeof payload !== 'string') {
      return payload;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(payload);
    } catch {
      // Not JSON, return unmodified
      return payload;
    }

    if (!parsed || typeof parsed !== 'object') {
      return payload;
    }

    // 1. Collect baseline financial entities
    const stringsToScan: string[] = [];
    function collectStrings(node: any) {
      if (!node) return;
      if (typeof node === 'string') stringsToScan.push(node);
      else if (typeof node === 'number') stringsToScan.push(String(node));
      else if (Array.isArray(node)) node.forEach(collectStrings);
      else if (typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
          if (typeof v === 'number' && /amount|fee|total|price/i.test(k)) {
            stringsToScan.push(`${v} FCFA`);
          } else {
            collectStrings(v);
          }
        }
      }
    }
    collectStrings(parsed);
    const sourceEntities = stringsToScan.flatMap((s) => extractor.extract(s));

    // 2. Localize targeted fields
    function transform(node: any, currentKey?: string): any {
      if (node === null || node === undefined) return node;
      if (typeof node === 'string' && currentKey && targetFields.has(currentKey.toLowerCase())) {
        return targetLang.startsWith('ewo') ? translateSentenceToEwondo(node) : node;
      }
      if (Array.isArray(node)) {
        return node.map((item) => transform(item, currentKey));
      }
      if (typeof node === 'object') {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(node)) {
          out[k] = transform(v, k);
        }
        return out;
      }
      return node;
    }

    const sanitized = transform(parsed);

    // 3. Verify zero drift
    const sanitizedStrings: string[] = [];
    function collectSanitized(node: any) {
      if (!node) return;
      if (typeof node === 'string') sanitizedStrings.push(node);
      else if (typeof node === 'number') sanitizedStrings.push(String(node));
      else if (Array.isArray(node)) node.forEach(collectSanitized);
      else if (typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
          if (typeof v === 'number' && /amount|fee|total|price/i.test(k)) {
            sanitizedStrings.push(`${v} FCFA`);
          } else {
            collectSanitized(v);
          }
        }
      }
    }
    collectSanitized(sanitized);
    const translatedEntities = sanitizedStrings.flatMap((s) => extractor.extract(s));
    const guard = extractor.compare(sourceEntities, translatedEntities);

    if (guard.safe) {
      reply.header(headerName, 'true');
      return JSON.stringify(sanitized);
    }

    if (options?.onDriftViolation) {
      options.onDriftViolation(parsed, request);
    }

    if (strict) {
      reply.status(500);
      return JSON.stringify({ error: 'Zero-drift financial verification failed' });
    }

    // Fallback: return original payload unchanged without verification header
    return payload;
  });
}
