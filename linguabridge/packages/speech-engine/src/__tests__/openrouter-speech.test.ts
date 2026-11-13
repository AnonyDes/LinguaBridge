import { afterEach, describe, expect, it, vi } from 'vitest';
import { AfricanVoiceProvider } from '../providers/african-voice-provider';

describe('hosted African speech', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('wraps non-silent Hausa PCM as a WAV without changing the requested language', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ENABLE_OPENROUTER_SPEECH', 'true');
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const pcm = new Uint8Array(2400);
    pcm[200] = 35;
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('local voice offline'))
      .mockResolvedValueOnce(new Response(pcm, { headers: { 'content-type': 'audio/pcm;rate=24000;channels=1' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await new AfricanVoiceProvider().synthesize('Sannu', 'hau-CM');
    expect(result.available).toBe(true);
    expect(result.lang).toBe('hau-CM');
    expect(result.engine).toBe('openrouter-gemini-tts');
    expect(Buffer.from(result.audioBase64!, 'base64').subarray(0, 4).toString()).toBe('RIFF');
    expect(fetchMock.mock.calls[1][0]).toBe('https://openrouter.ai/api/v1/audio/speech');
  });

  it('does not substitute a Hausa voice for Ewondo', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ENABLE_OPENROUTER_SPEECH', 'true');
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const fetchMock = vi.fn().mockRejectedValue(new Error('local voice offline'));
    vi.stubGlobal('fetch', fetchMock);
    const result = await new AfricanVoiceProvider().synthesize('Mbólo', 'ewo-CM');
    expect(result.available).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
