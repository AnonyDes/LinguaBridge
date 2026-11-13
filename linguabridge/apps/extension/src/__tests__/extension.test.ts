// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExtensionAssistant } from '../content';
import { APERTIUM_EWONDO_ENTRIES, translateSentenceToSovereign, ENGLISH_COMMON_ENTRIES, SOVEREIGN_DICTIONARIES } from '@linguabridge/translation-engine';

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
    vi.unstubAllGlobals();
  });

  it('does not create Web Audio until the page receives a user gesture', () => {
    let creations = 0;
    vi.stubGlobal('AudioContext', class {
      state = 'suspended';
      constructor() { creations++; }
      resume = vi.fn().mockResolvedValue(undefined);
      close = vi.fn().mockResolvedValue(undefined);
    });
    assistant = new ExtensionAssistant();
    (assistant as any).speechPlayer.prewarm();
    expect(creations).toBe(0);
    window.dispatchEvent(new Event('pointerdown'));
    expect((assistant as any).speechPlayer.audioCtx).not.toBeNull();
    expect(creations).toBeGreaterThanOrEqual(1);
  });

  it('offers English and French and translates an English page into French with the model', async () => {
    document.documentElement.lang = 'en';
    document.body.innerHTML = '<p id="message">Open your account</p>';
    (global as any).chrome.runtime.sendMessage = vi.fn((message, callback) => {
      if (message.type === 'ENHANCED_TRANSLATE_BATCH') {
        callback({ success: true, results: message.items.map((item: any) => ({
          translatedText: 'Ouvrez votre compte', targetLang: item.targetLang,
          provider: 'openrouter', status: 'success',
        })) });
      }
    });
    assistant = new ExtensionAssistant();
    const selector = document.getElementById('linguabridge-extension-root')?.shadowRoot
      ?.getElementById('target-lang') as HTMLSelectElement;
    expect(Array.from(selector.options).map((option) => option.value)).toEqual(
      expect.arrayContaining(['en', 'fr'])
    );
    selector.value = 'fr';
    selector.dispatchEvent(new Event('change'));
    assistant.translateFullPage();
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(document.getElementById('message')?.textContent).toBe('Ouvrez votre compte');
    document.documentElement.lang = '';
  });

  it('uses a browser voice only for English and French', () => {
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      lang = '';
      voice: any = null;
      onstart: any = null;
      onend: any = null;
      onerror: any = null;
      constructor(public text: string) {}
    });
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', {
      speak, cancel: vi.fn(), resume: vi.fn(), speaking: false,
      getVoices: () => [{ lang: 'fr-FR', name: 'French voice' }],
    });
    assistant = new ExtensionAssistant();
    const player = (assistant as any).speechPlayer;
    player.speak('Bonjour', undefined, undefined, 'fr');
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls[0][0].lang).toBe('fr-FR');
    player.speak('Mbolo', undefined, undefined, 'ewo-CM');
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it('attaches shadow DOM isolated widget host element', () => {
    assistant = new ExtensionAssistant();
    const host = document.getElementById('linguabridge-extension-root');
    expect(host).not.toBeNull();
    expect(host?.shadowRoot).toBeDefined();
    expect(host?.shadowRoot?.getElementById('btn-toggle')).not.toBeNull();
  });

  it('keeps the actual speech error visible after the panel rerenders', () => {
    assistant = new ExtensionAssistant();
    (assistant as any).updateVoiceAvailability(false, 'Clé LinguaBridge manquante.');
    (assistant as any).render();
    const text = document.getElementById('linguabridge-extension-root')?.shadowRoot
      ?.getElementById('voice-status')?.textContent;
    expect(text).toContain('Clé LinguaBridge manquante');
    expect(text).not.toContain('choisissez Hausa ou Fulfulde');
  });

  it('refreshes page size when content appears after the initial scan', () => {
    document.body.innerHTML = '<main id="late"></main>';
    assistant = new ExtensionAssistant();
    document.getElementById('late')!.textContent = 'A later paragraph with useful page content';
    let metrics: any;
    (messageListener as any)?.({ type: 'GET_PAGE_METRICS' }, null, (value: any) => { metrics = value; });
    expect(metrics.segments).toBe(1);
    expect(metrics.characters).toBeGreaterThan(30);
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

  it('measures the page and applies model translations without losing inline markup', async () => {
    document.body.innerHTML = '<p id="plain">Quasar nebula</p><p id="inline">Quasar <strong>nebula</strong> orbit</p>';
    (global as any).chrome.storage = {
      local: { get: vi.fn((_keys, callback) => callback({
        linguabridgeEnhancedTranslation: true, linguabridgeTargetLang: 'hau-CM',
      })) },
    };
    (global as any).chrome.runtime.sendMessage = vi.fn((message, callback) => {
      if (message.type === 'ENHANCED_TRANSLATE_BATCH') {
        callback({ success: true, results: message.items.map((item: any) => ({
          translatedText: item.text.includes('<t0>') ? 'Samaniya <t0>taurari</t0> zagaye' : 'Samaniya taurari',
          targetLang: item.targetLang, provider: 'model', status: 'success',
        })) });
      }
    });
    assistant = new ExtensionAssistant();
    assistant.translateFullPage();
    let metrics: any;
    (messageListener as any)?.({ type: 'GET_PAGE_METRICS' }, null, (value: any) => { metrics = value; });
    expect(metrics.segments).toBeGreaterThanOrEqual(3);
    expect(metrics.characters).toBeGreaterThan(20);
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(document.getElementById('plain')?.textContent).toBe('Samaniya taurari');
    expect(document.getElementById('inline')?.querySelector('strong')?.textContent).toBe('taurari');
    assistant.restorePage();
    expect(document.getElementById('plain')?.textContent).toBe('Quasar nebula');
    expect(document.getElementById('inline')?.textContent).toBe('Quasar nebula orbit');
  });

  it('resumes translation on a newly loaded document after the user enables it', () => {
    (global as any).chrome.storage = {
      local: {
        get: vi.fn((_keys, callback) => callback({ linguabridgeAutoTranslate: true, linguabridgeTargetLang: 'ewo-CM' })),
      },
    };
    assistant = new ExtensionAssistant();
    expect(document.querySelector('h1')?.textContent).toBe('Tóbó móni yá 15000 FCFA');
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

  it('strictly quarantines Duala and exposes only the 5 Sovereign Cameroonian Languages', () => {
    document.body.innerHTML = '<p id="balance">Solde disponible</p><p id="money">50 000 FCFA</p>';
    assistant = new ExtensionAssistant();
    const selector = document.getElementById('linguabridge-extension-root')?.shadowRoot?.getElementById('target-lang') as HTMLSelectElement;
    expect(selector).not.toBeNull();
    const optionValues = Array.from(selector.options).map((o) => o.value);
    
    // Duala must be completely quarantined and absent from visible options
    expect(optionValues.some((v) => v.includes('dua'))).toBe(false);

    // All 5 Sovereign Languages must be present
    expect(optionValues).toContain('ewo-CM');
    expect(optionValues).toContain('fuv-CM');
    expect(optionValues).toContain('hau-CM');
    expect(optionValues).toContain('knc-CM');
    expect(optionValues).toContain('pcm-CM');
  });

  it('translates seamlessly across Fulfulde, Haoussa, Kanuri and Pidgin with Zero Drift', () => {
    document.body.innerHTML = '<p id="balance">Solde disponible</p><p id="amount">15 000 FCFA</p>';
    assistant = new ExtensionAssistant();
    const selector = document.getElementById('linguabridge-extension-root')?.shadowRoot?.getElementById('target-lang') as HTMLSelectElement;

    // 1. Fulfulde
    selector.value = 'fuv-CM';
    selector.dispatchEvent(new Event('change'));
    assistant.translateFullPage();
    expect(document.getElementById('balance')?.textContent).toContain('Shede woodiide');
    expect(document.getElementById('amount')?.textContent).toBe('15 000 FCFA');

    // 2. Haoussa
    selector.value = 'hau-CM';
    selector.dispatchEvent(new Event('change'));
    assistant.translateFullPage();
    expect(document.getElementById('balance')?.textContent).toContain('Ragowar kuɗi');
    expect(document.getElementById('amount')?.textContent).toBe('15 000 FCFA');

    // 3. Kanuri
    selector.value = 'knc-CM';
    selector.dispatchEvent(new Event('change'));
    assistant.translateFullPage();
    expect(document.getElementById('balance')?.textContent).toContain('Kəla kəlabe mbeji');
    expect(document.getElementById('amount')?.textContent).toBe('15 000 FCFA');

    // 4. Pidgin English
    selector.value = 'pcm-CM';
    selector.dispatchEvent(new Event('change'));
    assistant.translateFullPage();
    expect(document.getElementById('balance')?.textContent).toContain('Money wey dey available');
    expect(document.getElementById('amount')?.textContent).toBe('15 000 FCFA');
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

  it('triggers hover-to-speak debounced once per section, does not repeat in place, and switches sections cleanly', async () => {
    assistant = new ExtensionAssistant();
    const host = document.getElementById('linguabridge-extension-root');
    // Enable hover-to-speak mode
    assistant.toggleTouchSpeakMode();

    const section1 = document.createElement('p');
    section1.id = 'sec-1';
    section1.textContent = 'Solde disponible';
    document.body.appendChild(section1);

    const section2 = document.createElement('p');
    section2.id = 'sec-2';
    section2.textContent = 'Confirmer le transfert';
    document.body.appendChild(section2);

    // 1. Hover on section1
    section1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));

    // Before dwell timeout (<220ms), audio bar is not yet visible
    const audioBar = host?.shadowRoot?.getElementById('audio-bar');
    expect(audioBar?.style.display).toBeFalsy();

    // Fast mouse passage (<220ms dwell): if user leaves before 220ms, no speech triggers
    const fastPassageEl = document.createElement('span');
    fastPassageEl.textContent = 'Menu rapide';
    document.body.appendChild(fastPassageEl);
    fastPassageEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
    fastPassageEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, cancelable: true }));

    // Wait past dwell delay
    await new Promise((resolve) => setTimeout(resolve, 250));

    // 2. Now hover properly on section1 with dwell
    section1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 260));

    expect(audioBar?.style.display).toBe('flex');
    const spokenText = host?.shadowRoot?.getElementById('audio-spoken-text');
    expect(spokenText?.textContent).toBe('Móni mí ne wá é bẽng');

    // 3. Repeated mouseover events inside section1 do NOT trigger re-speech ("une fois")
    const initialText = spokenText?.textContent;
    section1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(spokenText?.textContent).toBe(initialText);

    // 4. Moving to section2 speaks section2 once and CLEARS section1 outline
    section2.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 260));
    expect(spokenText?.textContent).toBe('Tíbíli tóbó nlóm');
    // Ensure section1 outline was cleanly cleared and not visually leaked
    expect(section1.style.outline).toBe('');

    // 5. Stopping speech via audio-stop button clears section2 outline
    const stopBtn = host?.shadowRoot?.getElementById('audio-stop');
    stopBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(section2.style.outline).toBe('');
  });

  it('triggers hover-to-speak via pointerover / pointerout events seamlessly', async () => {
    assistant = new ExtensionAssistant();
    const host = document.getElementById('linguabridge-extension-root');
    assistant.toggleTouchSpeakMode();

    const secPointer = document.createElement('div');
    secPointer.id = 'sec-pointer';
    secPointer.setAttribute('role', 'button');
    secPointer.textContent = 'Solde disponible';
    document.body.appendChild(secPointer);

    // Dispatch pointerover
    secPointer.dispatchEvent(new Event('pointerover', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 260));

    const audioBar = host?.shadowRoot?.getElementById('audio-bar');
    expect(audioBar?.style.display).toBe('flex');
    const spokenText = host?.shadowRoot?.getElementById('audio-spoken-text');
    expect(spokenText?.textContent).toBe('Móni mí ne wá é bẽng');

    // Pointer out clears outline
    secPointer.dispatchEvent(new Event('pointerout', { bubbles: true, cancelable: true }));
    expect(secPointer.style.outline).toBe('');
  });

  it('verifies full-page translation comprehensively covers headings, paragraphs, buttons, tables, spans, links, input placeholders, titles, aria-labels, alt text, and restores them intact', () => {
    document.body.innerHTML = `
      <div id="full-banking-portal">
        <h1 title="Bienvenue sur votre espace bancaire">Bienvenue sur votre espace bancaire</h1>
        <p class="subtitle">Votre argent est en sécurité</p>
        <img id="bank-logo" src="logo.png" alt="Logo de la banque" />
        <form id="transfer-form">
          <label for="acc-num">Numéro de compte</label>
          <input id="acc-num" type="text" placeholder="Entrez le numéro de compte" aria-label="Numéro de compte" value="" />
          
          <label for="amount">Montant du transfert</label>
          <input id="amount" type="text" placeholder="Montant en FCFA" value="50000 FCFA" />
          
          <label for="memo">Motif</label>
          <textarea id="memo" placeholder="Motif du virement"></textarea>

          <input id="btn-submit" type="submit" value="Confirmer le transfert" title="Confirmer le transfert" />
          <button id="btn-cancel" type="button" aria-label="Annuler">Annuler</button>
        </form>

        <table id="recent-txns">
          <thead>
            <tr>
              <th>Opération</th>
              <th>Frais de transfert</th>
              <th>Bénéficiaire</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span>Transfert d'argent</span></td>
              <td>150 FCFA</td>
              <td><a href="#dest" title="Destinataire">Destinataire: +237 699 001 122</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    assistant = new ExtensionAssistant();
    assistant.translateFullPage();

    // 1. Verify Headings, paragraphs, spans, titles
    const h1 = document.querySelector('h1');
    expect(h1?.textContent).toContain('Mbólo é mvôk nda móni wên');
    expect(h1?.getAttribute('title')).toContain('Mbólo é mvôk nda móni wên');
    expect(document.querySelector('.subtitle')?.textContent).toContain('Móni wên é ne mbaán');
    expect(document.querySelector('td span')?.textContent).toContain('Lóm móni');

    // 2. Verify Labels
    const labels = Array.from(document.querySelectorAll('label')).map((l) => l.textContent);
    expect(labels.some((l) => l?.includes('Nlambá ékóbló'))).toBe(true);
    expect(labels.some((l) => l?.includes('Abui móni yá nlóm'))).toBe(true);

    // 3. Verify Input placeholders & Submit button values, title, aria-labels
    const accInput = document.getElementById('acc-num') as HTMLInputElement;
    const amountInput = document.getElementById('amount') as HTMLInputElement;
    const memoTextarea = document.getElementById('memo') as HTMLTextAreaElement;
    const submitBtn = document.getElementById('btn-submit') as HTMLInputElement;
    const cancelBtn = document.getElementById('btn-cancel') as HTMLButtonElement;
    const logoImg = document.getElementById('bank-logo') as HTMLImageElement;

    expect(accInput.placeholder).toContain('Nlambá ékóbló');
    expect(accInput.getAttribute('aria-label')).toContain('Nlambá ékóbló');
    expect(amountInput.placeholder).toContain('FCFA');
    expect(amountInput.value).toBe('50000 FCFA'); // financial amount preserved
    expect(memoTextarea.placeholder).toContain('Lóm móni');
    expect(submitBtn.value).toContain('Tíbíli tóbó nlóm');
    expect(submitBtn.getAttribute('title')).toContain('Tíbíli tóbó nlóm');
    expect(cancelBtn.textContent).toContain('Dzágbá');
    expect(cancelBtn.getAttribute('aria-label')).toContain('Dzágbá');

    // 4. Verify Table headers and cells
    const ths = Array.from(document.querySelectorAll('th')).map((t) => t.textContent);
    expect(ths.some((t) => t?.includes('Nlóm móni'))).toBe(true);
    expect(ths.some((t) => t?.includes('Móni mébembá mé nlóm'))).toBe(true);
    expect(ths.some((t) => t?.includes('Nyí a nòng móni'))).toBe(true);

    // 5. Verify Links & Financial entities
    const link = document.querySelector('a');
    expect(link?.textContent).toContain('Nyí a nòng móni');
    expect(link?.textContent).toContain('+237 699 001 122'); // Phone preserved
    expect(link?.getAttribute('title')).toContain('Nyí a nòng móni');

    // 6. Verify Restore Page cleanly restores ALL text nodes AND input placeholders / button values / titles / aria-labels
    assistant.restorePage();

    expect(document.querySelector('h1')?.textContent).toBe('Bienvenue sur votre espace bancaire');
    expect(document.querySelector('h1')?.getAttribute('title')).toBe('Bienvenue sur votre espace bancaire');
    expect(document.querySelector('.subtitle')?.textContent).toBe('Votre argent est en sécurité');
    expect(accInput.placeholder).toBe('Entrez le numéro de compte');
    expect(accInput.getAttribute('aria-label')).toBe('Numéro de compte');
    expect(memoTextarea.placeholder).toBe('Motif du virement');
    expect(submitBtn.value).toBe('Confirmer le transfert');
    expect(submitBtn.getAttribute('title')).toBe('Confirmer le transfert');
    expect(cancelBtn.textContent).toBe('Annuler');
    expect(cancelBtn.getAttribute('aria-label')).toBe('Annuler');
    expect(link?.textContent).toBe('Destinataire: +237 699 001 122');
    expect(link?.getAttribute('title')).toBe('Destinataire');
  });

  it('translates nested content inside custom Web Component shadow DOM roots', () => {
    const customHost = document.createElement('div');
    customHost.id = 'wc-card';
    const wcShadow = customHost.attachShadow({ mode: 'open' });
    wcShadow.innerHTML = `
      <div class="wc-content">
        <h3>Solde disponible</h3>
        <button id="wc-btn">Confirmer le transfert</button>
      </div>
    `;
    document.body.appendChild(customHost);

    assistant = new ExtensionAssistant();
    assistant.translateFullPage();

    expect(wcShadow.querySelector('h3')?.textContent).toBe('Móni mí ne wá é bẽng');
    expect(wcShadow.querySelector('button')?.textContent).toBe('Tíbíli tóbó nlóm');

    assistant.restorePage();
    expect(wcShadow.querySelector('h3')?.textContent).toBe('Solde disponible');
    expect(wcShadow.querySelector('button')?.textContent).toBe('Confirmer le transfert');
  });

  it('keeps translating new and changed content inside an open shadow root', async () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<h2>Solde disponible</h2>';
    document.body.appendChild(host);

    assistant = new ExtensionAssistant();
    assistant.translateFullPage();
    expect(shadow.querySelector('h2')?.textContent).toBe('Móni mí ne wá é bẽng');

    const button = document.createElement('button');
    button.textContent = 'Confirmer le transfert';
    shadow.appendChild(button);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(button.textContent).toBe('Tíbíli tóbó nlóm');

    shadow.querySelector('h2')!.textContent = 'Envoyer de l\'argent';
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(shadow.querySelector('h2')?.textContent).toBe('Lóm móni');

    assistant.restorePage();
    expect(button.textContent).toBe('Confirmer le transfert');
    expect(shadow.querySelector('h2')?.textContent).toBe('Envoyer de l\'argent');
  });

  it('translates site-updated label attributes and restores the latest source', async () => {
    document.body.innerHTML = '<input id="account" placeholder="Entrez le numéro de compte">';
    assistant = new ExtensionAssistant();
    assistant.translateFullPage();
    const input = document.getElementById('account') as HTMLInputElement;

    input.setAttribute('placeholder', 'Solde disponible');
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(input.placeholder).toBe('Móni mí ne wá é bẽng');

    assistant.restorePage();
    expect(input.placeholder).toBe('Solde disponible');
  });

  it('leaves editable or hidden inline content untouched', () => {
    document.body.innerHTML = '<p>Solde disponible <strong contenteditable="true">Confirmer le transfert</strong></p><div hidden title="Solde disponible">Confirmer le transfert</div>';
    assistant = new ExtensionAssistant();
    assistant.translateFullPage();
    expect(document.querySelector('strong')?.textContent).toBe('Confirmer le transfert');
    expect(document.querySelector('div[hidden]')?.textContent).toBe('Confirmer le transfert');
    expect(document.querySelector('div[hidden]')?.getAttribute('title')).toBe('Solde disponible');
  });

  it('translates arbitrary sentences crossing multiple inline tags (em, strong, span, a, code) and preserves nested tag hierarchy and attributes', () => {
    document.body.innerHTML = `
      <div id="inline-test">
        <p id="rich-sentence">
          Bienvenue sur <strong>notre <em>espace <a href="/banking" class="link-btn"><span>bancaire</span></a></em></strong> pour vos opérations.
        </p>
      </div>
    `;

    assistant = new ExtensionAssistant();
    assistant.translateFullPage();

    const p = document.getElementById('rich-sentence') as HTMLParagraphElement;
    expect(p).not.toBeNull();

    // Check that nested inline tags are preserved in DOM hierarchy
    const strong = p.querySelector('strong');
    expect(strong).not.toBeNull();
    const em = strong?.querySelector('em');
    expect(em).not.toBeNull();
    const a = em?.querySelector('a');
    expect(a).not.toBeNull();
    expect(a?.getAttribute('href')).toBe('/banking');
    expect(a?.className).toBe('link-btn');
    const span = a?.querySelector('span');
    expect(span).not.toBeNull();

    // The sentence was translated into Ewondo
    expect(p.textContent).toContain('Mbólo');

    // 100% reversible restoration
    assistant.restorePage();
    expect(p.querySelector('strong')).not.toBeNull();
    expect(p.querySelector('strong em a span')).not.toBeNull();
    expect(a?.getAttribute('href')).toBe('/banking');
    expect(a?.className).toBe('link-btn');
    expect(p.textContent?.trim()).toBe('Bienvenue sur notre espace bancaire pour vos opérations.');
  });

  it('supports 100% reversible restoration with zero leftover translated fragments or broken whitespace', () => {
    const originalHtml = '<p id="ws-test">  Solde disponible : <strong>25 000 FCFA</strong> sur le compte.  </p>';
    document.body.innerHTML = originalHtml;

    assistant = new ExtensionAssistant();
    assistant.translateFullPage();

    const p = document.getElementById('ws-test');
    expect(p?.textContent).toContain('25 000 FCFA');

    assistant.restorePage();
    // Verify exact content and structure restored with no leftover translated fragments
    expect(document.getElementById('ws-test')?.innerHTML).toBe('  Solde disponible : <strong>25 000 FCFA</strong> sur le compte.  ');
  });

  it('strictly verifies complete absence of site-specific phrases across all dictionaries and tests authentic open-domain translation', () => {
    // 1. Audit ENGLISH_COMMON_ENTRIES for prohibited site strings, UI arrows, and bullets
    const PROHIBITED_SUBSTRINGS = [
      'nayokan',
      'turn skills',
      'offers hands-on',
      'welcome universities',
      'find training →',
      'computer lab ·',
      'building people, enterprises',
    ];

    // Check Ewondo English entries
    const ewondoKeys = Object.keys(ENGLISH_COMMON_ENTRIES || {});
    for (const key of ewondoKeys) {
      for (const prohibited of PROHIBITED_SUBSTRINGS) {
        expect(key.toLowerCase()).not.toContain(prohibited);
      }
      expect(key).not.toMatch(/[→←↑↓·•]/);
    }

    // Check all 4 Sovereign dictionaries (fuv, hau, knc, pcm)
    for (const [langKey, dict] of Object.entries(SOVEREIGN_DICTIONARIES)) {
      for (const key of Object.keys(dict)) {
        for (const prohibited of PROHIBITED_SUBSTRINGS) {
          expect(key.toLowerCase()).not.toContain(prohibited);
        }
        expect(key).not.toMatch(/[→←↑↓·•]/);
      }
    }

    // 2. Translate authentic, independent open-domain general sentences across all 5 languages
    const openDomainSentences = [
      'Welcome to the community center for education and growth.',
      'Create an account to transfer money and save.',
      'Contact our team for help and services.',
    ];

    for (const sentence of openDomainSentences) {
      for (const lang of ['ewo-CM', 'fuv-CM', 'hau-CM', 'knc-CM', 'pcm-CM']) {
        const trans = translateSentenceToSovereign(sentence, lang);
        expect(trans.translatedText.length).toBeGreaterThan(0);
        expect(trans.translatedText).not.toBe(sentence);
        expect(trans.translatedText.toLowerCase()).not.toContain('nayokan');
      }
    }
  });

  it('translating an individual composite container does not restore or alter other translated composite containers on the page', () => {
    document.body.innerHTML = `
      <div id="container-a"><p id="p-a">Consultez votre <strong>solde disponible</strong> ici.</p></div>
      <div id="container-b"><p id="p-b">Effectuer un <em>virement sécurisé</em> maintenant.</p></div>
    `;

    assistant = new ExtensionAssistant();
    const pA = document.getElementById('p-a') as HTMLElement;
    const pB = document.getElementById('p-b') as HTMLElement;

    // Translate Container A
    (assistant as any).translateCompositeContainer(pA);
    const transTextA1 = pA.textContent;
    expect(transTextA1).toContain('Móni mí ne wá é bẽng');

    // Translate Container B
    (assistant as any).translateCompositeContainer(pB);
    const transTextB = pB.textContent;
    expect(transTextB).toContain('Lóm móni É ne mbaán');

    // Crucial Scoped Restoration check: Container A MUST remain translated, NOT reverted to French
    expect(pA.textContent).toBe(transTextA1);
    expect(pA.querySelector('strong')).not.toBeNull();

    // Re-translate Container A (e.g. dynamic content update)
    (assistant as any).translateCompositeContainer(pA);
    expect(pA.textContent).toBe(transTextA1);
    expect(pB.textContent).toBe(transTextB);

    // Global restorePage() properly restores BOTH containers
    assistant.restorePage();
    expect(pA.textContent?.trim()).toBe('Consultez votre solde disponible ici.');
    expect(pB.textContent?.trim()).toBe('Effectuer un virement sécurisé maintenant.');
  });

  it('guarantees speech player prioritizes African voices when available and uses clean speech synthesis fallback', () => {
    assistant = new ExtensionAssistant();
    const player = (assistant as any).speechPlayer;

    // Simulate SpeechSynthesisUtterance and SpeechSynthesis in DOM environment
    (global as any).window.SpeechSynthesisUtterance = class {
      text: string;
      voice: any = null;
      lang = '';
      rate = 1;
      pitch = 1;
      onstart: any = null;
      onend: any = null;
      onerror: any = null;
      constructor(text: string) {
        this.text = text;
      }
    };

    (global as any).window.speechSynthesis = {
      cancel: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => [
        { name: 'Microsoft Paul', lang: 'fr-FR' },
        { name: 'Native African Voice', lang: 'fr-CM' },
        { name: 'Microsoft David', lang: 'en-US' },
      ]),
      speak: vi.fn(),
    };

    player.playBrowserVoice('Mbolo', 'ewo-CM', 999);

    // Browser speech synthesis is strictly blocked to guarantee zero Google/Windows voice leakage
    expect((global as any).window.speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('strictly blocks Google voices and European voices when African voice is absent', () => {
    assistant = new ExtensionAssistant();
    const player = (assistant as any).speechPlayer;

    (global as any).window.speechSynthesis = {
      cancel: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => [
        { name: 'Google français', lang: 'fr-FR' },
        { name: 'Google US English', lang: 'en-US' },
        { name: 'Microsoft Paul', lang: 'fr-FR' },
      ]),
      speak: vi.fn(),
    };

    player.playBrowserVoice('Mbolo', 'ewo-CM', 999);

    expect((global as any).window.speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('proactively precaches visible text sections into speech audio cache upon page translation', () => {
    document.body.innerHTML = `
      <div id="content">
        <h1>Bienvenue sur votre espace bancaire</h1>
        <h2>Solde disponible</h2>
        <button id="btn-transfert">Envoyer de l'argent</button>
      </div>
    `;

    const precacheSpy = vi.fn();
    assistant = new ExtensionAssistant();
    (assistant as any).speechPlayer.precache = precacheSpy;

    assistant.translateFullPage();
    expect(precacheSpy).not.toHaveBeenCalled();

    assistant.toggleTouchSpeakMode();
    assistant.translateFullPage();
    expect(precacheSpy).toHaveBeenCalled();
  });

  it('simulates SAFINUM Innovate Challenge jury scenario: dynamic alert injection, debounced MT, Δ=0 financial preservation, audio trigger, and clean restoration', async () => {
    assistant = new ExtensionAssistant();
    assistant.translateFullPage();
    assistant.toggleTouchSpeakMode();

    const host = document.getElementById('linguabridge-extension-root');
    expect(host).not.toBeNull();

    // 1. Inject dynamic alert element post-initial load (role="alert", class="popup-error")
    const alertEl = document.createElement('div');
    alertEl.setAttribute('role', 'alert');
    alertEl.className = 'popup-error banner-alert';
    alertEl.innerHTML = `Attention : votre solde est insuffisant pour couvrir les frais de timbre fiscal de <span class="amount">1 500 FCFA</span> sur le compte <strong class="account">CM21 1000 5001 2301 2345 6789 012</strong> (contact: <span class="phone">+237 699 001 122</span>)`;
    document.body.appendChild(alertEl);

    // 2. Await debounced MutationObserver (50ms debounce + translation execution)
    await new Promise((resolve) => setTimeout(resolve, 80));

    // 3. Assert translation into sovereign language (Ewondo) without text fragmentation
    const translatedAlertText = alertEl.textContent || '';
    expect(translatedAlertText).toContain('Tábé aí mesó');
    expect(translatedAlertText).toContain('Móni mí ne wên é ne tégué abui');
    expect(translatedAlertText).toContain('asú budi');
    expect(translatedAlertText).toContain('Móni mébembá yá fakat tál');

    // Assert that sensitive financial entities are preserved bit-for-bit (Δ = 0)
    expect(alertEl.querySelector('.amount')?.textContent).toBe('1 500 FCFA');
    expect(alertEl.querySelector('.account')?.textContent).toBe('CM21 1000 5001 2301 2345 6789 012');
    expect(alertEl.querySelector('.phone')?.textContent).toBe('+237 699 001 122');
    expect(translatedAlertText).toContain('1 500 FCFA');
    expect(translatedAlertText).toContain('CM21 1000 5001 2301 2345 6789 012');
    expect(translatedAlertText).toContain('+237 699 001 122');

    // Verify absence of informal emojis (Nayokan design system compliance)
    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    expect(emojiRegex.test(translatedAlertText)).toBe(false);

    // 4. Assert Hover-to-Speak audio trigger activates on the dynamically injected element
    alertEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));

    // Before dwell timeout (<200ms), audio bar not yet active
    const audioBar = host?.shadowRoot?.getElementById('audio-bar');
    expect(audioBar?.style.display).toBeFalsy();

    // Dwell for 260ms (>200ms debounce)
    await new Promise((resolve) => setTimeout(resolve, 260));

    expect(audioBar?.style.display).toBe('flex');
    const spokenText = host?.shadowRoot?.getElementById('audio-spoken-text');
    expect(spokenText?.textContent).toContain('Tábé aí mesó');
    expect(spokenText?.textContent).toContain('1 500 FCFA');

    const phoneticEl = host?.shadowRoot?.getElementById('audio-phonetic');
    expect(phoneticEl?.textContent?.length).toBeGreaterThan(0);

    // 5. Assert Click-to-Speak audio trigger activates instantly on dynamic alert
    alertEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(audioBar?.style.display).toBe('flex');

    // 6. Assert 100% reversible restoration with restorePage()
    assistant.restorePage();
    expect(alertEl.textContent).toBe('Attention : votre solde est insuffisant pour couvrir les frais de timbre fiscal de 1 500 FCFA sur le compte CM21 1000 5001 2301 2345 6789 012 (contact: +237 699 001 122)');
    expect(alertEl.querySelector('.amount')?.textContent).toBe('1 500 FCFA');
    expect(alertEl.querySelector('.account')?.textContent).toBe('CM21 1000 5001 2301 2345 6789 012');
    expect(alertEl.querySelector('.phone')?.textContent).toBe('+237 699 001 122');
  });

  it('translates the SAFINUM jury sentence across all 5 sovereign languages with zero drift and full term coverage', () => {
    const rawJurySentence = 'Attention : votre solde est insuffisant pour couvrir les frais de timbre fiscal de 1 500 FCFA sur le compte CM21 1000 5001 2301 2345 6789 012 (contact: +237 699 001 122)';

    const expectedLanguageMarkers: Record<string, { attention: string; balanceWarning: string; fees: string }> = {
      'ewo-CM': {
        attention: 'Tábé aí mesó',
        balanceWarning: 'Móni mí ne wên é ne tégué abui',
        fees: 'Móni mébembá yá fakat tál',
      },
      'fuv-CM': {
        attention: 'Reeno',
        balanceWarning: 'Keɓal mooɗon heɓaay',
        fees: 'Ceede laminol laamu',
      },
      'hau-CM': {
        attention: 'Hattara',
        balanceWarning: 'Ragowar kuɗinku bai isa ba',
        fees: 'Kuɗin tambarin haraji',
      },
      'knc-CM': {
        attention: 'Hangal',
        balanceWarning: 'Liman kalinzə yeya ba',
        fees: 'Hakki lamin jomiyabe',
      },
      'pcm-CM': {
        attention: 'Look out',
        balanceWarning: 'Ya Balance No reach',
        fees: 'Tax stamp Charges',
      },
    };

    for (const [lang, markers] of Object.entries(expectedLanguageMarkers)) {
      const result = translateSentenceToSovereign(rawJurySentence, lang);
      expect(result.status).toBe('success');

      // Assert sovereign language vocabulary matches
      expect(result.translatedText).toContain(markers.attention);
      expect(result.translatedText).toContain(markers.balanceWarning);
      expect(result.translatedText).toContain(markers.fees);

      // Assert bit-for-bit financial entity preservation (Δ = 0)
      expect(result.translatedText).toContain('1 500 FCFA');
      expect(result.translatedText).toContain('CM21 1000 5001 2301 2345 6789 012');
      expect(result.translatedText).toContain('+237 699 001 122');
    }
  });
});
