import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { startMockServer, type MockServerInstance } from '../server';

describe('lb serve command & mock server', () => {
  let serverInstance: MockServerInstance;
  const testPort = 3891;

  beforeAll(async () => {
    serverInstance = await startMockServer(testPort, '127.0.0.1');
  });

  afterAll(async () => {
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  it('GET /health returns 200 and healthy status', async () => {
    const res = await fetch(`${serverInstance.url}/health`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.providers).toContain('fixture');
    expect(typeof body.uptime).toBe('number');
  });

  it('GET /v1/languages returns registered languages including Ewondo', async () => {
    const res = await fetch(`${serverInstance.url}/v1/languages`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.count).toBeGreaterThanOrEqual(1);

    const codes = body.languages.map((l: { code: string }) => l.code);
    expect(codes).toContain('ewo-CM');
  });

  it('GET /api/v1/languages dual-mounts properly', async () => {
    const res = await fetch(`${serverInstance.url}/api/v1/languages`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBeGreaterThanOrEqual(1);
  });

  it('POST /v1/translate translates text with zero-drift AST validation', async () => {
    const res = await fetch(`${serverInstance.url}/v1/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceText: 'Solde: 15 000 FCFA',
        targetLang: 'ewo-CM',
        sourceLang: 'fr',
      }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('x-linguabridge-verified')).toBe('true');
    expect(res.headers.get('x-linguabridge-fingerprint')).toMatch(/^[a-f0-9]{64}$/);

    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.translatedText).toContain('15 000 FCFA');
  });

  it('POST /v1/translate returns 400 when sourceText is missing', async () => {
    const res = await fetch(`${serverInstance.url}/v1/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetLang: 'ewo-CM',
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Bad Request');
  });

  it('POST /v1/verify returns safe: true for exact matching entities', async () => {
    const res = await fetch(`${serverInstance.url}/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceText: 'Solde: 50 000 FCFA',
        translatedText: 'Móni: 50 000 FCFA',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.safe).toBe(true);
    expect(body.sourceFingerprint).toBe(body.translatedFingerprint);
  });

  it('POST /v1/verify returns safe: false and violations when amount is modified', async () => {
    const res = await fetch(`${serverInstance.url}/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceText: 'Solde: 50 000 FCFA',
        translatedText: 'Móni: 60 000 FCFA',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.safe).toBe(false);
    expect(body.violations.length).toBeGreaterThan(0);
  });

  it('handles CORS OPTIONS preflight with 204 No Content', async () => {
    const res = await fetch(`${serverInstance.url}/v1/translate`, {
      method: 'OPTIONS',
    });

    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('returns 404 for unknown endpoints', async () => {
    const res = await fetch(`${serverInstance.url}/nonexistent-route`);
    expect(res.status).toBe(404);
  });

  it('detects and rejects port collision with EADDRINUSE', async () => {
    await expect(startMockServer(testPort, '127.0.0.1')).rejects.toThrow(/already in use/);
  });
});
