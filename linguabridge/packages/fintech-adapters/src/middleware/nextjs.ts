import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { translateSentenceToEwondo } from '@linguabridge/translation-engine';
import type { MiddlewareOptions } from '../types';

const extractor = new FinancialEntityExtractor();

const DEFAULT_TARGET_FIELDS = ['description', 'message', 'title', 'note', 'reason', 'item_name', 'summary'];

/**
 * Higher-order function wrapping Next.js route handlers (App Router or Pages Router)
 * to transparently localize marked JSON response fields with zero-drift financial verification.
 */
export function withLinguaBridge<T extends (...args: any[]) => any>(
  handler: T,
  options?: MiddlewareOptions
): T {
  const headerName = options?.headerName ?? 'X-LinguaBridge-Verified';
  const targetFields = new Set((options?.fields ?? DEFAULT_TARGET_FIELDS).map((f) => f.toLowerCase()));
  const strict = options?.strict ?? false;

  return (async (...args: any[]) => {
    const [req, res] = args;

    // Detect Pages Router (req, res)
    if (res && typeof res.json === 'function' && typeof res.setHeader === 'function') {
      const originalJson = res.json.bind(res);
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

      res.json = (body: any) => {
        if (body && typeof body === 'object') {
          const { sanitized, safe } = localizeAndVerify(body, targetLang, targetFields);
          if (safe) {
            res.setHeader(headerName, 'true');
            return originalJson(sanitized);
          }
          if (options?.onDriftViolation) {
            options.onDriftViolation(body, req);
          }
          if (strict) {
            return res.status(500).json({ error: 'Zero-drift financial verification failed' });
          }
          return originalJson(body);
        }
        return originalJson(body);
      };

      return handler(...args);
    }

    // App Router: handler(request, context) returning Response or NextResponse
    const response = await handler(...args);

    if (!response || typeof response !== 'object') {
      return response;
    }

    // Determine target language from request headers/searchParams
    let targetLang = 'ewo-CM';
    if (req) {
      if (typeof options?.targetLang === 'function') {
        targetLang = options.targetLang(req) || 'ewo-CM';
      } else if (typeof options?.targetLang === 'string') {
        targetLang = options.targetLang;
      } else if (req.headers?.get && req.headers.get('x-target-lang')) {
        targetLang = req.headers.get('x-target-lang')!;
      } else if (req.nextUrl?.searchParams?.get('lang')) {
        targetLang = req.nextUrl.searchParams.get('lang')!;
      }
    }

    // Inspect if response has a JSON body
    try {
      const contentType = response.headers?.get ? response.headers.get('content-type') : '';
      const isJson = contentType ? contentType.includes('application/json') : true;

      // Clone response to read body
      const clone = typeof response.clone === 'function' ? response.clone() : response;
      let body: any;

      if (typeof clone.json === 'function') {
        body = await clone.json();
      } else if (typeof clone.text === 'function') {
        const text = await clone.text();
        body = JSON.parse(text);
      } else {
        return response;
      }

      if (!body || typeof body !== 'object') {
        return response;
      }

      const { sanitized, safe } = localizeAndVerify(body, targetLang, targetFields);

      // Preserve existing headers
      const newHeaders = new Headers(response.headers);

      if (safe) {
        newHeaders.set(headerName, 'true');
        return new Response(JSON.stringify(sanitized), {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }

      if (options?.onDriftViolation) {
        options.onDriftViolation(body, req);
      }

      if (strict) {
        return new Response(JSON.stringify({ error: 'Zero-drift financial verification failed' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        });
      }

      // Return original response
      return response;
    } catch {
      // Non-JSON or streaming response
      return response;
    }
  }) as unknown as T;
}

/**
 * Next.js Edge / middleware helper function
 */
export function linguaBridgeNextMiddleware(options?: MiddlewareOptions) {
  return async function middleware(req: any) {
    // Passes through request while providing headers inspection
    return undefined;
  };
}

/**
 * Internal helper to localize marked fields and verify zero drift against baseline entities
 */
function localizeAndVerify(
  obj: any,
  targetLang: string,
  targetFields: Set<string>
): { sanitized: any; safe: boolean } {
  // Collect baseline financial entities
  const stringsToScan: string[] = [];
  function collect(node: any) {
    if (!node) return;
    if (typeof node === 'string') stringsToScan.push(node);
    else if (typeof node === 'number') stringsToScan.push(String(node));
    else if (Array.isArray(node)) node.forEach(collect);
    else if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === 'number' && /amount|fee|total|price/i.test(k)) {
          stringsToScan.push(`${v} FCFA`);
        } else {
          collect(v);
        }
      }
    }
  }
  collect(obj);
  const sourceEntities = stringsToScan.flatMap((s) => extractor.extract(s));

  // Transform targeted fields
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

  // Collect sanitized entities
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
