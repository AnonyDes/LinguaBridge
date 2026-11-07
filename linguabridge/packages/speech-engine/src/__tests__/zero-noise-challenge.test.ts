import { describe, it, expect, vi, afterEach } from 'vitest';
import { AfricanVoiceProvider } from '../providers/african-voice-provider';

describe('CHALLENGER: Zero-Noise & Defensive Silence Empirical Harness', () => {
  const provider = new AfricanVoiceProvider();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('synthesize() returns available: false and 0 audio bytes in production when neural service is offline', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      // Force fetch to reject as if microservice on 127.0.0.1:3002 is offline
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

      const res = await provider.synthesize('Mbolo mone bẽng', 'ewo-CM');

      expect(res.available).toBe(false);
      expect(res.audioBase64).toBeUndefined();
      expect(res.audioUrl).toBeUndefined();
      expect(res.unavailableReason).toBe('Neural voice service unavailable; defensive silence enforced.');
      expect(res.fallbackLang).toBeNull();
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });

  it('synthesize() in test environment returns pure silent WAV (0 audio payload bytes)', async () => {
    const res = await provider.synthesize('Mbolo mone bẽng', 'ewo-CM');
    expect(res.available).toBe(true);
    expect(res.audioBase64).toBeDefined();

    // Decode base64 and check WAV format & data chunk size
    const binaryStr = atob(res.audioBase64!);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    expect(bytes.length).toBe(44); // Exactly 44-byte header
    const view = new DataView(bytes.buffer);
    const dataSize = view.getUint32(40, true);
    expect(dataSize).toBe(0); // 0 audio payload bytes (pure silence)
  });

  it('generateStreamChunks() emits pure 0-amplitude silence in test mode', () => {
    const { header, chunks } = provider.generateStreamChunks('Mbolo', 'ewo-CM', 40);

    // Verify 44-byte RIFF WAV header
    expect(header.length).toBe(44);
    const textHeader = String.fromCharCode(...header.slice(0, 4));
    expect(textHeader).toBe('RIFF');
    const waveHeader = String.fromCharCode(...header.slice(8, 12));
    expect(waveHeader).toBe('WAVE');

    // Verify chunks contain pure zeros (0 amplitude)
    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      expect(chunk.length).toBeGreaterThan(0);
      for (let i = 0; i < chunk.length; i++) {
        expect(chunk[i]).toBe(0);
      }
      // Inspect 16-bit PCM samples
      const int16 = new Int16Array(chunk.buffer, chunk.byteOffset, chunk.byteLength / 2);
      for (let s = 0; s < int16.length; s++) {
        expect(int16[s]).toBe(0);
      }
    }
  });

  it('generateStreamChunks() emits 0 chunks (0 audio bytes) in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      const { header, chunks } = provider.generateStreamChunks('Mbolo', 'ewo-CM', 40);

      expect(chunks.length).toBe(0);
      const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
      const dataSize = view.getUint32(40, true);
      expect(dataSize).toBe(0);
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });

  it('generateAcousticWav() emits 0 audio data bytes (header only, pure silence)', () => {
    const wav = provider.generateAcousticWav('Mbolo', 'ewo-CM');
    expect(wav.length).toBe(44);
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    const dataSize = view.getUint32(40, true);
    expect(dataSize).toBe(0);
  });

  it('strictly quarantines Duala (dua-CM) with 0 audio bytes', async () => {
    const res = await provider.synthesize('Na lambi te', 'dua-CM');
    expect(res.available).toBe(false);
    expect(res.unavailableReason).toContain('strictly quarantined');
    expect(res.audioBase64).toBeUndefined();
  });
});
