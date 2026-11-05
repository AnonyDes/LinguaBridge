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
});
