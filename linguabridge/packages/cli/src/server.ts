import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { TranslationPipeline, FixtureProvider, type CacheStore } from '@linguabridge/translation-engine';
import type { TranslationDomain, TranslationResult, Language } from '@linguabridge/shared-types';

export interface MockServerOptions {
  port?: number;
  host?: string;
}

export interface MockServerInstance {
  server: Server;
  port: number;
  host: string;
  url: string;
  close: () => Promise<void>;
}

const memoryStore = new Map<string, string>();
const serverCache: CacheStore = {
  get: async (key: string) => memoryStore.get(key) ?? null,
  set: async (key: string, value: string) => {
    memoryStore.set(key, value);
  },
};

const DEFAULT_LANGUAGES: Language[] = [
  {
    code: 'ewo-CM',
    name: 'Ewondo',
    nativeName: 'Kóbó Ewondo',
    iso639_3: 'ewo',
    speechAvailable: true,
    packStatus: 'production_approved',
    isAvailable: true,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    iso639_3: 'fra',
    speechAvailable: false,
    packStatus: 'production_approved',
    isAvailable: true,
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    iso639_3: 'eng',
    speechAvailable: false,
    packStatus: 'production_approved',
    isAvailable: true,
  },
];

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error(`Malformed JSON body: ${(err as Error).message}`));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown, headers: Record<string, string> = {}): void {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, X-LinguaBridge-Signature',
    ...headers,
  });
  res.end(json);
}

export function createMockServer(): Server {
  const extractor = new FinancialEntityExtractor();
  const pipeline = new TranslationPipeline({
    providers: [new FixtureProvider()],
    cache: serverCache,
  });

  const server = createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, X-LinguaBridge-Signature',
      });
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method?.toUpperCase();

    // 1. GET /health
    if (method === 'GET' && pathname === '/health') {
      sendJson(res, 200, {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        providers: ['fixture'],
      });
      return;
    }

    // 2. GET /v1/languages or /api/v1/languages
    if (method === 'GET' && (pathname === '/v1/languages' || pathname === '/api/v1/languages')) {
      sendJson(res, 200, {
        languages: DEFAULT_LANGUAGES,
        count: DEFAULT_LANGUAGES.length,
      });
      return;
    }

    // 3. POST /v1/translate or /api/v1/translate
    if (method === 'POST' && (pathname === '/v1/translate' || pathname === '/api/v1/translate')) {
      try {
        const body = (await parseJsonBody(req)) as Record<string, unknown>;
        const sourceText = String(body.sourceText || '').trim();
        const targetLang = String(body.targetLang || '').trim();
        const sourceLang = String(body.sourceLang || 'fr').trim();
        const domain = (body.domain as TranslationDomain) || 'financial';

        if (!sourceText) {
          sendJson(res, 400, { error: 'Bad Request', message: 'Missing required field: sourceText' });
          return;
        }
        if (!targetLang) {
          sendJson(res, 400, { error: 'Bad Request', message: 'Missing required field: targetLang' });
          return;
        }

        const sourceEntities = extractor.extract(sourceText);
        const result: TranslationResult = await pipeline.process({
          id: randomUUID(),
          sourceText,
          sourceLang,
          targetLang,
          domain,
        });

        const translatedEntities = extractor.extract(result.translatedText);
        const comparison = extractor.compare(sourceEntities, translatedEntities);
        const safe = result.status !== 'unsafe' && comparison.safe;

        sendJson(res, 200, result, {
          'X-LinguaBridge-Verified': String(safe),
          'X-LinguaBridge-Fingerprint': comparison.sourceFingerprint,
        });
        return;
      } catch (err) {
        sendJson(res, 400, { error: 'Bad Request', message: (err as Error).message });
        return;
      }
    }

    // 4. POST /v1/verify or /api/v1/verify
    if (method === 'POST' && (pathname === '/v1/verify' || pathname === '/api/v1/verify')) {
      try {
        const body = (await parseJsonBody(req)) as Record<string, unknown>;
        const sourceText = String(body.sourceText || '').trim();
        const translatedText = String(body.translatedText || '').trim();

        if (!sourceText || !translatedText) {
          sendJson(res, 400, {
            error: 'Bad Request',
            message: 'Both sourceText and translatedText are required.',
          });
          return;
        }

        const sourceEntities = extractor.extract(sourceText);
        const translatedEntities = extractor.extract(translatedText);
        const comparison = extractor.compare(sourceEntities, translatedEntities);

        sendJson(res, 200, {
          safe: comparison.safe,
          sourceFingerprint: comparison.sourceFingerprint,
          translatedFingerprint: comparison.translatedFingerprint,
          violations: comparison.violations,
          sourceEntities,
          translatedEntities,
        });
        return;
      } catch (err) {
        sendJson(res, 400, { error: 'Bad Request', message: (err as Error).message });
        return;
      }
    }

    // 404 for unknown endpoints
    sendJson(res, 404, {
      error: 'Not Found',
      message: `Cannot ${method} ${pathname}`,
      availableEndpoints: [
        'GET /health',
        'GET /v1/languages',
        'POST /v1/translate',
        'POST /v1/verify',
      ],
    });
  });

  return server;
}

export async function startMockServer(
  port = 3030,
  host = '127.0.0.1'
): Promise<MockServerInstance> {
  const server = createMockServer();

  return new Promise((resolve, reject) => {
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        const customErr = new Error(
          `Port ${port} is already in use. Please select a different port with --port ${port + 1}`
        );
        (customErr as NodeJS.ErrnoException).code = 'EADDRINUSE';
        reject(customErr);
      } else {
        reject(err);
      }
    });

    server.listen(port, host, () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      const url = `http://${host}:${actualPort}`;

      resolve({
        server,
        port: actualPort,
        host,
        url,
        close: async () => {
          return new Promise<void>((resClose) => {
            server.close(() => resClose());
          });
        },
      });
    });
  });
}
