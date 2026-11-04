// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LinguaBridgeWidget } from '../widget';

describe('LinguaBridgeWidget', () => {
  let widget: LinguaBridgeWidget;

  beforeEach(() => {
    document.body.innerHTML = '<div><p id="test-p">Envoyer 5000 FCFA</p></div>';
    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes('/v1/languages')) {
        return {
          ok: true,
          json: async () => ({
            languages: [
              { code: 'fr', name: 'French' },
              { code: 'en', name: 'English' },
            ],
          }),
        };
      }
      if (url.includes('/v1/translate/batch')) {
        const body = JSON.parse(init?.body as string);
        const list = body.items || body.requests || [];
        return {
          ok: true,
          json: async () => ({
            results: list.map((i: any) => ({
              originalText: i.sourceText || i.text,
              translatedText: `En-${i.sourceText || i.text}`,
              status: 'success',
            })),
          }),
        };
      }
      if (url.includes('/v1/translate')) {
        const body = JSON.parse(init?.body as string);
        return {
          ok: true,
          json: async () => ({
            originalText: body.sourceText,
            translatedText: `Translated: ${body.sourceText}`,
            warnings: ['Zero drift preserved'],
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  afterEach(() => {
    if (widget) {
      widget.destroy();
    }
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('mounts into DOM with isolated shadow root', () => {
    widget = LinguaBridgeWidget.init({ apiUrl: 'http://localhost:3001' });
    const host = document.querySelector('linguabridge-widget-host');
    expect(host).not.toBeNull();
    expect(host?.shadowRoot).toBeDefined();
    expect(host?.shadowRoot?.getElementById('toggle-widget')).not.toBeNull();
  });

  it('translates DOM content and preserves financial figures', async () => {
    widget = LinguaBridgeWidget.init({ apiUrl: 'http://localhost:3001' });
    await widget.translatePage();
    const p = document.getElementById('test-p');
    expect(p?.textContent).toBe('En-Envoyer 5000 FCFA');
  });

  it('restores original text cleanly', async () => {
    widget = LinguaBridgeWidget.init({ apiUrl: 'http://localhost:3001' });
    await widget.translatePage();
    expect(document.getElementById('test-p')?.textContent).toBe('En-Envoyer 5000 FCFA');

    widget.restoreOriginalPage();
    expect(document.getElementById('test-p')?.textContent).toBe('Envoyer 5000 FCFA');
  });

  it('re-translating does not corrupt original source text with previous translation', async () => {
    widget = LinguaBridgeWidget.init({ apiUrl: 'http://localhost:3001' });

    // First translation
    await widget.translatePage();
    const p = document.getElementById('test-p');
    expect(p?.textContent).toBe('En-Envoyer 5000 FCFA');

    // Second translation (e.g. language toggle)
    await widget.translatePage();

    const fetchSpy = global.fetch as any;
    const batchCalls = fetchSpy.mock.calls.filter((c: any) => c[0].includes('/v1/translate/batch'));
    expect(batchCalls.length).toBe(2);

    const secondCallBody = JSON.parse(batchCalls[1][1].body);
    const secondCallList = secondCallBody.requests || secondCallBody.items;
    // Crucial check: verify that sourceText sent in 2nd call is the pristine original text, NOT the translation
    expect(secondCallList[0].sourceText).toBe('Envoyer 5000 FCFA');

    // Restoration restores original
    widget.restoreOriginalPage();
    expect(p?.textContent).toBe('Envoyer 5000 FCFA');
  });

  it('destroy restores original text and unmounts container cleanly', async () => {
    widget = LinguaBridgeWidget.init({ apiUrl: 'http://localhost:3001' });
    await widget.translatePage();
    expect(document.getElementById('test-p')?.textContent).toBe('En-Envoyer 5000 FCFA');

    widget.destroy();
    expect(document.getElementById('test-p')?.textContent).toBe('Envoyer 5000 FCFA');
    expect(document.querySelector('linguabridge-widget-host')).toBeNull();
  });
});
