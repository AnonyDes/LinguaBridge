// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { speakAfricanText } from '../banking-engine';

describe('CHALLENGER 2: Widget Banking Engine Speech Fallback & Zero-Noise Resilience', () => {
  let connectedToDestination: any[] = [];
  let oscillatorCallCount = 0;
  let biquadFilterCallCount = 0;
  let bufferSourceCallCount = 0;

  beforeEach(() => {
    connectedToDestination = [];
    oscillatorCallCount = 0;
    biquadFilterCallCount = 0;
    bufferSourceCallCount = 0;

    const mockDestination = {
      maxChannelCount: 2,
    };

    class MockAudioBufferSourceNode {
      buffer: any = null;
      onended: (() => void) | null = null;
      connect(target: any) {
        if (target === mockDestination) {
          connectedToDestination.push(this);
        }
      }
      start(_when?: number) {}
      stop(_when?: number) {}
    }

    class MockAudioContext {
      state = 'running';
      destination = mockDestination;

      createBufferSource() {
        bufferSourceCallCount++;
        return new MockAudioBufferSourceNode();
      }

      createOscillator() {
        oscillatorCallCount++;
        return {
          type: 'sawtooth',
          frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
          connect: (target: any) => {
            if (target === mockDestination) connectedToDestination.push(this);
          },
          start: vi.fn(),
          stop: vi.fn(),
        };
      }

      createBiquadFilter() {
        biquadFilterCallCount++;
        return {
          type: 'bandpass',
          frequency: { value: 0 },
          Q: { value: 0 },
          connect: (target: any) => {
            if (target === mockDestination) connectedToDestination.push(this);
          },
        };
      }

      async decodeAudioData(buffer: ArrayBuffer) {
        return {
          duration: 1.0,
          length: 16000,
          numberOfChannels: 1,
          sampleRate: 16000,
        } as AudioBuffer;
      }

      async resume() {
        this.state = 'running';
      }
    }

    (window as any).AudioContext = MockAudioContext;
    (window as any).webkitAudioContext = MockAudioContext;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invokes onEnd, returns true, and attaches ZERO audio nodes to destination when speech microservice is offline', async () => {
    // Simulate port 3002 down (network failure / connection refused)
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED: port 3002 is down'));

    const sovereignLanguages = ['ewo-CM', 'fuv-CM', 'hau-CM', 'knc-CM', 'pcm-CM'];

    for (const lang of sovereignLanguages) {
      const onStart = vi.fn();
      const onEnd = vi.fn();

      const result = speakAfricanText(
        'Mbolo, móni mí ne wá é bẽng 25000 FCFA',
        'Mbolo, moni mi ne wa e beng 25000 FCFA',
        lang,
        onStart,
        onEnd,
        'http://127.0.0.1:59999'
      );

      expect(result).toBe(true);

      // Wait for defensive silence timeout (50ms)
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onStart).toHaveBeenCalled();
      expect(onEnd).toHaveBeenCalled();

      // STRICT MANDATE VERIFICATION:
      // 1. NO audio nodes must be attached to destination
      // 2. NO OscillatorNode must ever be instantiated
      // 3. NO BiquadFilterNode must ever be instantiated
      expect(connectedToDestination.length).toBe(0);
      expect(oscillatorCallCount).toBe(0);
      expect(biquadFilterCallCount).toBe(0);
    }
  });

  it('enforces complete defensive silence when backend returns HTTP 503 error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'NEURAL_VOICE_OFFLINE' }),
    });

    const onStart = vi.fn();
    const onEnd = vi.fn();

    const result = speakAfricanText('How far na 5000 FCFA', 'How far na 5000 FCFA', 'pcm-CM', onStart, onEnd);
    expect(result).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onEnd).toHaveBeenCalled();
    expect(connectedToDestination.length).toBe(0);
    expect(oscillatorCallCount).toBe(0);
    expect(biquadFilterCallCount).toBe(0);
  });

  it('handles empty or whitespace text cleanly with zero audio nodes attached', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Should not be called for empty text'));

    const onStart = vi.fn();
    const onEnd = vi.fn();

    const result = speakAfricanText('   ', '   ', 'ewo-CM', onStart, onEnd);
    expect(result).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onStart).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
    expect(connectedToDestination.length).toBe(0);
    expect(oscillatorCallCount).toBe(0);
  });

  it('stress test: 25 rapid concurrent playback triggers under offline conditions resolve without node leaks', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const promises = Array.from({ length: 25 }, (_, i) => {
      return new Promise<void>((resolve) => {
        const onEnd = () => resolve();
        speakAfricanText(`StressText_${i}`, `StressText_${i}`, 'hau-CM', undefined, onEnd);
      });
    });

    await Promise.all(promises);

    expect(connectedToDestination.length).toBe(0);
    expect(oscillatorCallCount).toBe(0);
    expect(biquadFilterCallCount).toBe(0);
  });
});
