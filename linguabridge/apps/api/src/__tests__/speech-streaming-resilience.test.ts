import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app';

describe('CHALLENGER 2: API Speech Streaming Resilience & Defensive Silence', () => {
  let app: FastifyInstance;
  const originalEnv = process.env.NODE_ENV;
  const originalVoiceUrl = process.env.VOICE_SERVICE_URL;

  beforeAll(async () => {
    // Direct voice service to an offline port to strictly simulate microservice downtime
    process.env.VOICE_SERVICE_URL = 'http://127.0.0.1:59999';
    app = await buildApp({ enableLogging: false });
    await app.ready();
  });

  afterAll(async () => {
    process.env.NODE_ENV = originalEnv;
    process.env.VOICE_SERVICE_URL = originalVoiceUrl;
    await app.close();
  });

  beforeEach(() => {
    process.env.VOICE_SERVICE_URL = 'http://127.0.0.1:59999';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Microservice Port 3002 Offline — Automated Test Mode (NODE_ENV=test)', () => {
    it('streams pure 0-amplitude silent WAV frames with zero acoustic noise or glottal pulses', async () => {
      (process.env as any).NODE_ENV = 'test';

      const response = await app.inject({
        method: 'GET',
        url: '/v1/speech/stream?text=Mb%C3%B3lo%20Kam%C9%99r%C3%BAn&lang=ewo-CM',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('audio/wav');
      expect(response.headers['transfer-encoding']).toBe('chunked');
      expect(response.headers['x-speech-engine']).toBe('african-neural-mms');
      expect(response.headers['x-voice-lang']).toBe('ewo-CM');

      const raw = response.rawPayload;
      expect(raw.length).toBeGreaterThan(44);

      // Verify 44-byte standard RIFF WAVE header
      const riffTag = raw.subarray(0, 4).toString('ascii');
      expect(riffTag).toBe('RIFF');
      const waveTag = raw.subarray(8, 12).toString('ascii');
      expect(waveTag).toBe('WAVE');
      const fmtTag = raw.subarray(12, 16).toString('ascii');
      expect(fmtTag).toBe('fmt ');

      const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
      const audioFormat = view.getUint16(20, true);
      expect(audioFormat).toBe(1); // Linear PCM
      const numChannels = view.getUint16(22, true);
      expect(numChannels).toBe(1); // Mono
      const sampleRate = view.getUint32(24, true);
      expect(sampleRate).toBe(16000); // 16kHz
      const bitsPerSample = view.getUint16(34, true);
      expect(bitsPerSample).toBe(16); // 16-bit

      const dataTag = raw.subarray(36, 40).toString('ascii');
      expect(dataTag).toBe('data');
      const dataSize = view.getUint32(40, true);
      expect(dataSize).toBe(raw.length - 44);

      // EMPIRICAL DSP SIGNAL ANALYSIS:
      // Verify every single 16-bit PCM sample is EXACTLY ZERO.
      // Assert:
      //  1. Peak Amplitude == 0
      //  2. Root Mean Square (RMS) energy == 0
      //  3. Non-zero sample count == 0
      //  4. Zero glottal pulse train excitation (Rosenberg pulse)
      //  5. Zero harmonic consonant buzzers
      const pcmBytes = raw.subarray(44);
      const samples = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength / 2);

      let peakAmp = 0;
      let sumSquares = 0;
      let nonZeroCount = 0;

      for (let i = 0; i < samples.length; i++) {
        const sampleVal = samples[i];
        if (sampleVal !== 0) {
          nonZeroCount++;
        }
        const absVal = Math.abs(sampleVal);
        if (absVal > peakAmp) peakAmp = absVal;
        sumSquares += sampleVal * sampleVal;
      }

      const rmsEnergy = Math.sqrt(sumSquares / samples.length);

      expect(nonZeroCount).toBe(0);
      expect(peakAmp).toBe(0);
      expect(rmsEnergy).toBe(0);
    });

    it('asserts 0-amplitude silence across all 5 sovereign languages under test mode', async () => {
      (process.env as any).NODE_ENV = 'test';
      const sovereignCodes = ['ewo-CM', 'fuv-CM', 'hau-CM', 'knc-CM', 'pcm-CM'];

      for (const lang of sovereignCodes) {
        const response = await app.inject({
          method: 'GET',
          url: `/v1/speech/stream?text=TestZeroNoise&lang=${lang}`,
        });

        expect(response.statusCode).toBe(200);
        const raw = response.rawPayload;
        const pcmBytes = raw.subarray(44);
        const samples = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength / 2);

        expect(samples.length).toBeGreaterThan(0);
        for (let i = 0; i < samples.length; i++) {
          expect(samples[i]).toBe(0);
        }
      }
    });
  });

  describe('Microservice Port 3002 Offline — Production Mode (NODE_ENV=production)', () => {
    it('strictly returns HTTP 503 JSON with ZERO audio payload bytes when microservice is offline', async () => {
      (process.env as any).NODE_ENV = 'production';

      const response = await app.inject({
        method: 'GET',
        url: '/v1/speech/stream?text=Mb%C3%B3lo%20Kam%C9%99r%C3%BAn&lang=ewo-CM',
      });

      expect(response.statusCode).toBe(503);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-type']).not.toContain('audio');

      const body = JSON.parse(response.body);
      expect(body.error).toBe('NEURAL_VOICE_OFFLINE');
      expect(body.message).toContain('defensive silence enforced');

      // ZERO AUDIO BYTES: No WAV header, no PCM bytes
      expect(response.rawPayload.subarray(0, 4).toString('ascii')).not.toBe('RIFF');
    });

    it('verifies all 5 sovereign languages return HTTP 503 with 0 audio bytes in production', async () => {
      (process.env as any).NODE_ENV = 'production';
      const sovereignCodes = ['ewo-CM', 'fuv-CM', 'hau-CM', 'knc-CM', 'pcm-CM'];

      for (const lang of sovereignCodes) {
        const response = await app.inject({
          method: 'GET',
          url: `/v1/speech/stream?text=FinancialBalance5000&lang=${lang}`,
        });

        expect(response.statusCode).toBe(503);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('NEURAL_VOICE_OFFLINE');
        expect(body.message).toBe('Neural voice service unavailable; defensive silence enforced.');
      }
    });
  });

  describe('Quarantine & Input Boundaries', () => {
    it('strictly refuses Duala (dua-CM and dua) with HTTP 403 and zero sound', async () => {
      for (const duaCode of ['dua-CM', 'dua', 'DUA-CM', 'dua-cm']) {
        const streamRes = await app.inject({
          method: 'GET',
          url: `/v1/speech/stream?text=Na%20lambi&lang=${encodeURIComponent(duaCode)}`,
        });
        expect(streamRes.statusCode).toBe(403);
        const streamBody = JSON.parse(streamRes.body);
        expect(streamBody.error).toBe('DUALA_QUARANTINED');

        const synthRes = await app.inject({
          method: 'POST',
          url: '/v1/speech/synthesize',
          payload: { text: 'Na lambi', lang: duaCode },
        });
        expect(synthRes.statusCode).toBe(403);
        const synthBody = JSON.parse(synthRes.body);
        expect(synthBody.error).toBe('DUALA_QUARANTINED');
      }
    });

    it('rejects uncertified non-sovereign languages with HTTP 422', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/speech/stream?text=Hello&lang=xyz',
      });
      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('UNSUPPORTED_VOICE_LANGUAGE');
    });

    it('rejects missing or empty query parameters with HTTP 400', async () => {
      const res1 = await app.inject({
        method: 'GET',
        url: '/v1/speech/stream',
      });
      expect(res1.statusCode).toBe(400);

      const res2 = await app.inject({
        method: 'GET',
        url: '/v1/speech/stream?text=&lang=ewo-CM',
      });
      expect(res2.statusCode).toBe(400);
    });
  });

  describe('Adversarial Stress Test: High-Concurrency Offline Streaming', () => {
    it('gracefully handles 50 concurrent requests when microservice is offline without crashing', async () => {
      (process.env as any).NODE_ENV = 'production';

      const requests = Array.from({ length: 50 }, (_, i) =>
        app.inject({
          method: 'GET',
          url: `/v1/speech/stream?text=ConcurrentStream_${i}&lang=ewo-CM`,
        })
      );

      const results = await Promise.all(requests);
      expect(results.length).toBe(50);
      for (const res of results) {
        expect(res.statusCode).toBe(503);
        const body = JSON.parse(res.body);
        expect(body.error).toBe('NEURAL_VOICE_OFFLINE');
      }
    });
  });
});
