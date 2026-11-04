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
    expect(h1?.textContent).toBe('Tóbó móni yá 15000 FCFA');
    expect(p?.textContent).toBe('Móni mébembá mé nlóm: 150 FCFA');

    assistant.restorePage();
    expect(h1?.textContent).toBe('Paiement de 15000 FCFA');
    expect(p?.textContent).toBe('Frais de transfert: 150 FCFA');
  });

  it('re-translating does not corrupt original source text with previous translation', () => {
    assistant = new ExtensionAssistant();

    // First translation
    assistant.translateFullPage();
    const h1 = document.querySelector('h1');
    expect(h1?.textContent).toBe('Tóbó móni yá 15000 FCFA');

    // Second translation
    assistant.translateFullPage();
    expect(h1?.textContent).toBe('Tóbó móni yá 15000 FCFA');

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
    expect(preview?.innerHTML).toContain('Garde financière :');
    expect(preview?.innerHTML).toContain('Amount protected: 15000 FCFA');
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

  it('toggles touch-to-speak mode and enables audio player bar', () => {
    assistant = new ExtensionAssistant();
    const host = document.getElementById('linguabridge-extension-root');
    expect(host).not.toBeNull();

    assistant.toggleTouchSpeakMode();
    const toggleBtn = host?.shadowRoot?.getElementById('btn-toggle-speak');
    expect(toggleBtn?.textContent).toContain('Désactiver la lecture au toucher');

    assistant.speakTextSection('Solde disponible');
    const audioBar = host?.shadowRoot?.getElementById('audio-bar');
    expect(audioBar?.style.display).toBe('flex');
    const spokenText = host?.shadowRoot?.getElementById('audio-spoken-text');
    expect(spokenText?.textContent).toBe('Móni mí ne wá é bẽng');
  });

  it('handles click and mobile touch interaction to speak aloud section in Ewondo', () => {
    assistant = new ExtensionAssistant();
    const host = document.getElementById('linguabridge-extension-root');
    assistant.toggleTouchSpeakMode();

    const p = document.getElementById('desc');
    expect(p).not.toBeNull();

    // Trigger click on element
    p?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    const audioBar = host?.shadowRoot?.getElementById('audio-bar');
    expect(audioBar?.style.display).toBe('flex');
    const spokenText = host?.shadowRoot?.getElementById('audio-spoken-text');
    expect(spokenText?.textContent).toContain('Móni mébembá mé nlóm');
  });

  it('destroys cleanly and unmounts DOM elements and listeners', () => {
    assistant = new ExtensionAssistant();
    expect(document.getElementById('linguabridge-extension-root')).not.toBeNull();

    assistant.destroy();
    expect(document.getElementById('linguabridge-extension-root')).toBeNull();
    assistant = null;
  });

  it('automatically translates dynamic banking confirmation modals and balance popups via MutationObserver without button clicks', async () => {
    assistant = new ExtensionAssistant();
    assistant.translateFullPage();

    // Simulate modern React / Vue / Angular SPA modal injection (e.g. Afriland or Orange Money confirmation modal)
    const modal = document.createElement('div');
    modal.className = 'banking-modal-confirmation';
    modal.innerHTML = `
      <div class="modal-header">Confirmer le transfert</div>
      <div class="modal-body">
        <p class="balance-popup">Solde disponible: 75 000 FCFA</p>
        <p class="recipient">Destinataire: +237 699 123 456</p>
        <p class="tontine-note">Motif du paiement: Cotisation tontine</p>
        <span class="ref">Ref: TXN-998822</span>
      </div>
    `;
    document.body.appendChild(modal);

    // Wait for debounced mutation observer (50ms debounce)
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(modal.querySelector('.modal-header')?.textContent).toContain('Tíbíli tóbó nlóm');
    expect(modal.querySelector('.balance-popup')?.textContent).toContain('Móni mí ne wá é bẽng: 75 000 FCFA');
    expect(modal.querySelector('.recipient')?.textContent).toContain('Nyí a nòng móni: +237 699 123 456');
    expect(modal.querySelector('.tontine-note')?.textContent).toContain('Asu dzé: Móni tsɔ́');
    expect(modal.querySelector('.ref')?.textContent).toContain('Nkat: TXN-998822');

    // Restoring page restores dynamically added modal elements as well
    assistant.restorePage();
    expect(modal.querySelector('.modal-header')?.textContent).toBe('Confirmer le transfert');
    expect(modal.querySelector('.balance-popup')?.textContent).toBe('Solde disponible: 75 000 FCFA');
    expect(modal.querySelector('.recipient')?.textContent).toBe('Destinataire: +237 699 123 456');
  });

  it('translates English banking interfaces comprehensively into certified Kóbɔ́ Ewondo', () => {
    document.body.innerHTML = `
      <div id="en-bank-app">
        <h2>Available balance</h2>
        <div class="details">Transfer fees: 100 FCFA</div>
        <button class="btn-confirm">Confirm transfer</button>
        <span class="acc">Account number: CM21 1000 5001 2301 2345 6789 012</span>
      </div>
    `;
    assistant = new ExtensionAssistant();
    assistant.translateFullPage();

    expect(document.querySelector('h2')?.textContent).toBe('Móni mí ne wá é bẽng');
    expect(document.querySelector('.details')?.textContent).toBe('Móni mébembá mé nlóm: 100 FCFA');
    expect(document.querySelector('.btn-confirm')?.textContent).toBe('Tíbíli tóbó nlóm');
    expect(document.querySelector('.acc')?.textContent).toContain('Nlambá ékóbló: CM21 1000 5001 2301 2345 6789 012');
  });

  it('preserves all financial entities with 100% precision and zero drift under deterministic guard', () => {
    assistant = new ExtensionAssistant();
    document.body.innerHTML = `
      <div id="guard-test">
        <p id="tx">Transfert de 150 000 FCFA vers le +237 677 889 900 - Ref: TXN-492019</p>
        <p id="fees">Frais: 350frs | Solde actuel: 500.000 CFA</p>
      </div>
    `;
    assistant.translateFullPage();

    const txText = document.getElementById('tx')?.textContent;
    const feesText = document.getElementById('fees')?.textContent;

    expect(txText).toContain('150 000 FCFA');
    expect(txText).toContain('+237 677 889 900');
    expect(txText).toContain('TXN-492019');
    expect(feesText).toContain('350frs');
    expect(feesText).toContain('500.000 CFA');
  });

  it('immediately articulates clicked banking elements in Ewondo with floating phonetic subtitle bar', () => {
    assistant = new ExtensionAssistant();
    const host = document.getElementById('linguabridge-extension-root');
    assistant.toggleTouchSpeakMode();

    const bankingEl = document.createElement('div');
    bankingEl.id = 'bicec-element';
    bankingEl.textContent = 'Solde disponible';
    document.body.appendChild(bankingEl);

    bankingEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    const audioBar = host?.shadowRoot?.getElementById('audio-bar');
    expect(audioBar?.style.display).toBe('flex');

    const spokenText = host?.shadowRoot?.getElementById('audio-spoken-text');
    expect(spokenText?.textContent).toBe('Móni mí ne wá é bẽng');

    const phoneticSub = host?.shadowRoot?.getElementById('audio-phonetic');
    expect(phoneticSub?.textContent).toContain('mó-ní mí né wá é bèŋ');
  });
});
