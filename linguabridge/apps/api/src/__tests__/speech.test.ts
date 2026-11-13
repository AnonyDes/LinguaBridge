import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app';

describe('African Live Voice & Speech Streaming API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ enableLogging: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/speech/synthesize', () => {
    it('synthesizes authentic audio for the 5 Sovereign Cameroonian Languages', async () => {
      const languages = [
        { code: 'ewo-CM', text: 'Mbólo, solde yá kálada 25000 FCFA' },
        { code: 'fuv-CM', text: 'Jam bandu, ceede maada heddiiɗe 25000 FCFA' },
        { code: 'hau-CM', text: 'Sannu, kudin asusunka 25000 FCFA' },
        { code: 'knc-CM', text: 'Ndawuro, kudi asusunəmye 25000 FCFA' },
        { code: 'pcm-CM', text: 'How far, your account balance na 25000 FCFA' },
      ];

      for (const item of languages) {
        const response = await app.inject({
          method: 'POST',
          url: '/v1/speech/synthesize',
          payload: {
            text: item.text,
            lang: item.code,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.data.available).toBe(true);
        expect(body.data.lang).toBe(item.code);
        expect(body.data.audioBase64).toBeDefined();
        expect(body.data.audioUrl).toContain('data:audio/wav;base64,');
        expect(['african-neural-mms', 'meta-mms-neural-live']).toContain(body.data.engine);
      }
    }, 60000);

    it('strictly returns 403 Forbidden when Duala (dua-CM) is requested', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/speech/synthesize',
        payload: {
          text: 'Mbolo mosso',
          lang: 'dua-CM',
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('DUALA_QUARANTINED');
      expect(body.message).toContain('quarantined');
    });

    it('rejects uncertified non-sovereign languages with 422', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/speech/synthesize',
        payload: {
          text: 'Mbôk',
          lang: 'bas-CM',
        },
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('VOICE_SYNTHESIS_UNAVAILABLE');
    });
  });

  describe('GET /v1/speech/stream', () => {
    it('streams real-time chunked audio/wav for sovereign languages', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/speech/stream?text=Mbólo%20Kamərún&lang=ewo-CM',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('audio/wav');
      expect(response.headers['transfer-encoding']).toBe('chunked');
      expect(response.headers['x-speech-engine']).toBe('african-neural-mms');
      expect(response.rawPayload.length).toBeGreaterThan(44);
      // Verify RIFF WAV header magic bytes
      const headerStr = response.rawPayload.subarray(0, 4).toString('ascii');
      expect(headerStr).toBe('RIFF');
    });

    it('strictly returns 403 Forbidden when Duala is requested for streaming', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/speech/stream?text=Mbolo&lang=dua',
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('DUALA_QUARANTINED');
    });
  });

  describe('GET /v1/speech/languages', () => {
    it('reports African voice languages without claiming unavailable models are verified', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/speech/languages',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const codes = body.languages.map((l: any) => l.code);
      expect(codes).toContain('ewo-CM');
      expect(codes).toContain('fuv-CM');
      expect(codes).toContain('hau-CM');
      expect(codes).toContain('knc-CM');
      expect(codes).toContain('pcm-CM');
      expect(codes).not.toContain('dua-CM');
      expect(body.quarantined).toContain('dua-CM');
      expect(body.languages.find((language: any) => language.code === 'knc-CM').status).toBe('unavailable');
    });
  });
});
