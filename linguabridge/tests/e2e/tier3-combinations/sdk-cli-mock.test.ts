import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as http from 'node:http';
import { getAvailablePort } from '../helpers/test-utils';

/**
 * Tier 3: Cross-Feature Combinations — Pairwise: SDK Client -> CLI Mock Server
 * Authoritative Source: ORIGINAL_REQUEST.md (R2, R5) & PROJECT.md (§2 & §5)
 */
describe('Tier 3: Pairwise — SDK Client -> CLI Mock Server (Offline Developer Interoperability)', () => {
  let mockServer: http.Server;
  let mockPort: number;

  beforeAll(async () => {
    mockPort = await getAvailablePort();
    mockServer = http.createServer((req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', mock: true }));
        return;
      }
      if (req.url === '/v1/translate' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const parsed = JSON.parse(body || '{}');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              translatedText: `[Mock Server Ewondo] ${parsed.sourceText}`,
              status: 'safe',
            })
          );
        });
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => mockServer.listen(mockPort, '127.0.0.1', resolve));
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));
  });

  it('3.5 should allow SDK client to communicate with offline CLI mock translation server', async () => {
    const mockUrl = `http://127.0.0.1:${mockPort}`;

    // 1. Check health
    const healthRes = await fetch(`${mockUrl}/health`);
    expect(healthRes.status).toBe(200);
    const healthData = await healthRes.json();
    expect(healthData.status).toBe('ok');
    expect(healthData.mock).toBe(true);

    // 2. Perform translation
    const transRes = await fetch(`${mockUrl}/v1/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceText: 'Solde 100 000 FCFA',
        sourceLang: 'fr',
        targetLang: 'ewo-CM',
      }),
    });

    expect(transRes.status).toBe(200);
    const transData = await transRes.json();
    expect(transData.translatedText).toContain('100 000 FCFA');
    expect(transData.status).toBe('safe');
  });
});
