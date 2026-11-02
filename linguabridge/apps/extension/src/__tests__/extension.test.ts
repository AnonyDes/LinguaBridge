// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExtensionAssistant } from '../content';

describe('Chrome Extension Content Assistant', () => {
  let assistant: ExtensionAssistant | null = null;
  let messageListener: ((msg: any) => void) | null = null;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"><h1>Paiement de 15000 FCFA</h1><p id="desc">Frais de transfert: 150 FCFA</p></div>';
    messageListener = null;

    (global as any).chrome = {
      runtime: {
        sendMessage: vi.fn((msg, callback) => {
          if (msg.type === 'TRANSLATE_TEXT') {
            callback({
              success: true,
              result: {
                originalText: msg.text,
                translatedText: `Translated: ${msg.text}`,
                warnings: msg.text.includes('15000') ? ['Amount protected: 15000 FCFA'] : [],
              },
            });
          } else if (msg.type === 'TRANSLATE_BATCH') {
            callback({
              success: true,
              results: msg.items.map((i: any) => ({
                originalText: i.text,
                translatedText: `En-${i.text}`,
              })),
            });
          }
        }),
        onMessage: {
          addListener: vi.fn((fn) => {
            messageListener = fn;
          }),
          removeListener: vi.fn(),
        },
      },
    };
  });

  afterEach(() => {
    if (assistant) {
      assistant.destroy();
      assistant = null;
    }
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('attaches shadow DOM isolated widget host element', () => {
    assistant = new ExtensionAssistant();
    const host = document.getElementById('linguabridge-extension-root');
    expect(host).not.toBeNull();
    expect(host?.shadowRoot).toBeDefined();
    expect(host?.shadowRoot?.getElementById('btn-toggle')).not.toBeNull();
  });

  it('translates full page and restores original text', () => {
    assistant = new ExtensionAssistant();
    assistant.translateFullPage();

    const h1 = document.querySelector('h1');
    const p = document.getElementById('desc');
    expect(h1?.textContent).toBe('En-Paiement de 15000 FCFA');
    expect(p?.textContent).toBe('En-Frais de transfert: 150 FCFA');

    assistant.restorePage();
    expect(h1?.textContent).toBe('Paiement de 15000 FCFA');
    expect(p?.textContent).toBe('Frais de transfert: 150 FCFA');
  });

  it('re-translating does not corrupt original source text with previous translation', () => {
    assistant = new ExtensionAssistant();

    // First translation
    assistant.translateFullPage();
    const h1 = document.querySelector('h1');
    expect(h1?.textContent).toBe('En-Paiement de 15000 FCFA');

    // Second translation (simulating target language toggle)
    assistant.translateFullPage();
    const sendMessageSpy = (global as any).chrome.runtime.sendMessage;
    const lastCallArgs = sendMessageSpy.mock.calls[sendMessageSpy.mock.calls.length - 1][0];

    // Verify the batch items sent contain the ORIGINAL text, NOT the translated "En-..." string
    expect(lastCallArgs.items[0].text).toBe('Paiement de 15000 FCFA');
    expect(lastCallArgs.items[1].text).toBe('Frais de transfert: 150 FCFA');

    // Restore should still return the pristine original text
    assistant.restorePage();
    expect(h1?.textContent).toBe('Paiement de 15000 FCFA');
  });

  it('translates selected text and displays financial guard alerts', async () => {
    assistant = new ExtensionAssistant();
    await assistant.translateSelectedText('15000 FCFA');

    const host = document.getElementById('linguabridge-extension-root');
    const preview = host?.shadowRoot?.getElementById('selection-preview');
    expect(preview).not.toBeNull();
    expect(preview?.style.display).toBe('block');
    expect(preview?.innerHTML).toContain('Translated: 15000 FCFA');
    expect(preview?.innerHTML).toContain('Financial Guard: Amount protected: 15000 FCFA');
  });

  it('handles context menu translation message from background worker', () => {
    assistant = new ExtensionAssistant();
    expect(messageListener).not.toBeNull();

    // Trigger context menu message
    messageListener!({
      type: 'CONTEXT_MENU_TRANSLATE',
      text: 'Solde du compte',
    });

    const host = document.getElementById('linguabridge-extension-root');
    const preview = host?.shadowRoot?.getElementById('selection-preview');
    expect(preview?.innerHTML).toContain('Translated: Solde du compte');
  });

  it('destroys cleanly and unmounts DOM elements and listeners', () => {
    assistant = new ExtensionAssistant();
    expect(document.getElementById('linguabridge-extension-root')).not.toBeNull();

    assistant.destroy();
    expect(document.getElementById('linguabridge-extension-root')).toBeNull();
    assistant = null;
  });
});
