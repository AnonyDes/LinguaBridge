import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { translateSentenceToEwondo } from '@linguabridge/translation-engine';
import type { MiddlewareOptions } from '../types';

const extractor = new FinancialEntityExtractor();

const DEFAULT_TARGET_FIELDS = ['description', 'message', 'title', 'note', 'reason', 'item_name', 'summary'];

/**
 * Express middleware for transparent zero-drift response localization.
 * Intercepts res.json, localizes targeted fields, verifies numeric preservation,
 * and attaches X-LinguaBridge-Verified: true.
 */
export function linguaBridgeExpress(options?: MiddlewareOptions) {
  const headerName = options?.headerName ?? 'X-LinguaBridge-Verified';
  const targetFields = new Set((options?.fields ?? DEFAULT_TARGET_FIELDS).map((f) => f.toLowerCase()));
  const strict = options?.strict ?? false;

  return function middleware(req: any, res: any, next: (err?: any) => void) {
    // Determine target language
    let targetLang = 'ewo-CM';
    if (typeof options?.targetLang === 'function') {
      targetLang = options.targetLang(req) || 'ewo-CM';
    } else if (typeof options?.targetLang === 'string') {
      targetLang = options.targetLang;
    } else if (req.headers?.['x-target-lang']) {
      targetLang = String(req.headers['x-target-lang']);
    } else if (req.query?.lang) {
      targetLang = String(req.query.lang);
    }

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    function localizeObject(obj: any): { sanitized: any; safe: boolean } {
      if (!obj || typeof obj !== 'object') {
        return { sanitized: obj, safe: true };
      }

      // Collect baseline entities
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
      collectStrings(obj);
      const sourceEntities = stringsToScan.flatMap((s) => extractor.extract(s));

      // Translate targeted fields
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

      const sanitized = transform(obj);

      // Verify zero drift
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

      return { sanitized, safe: guard.safe };
    }

    res.json = function jsonOverride(body: any) {
      if (body && typeof body === 'object') {
        const { sanitized, safe } = localizeObject(body);
        if (safe) {
          res.setHeader(headerName, 'true');
          return originalJson(sanitized);
        } else {
          if (options?.onDriftViolation) {
            options.onDriftViolation(body, req);
          }
          if (strict) {
            return res.status(500).json({ error: 'Zero-drift financial verification failed' });
          }
          // Non-strict: fallback safely to original untranslated body without verified header
          return originalJson(body);
        }
      }
      return originalJson(body);
    };

    res.send = function sendOverride(body: any) {
      if (typeof body === 'string') {
        try {
          const parsed = JSON.parse(body);
          const { sanitized, safe } = localizeObject(parsed);
          if (safe) {
            res.setHeader(headerName, 'true');
            return originalSend(JSON.stringify(sanitized));
          } else {
            if (options?.onDriftViolation) {
              options.onDriftViolation(parsed, req);
            }
            if (strict) {
              return res.status(500).send(JSON.stringify({ error: 'Zero-drift financial verification failed' }));
            }
            return originalSend(body);
          }
        } catch {
          // Plain text or HTML: pass through
          return originalSend(body);
        }
      }
      return originalSend(body);
    };

    next();
  };
}
