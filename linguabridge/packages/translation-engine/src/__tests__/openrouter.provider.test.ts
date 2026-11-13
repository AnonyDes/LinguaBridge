import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenRouterProvider } from '../providers/openrouter.provider';

afterEach(() => vi.unstubAllGlobals());

describe('OpenRouterProvider', () => {
  const request = {
    id: 'openrouter-test', sourceText: 'Votre solde est disponible.',
    sourceLang: 'fr', targetLang: 'ewo-CM', domain: 'general' as const,
  };

  it('names the target language and sends configured fallback models', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Translated sentence' }, finish_reason: 'stop' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const provider = new OpenRouterProvider({ apiKey: 'test', model: 'primary/model',
      fallbackModels: [' backup/model ', 'primary/model'] });
    const result = await provider.translate(request);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.models).toEqual(['primary/model', 'backup/model']);
    expect(body.messages[0].content).toContain('Ewondo (Cameroon)');
    expect(result.status).toBe('success');
  });

  it('does not mark a truncated completion as successful', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Partial output' }, finish_reason: 'length' }] }),
    }));
    const result = await new OpenRouterProvider({ apiKey: 'test' }).translate(request);
    expect(result.status).toBe('unverified');
    expect(result.warnings).toContain('INCOMPLETE_MODEL_OUTPUT');
  });
});
