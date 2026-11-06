// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LinguaBridgeWidget } from '../widget';
import { ACTIVE_CAMEROON_LANGUAGES } from '../banking-engine';

describe('LinguaBridgeWidget & Sovereign Banking Assistant', () => {
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
              { code: 'dua-CM', name: 'Duala', packStatus: 'experimental' }, // Should be strictly filtered out!
              { code: 'ewo-CM', name: 'Ewondo' },
              { code: 'fuv-CM', name: 'Fulfulde' },
              { code: 'hau-CM', name: 'Haoussa' },
              { code: 'knc-CM', name: 'Kanuri' },
              { code: 'pcm-CM', name: 'Pidgin' },
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

  it('mounts into DOM with isolated shadow root and banking UI', () => {
    widget = LinguaBridgeWidget.init({ apiUrl: 'http://localhost:3001' });
    const host = document.querySelector('linguabridge-widget-host');
    expect(host).not.toBeNull();
    expect(host?.shadowRoot).toBeDefined();
    expect(host?.shadowRoot?.getElementById('toggle-widget')).not.toBeNull();
    expect(host?.shadowRoot?.getElementById('chat-input')).not.toBeNull();
    expect(host?.shadowRoot?.getElementById('chat-send')).not.toBeNull();
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
    expect(secondCallList[0].sourceText).toBe('Envoyer 5000 FCFA');

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

  it('strictly displays the 5 Cameroonian languages and excludes Duala from visible options', async () => {
    widget = LinguaBridgeWidget.init({ apiUrl: 'http://localhost:3001' });
    // Allow loadLanguages promise to settle
    await new Promise((r) => setTimeout(r, 10));

    const host = document.querySelector('linguabridge-widget-host');
    const select = host?.shadowRoot?.getElementById('lang-select') as HTMLSelectElement;
    expect(select).not.toBeNull();

    const options = Array.from(select.options).map((o) => o.value);

    // Verify all 5 active Cameroonian languages are present
    expect(options).toContain('ewo-CM');
    expect(options).toContain('fuv-CM');
    expect(options).toContain('hau-CM');
    expect(options).toContain('knc-CM');
    expect(options).toContain('pcm-CM');

    // STRICT INVARIANT: Duala MUST NOT be in visible options!
    const dualaOptions = options.filter((code) => code.toLowerCase().startsWith('dua'));
    expect(dualaOptions.length).toBe(0);
  });

  it('interactively sends banking questions and receives answers in Ewondo with AST Guard', async () => {
    widget = LinguaBridgeWidget.init({ apiUrl: 'http://localhost:3001', defaultTargetLang: 'ewo-CM' });
    const host = document.querySelector('linguabridge-widget-host');
    const input = host?.shadowRoot?.getElementById('chat-input') as HTMLInputElement;
    const sendBtn = host?.shadowRoot?.getElementById('chat-send') as HTMLButtonElement;

    input.value = "Comment envoyer de l'argent ?";
    sendBtn.click();

    const messages = widget.getChatMessages();
    expect(messages.length).toBeGreaterThanOrEqual(2);

    const lastBotMsg = messages[messages.length - 1];
    expect(lastBotMsg.sender).toBe('assistant');
    expect(lastBotMsg.lang).toBe('ewo-CM');
    // Ewondo response contains native terms (Virement, nloman móni)
    expect(lastBotMsg.text).toContain('nloman móni');
  });

  it('preserves exact monetary amounts and phone numbers without drift (AST Guard)', async () => {
    widget = LinguaBridgeWidget.init({ apiUrl: 'http://localhost:3001', defaultTargetLang: 'ewo-CM' });

    const resp = await widget.sendChatMessage('Comment envoyer 50 000 FCFA au 699123456 ?');
    expect(resp).not.toBeNull();
    expect(resp?.zeroDriftVerified).toBe(true);

    // Amounts and phone numbers must remain intact
    expect(resp?.text).toContain('50 000 FCFA');
    expect(resp?.text).toContain('699123456');

    const host = document.querySelector('linguabridge-widget-host');
    const chatHtml = host?.shadowRoot?.getElementById('chat-messages')?.innerHTML;
    expect(chatHtml).toContain('50 000 FCFA');
    expect(chatHtml).toContain('699123456');
    expect(chatHtml).toContain('Zéro Dérive');
  });

  it('answers banking questions accurately across all 5 Cameroonian languages', async () => {
    widget = LinguaBridgeWidget.init({ apiUrl: 'http://localhost:3001' });

    // 1. Fulfulde (fuv-CM)
    widget.setLanguage('fuv-CM');
    let resp = await widget.sendChatMessage('Quel est mon solde ?');
    expect(resp?.lang).toBe('fuv-CM');
    expect(resp?.text).toContain('Ceede maada heddiiɗe');

    // 2. Haoussa (hau-CM)
    widget.setLanguage('hau-CM');
    resp = await widget.sendChatMessage('Frais de retrait au distributeur');
    expect(resp?.lang).toBe('hau-CM');
    expect(resp?.text).toContain('Kudin cire kudi a ATM');

    // 3. Kanuri (knc-CM)
    widget.setLanguage('knc-CM');
    resp = await widget.sendChatMessage('Sécurité de mon compte');
    expect(resp?.lang).toBe('knc-CM');
    expect(resp?.text).toContain('Lafiya asusunəmye');

    // 4. Pidgin (pcm-CM)
    widget.setLanguage('pcm-CM');
    resp = await widget.sendChatMessage("Comment envoyer de l'argent ?");
    expect(resp?.lang).toBe('pcm-CM');
    expect(resp?.text).toContain('To send money');
  });

  it('triggers interactive voice speech synthesis when clicking speaker button', async () => {
    widget = LinguaBridgeWidget.init({ apiUrl: 'http://localhost:3001', defaultTargetLang: 'ewo-CM' });

    let speechDispatched = false;
    let spokenDetail: any = null;

    window.addEventListener('linguabridge:speak', (e: any) => {
      speechDispatched = true;
      spokenDetail = e.detail;
    });

    const host = document.querySelector('linguabridge-widget-host');
    const speakBtn = host?.shadowRoot?.querySelector('.speak-btn') as HTMLButtonElement;
    expect(speakBtn).not.toBeNull();

    speakBtn.click();

    expect(speechDispatched).toBe(true);
    expect(spokenDetail).not.toBeNull();
    expect(spokenDetail.lang).toBe('ewo-CM');
    expect(spokenDetail.phoneticText).toBeDefined();
  });

  it('translates attributes, composite containers with inline tags, and restores cleanly', async () => {
    document.body.innerHTML = `
      <div>
        <h1 id="title" title="Portail bancaire">Portail bancaire</h1>
        <p id="msg">Consultez votre <strong>solde disponible</strong> sur votre compte.</p>
        <input id="acc" type="text" placeholder="Numéro de compte" />
        <input id="submit" type="submit" value="Confirmer" />
        <img id="logo" src="logo.png" alt="Logo de sécurité" />
      </div>
    `;

    widget = LinguaBridgeWidget.init({ apiUrl: 'http://localhost:3001' });
    await widget.translatePage();

    const titleEl = document.getElementById('title');
    const msgEl = document.getElementById('msg');
    const accEl = document.getElementById('acc') as HTMLInputElement;
    const submitEl = document.getElementById('submit') as HTMLInputElement;
    const logoEl = document.getElementById('logo') as HTMLImageElement;

    // Translated checks
    expect(titleEl?.getAttribute('title')).toBe('En-Portail bancaire');
    expect(accEl.placeholder).toBe('En-Numéro de compte');
    expect(submitEl.value).toBe('En-Confirmer');
    expect(logoEl.getAttribute('alt')).toBe('En-Logo de sécurité');
    expect(msgEl?.innerHTML).toBe('En-Consultez votre <strong>solde disponible</strong> sur votre compte.');

    // Restoration
    widget.restoreOriginalPage();
    expect(titleEl?.getAttribute('title')).toBe('Portail bancaire');
    expect(accEl.placeholder).toBe('Numéro de compte');
    expect(submitEl.value).toBe('Confirmer');
    expect(logoEl.getAttribute('alt')).toBe('Logo de sécurité');
    expect(msgEl?.innerHTML).toBe('Consultez votre <strong>solde disponible</strong> sur votre compte.');
  });
});
