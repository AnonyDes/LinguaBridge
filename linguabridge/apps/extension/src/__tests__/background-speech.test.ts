import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('extension hosted speech configuration', () => {
  let listener: (message: any, sender: any, respond: (result: any) => void) => boolean | void;
  let settings: Record<string, unknown>;
  let permissionsContains: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    settings = {};
    permissionsContains = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('chrome', {
      runtime: {
        onInstalled: { addListener: vi.fn() },
        onMessage: { addListener: vi.fn((callback) => { listener = callback; }) },
      },
      contextMenus: { onClicked: { addListener: vi.fn() } },
      storage: { local: { get: vi.fn(async () => settings) } },
      permissions: { contains: permissionsContains },
    });
    await import('../background');
  }, 30000);

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function requestSpeech() {
    return new Promise<any>((resolve) => {
      listener({ type: 'SYNTHESIZE_SPEECH', text: 'Mbolo', lang: 'ewo-CM' }, {}, resolve);
    });
  }

  it('explains a missing key without falling back to an offline localhost service', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const result = await requestSpeech();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Clé LinguaBridge manquante');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('explains a missing Chrome origin permission', async () => {
    settings = { linguabridgeApiKey: 'scoped-key' };
    permissionsContains.mockResolvedValue(false);
    const result = await requestSpeech();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Accès au serveur non autorisé');
  });

  it('uses Railway and plays an experimental voice when configured', async () => {
    settings = { linguabridgeApiKey: 'scoped-key' };
    const audioBase64 = Buffer.alloc(120, 1).toString('base64');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: { available: true, lang: 'ewo-cm', audioBase64, engine: 'openrouter-gemini-tts-experimental' },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await requestSpeech();
    expect(result.success).toBe(true);
    expect(result.result.engine).toBe('openrouter-gemini-tts-experimental');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api-production-72bac574.up.railway.app/v1/speech/synthesize');
  });

  it('accepts an English to French page translation batch', async () => {
    settings = { linguabridgeEnhancedTranslation: true, linguabridgeApiKey: 'scoped-key' };
    (globalThis as any).chrome.storage.local.get = vi.fn((_keys, callback) => {
      if (callback) callback(settings);
      return Promise.resolve(settings);
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      results: [{ translatedText: 'Ouvrez votre compte', targetLang: 'fr',
        provider: 'openrouter', status: 'success' }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await new Promise<any>((resolve) => listener({
      type: 'ENHANCED_TRANSLATE_BATCH',
      items: [{ text: 'Open your account', sourceLang: 'en', targetLang: 'fr' }],
    }, {}, resolve));
    expect(result.success).toBe(true);
    expect(result.results[0].translatedText).toBe('Ouvrez votre compte');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api-production-72bac574.up.railway.app/v1/translate/batch');
  });
});
