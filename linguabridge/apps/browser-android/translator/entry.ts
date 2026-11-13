import { createPageTranslator, type PageTranslationSettings } from '../../../packages/translation-engine/src/page-translator';

declare const linguaBridgeNative: {
  postMessage: (message: string) => void;
  onmessage: ((event: MessageEvent<string>) => void) | null;
};

if (window === window.top && location.protocol === 'https:' && typeof linguaBridgeNative !== 'undefined') {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const documentId = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const send = (type: string, status?: string) => {
    linguaBridgeNative.postMessage(JSON.stringify({ type, documentId, status }));
  };
  let started = false;
  let speechEnabled = false;
  let requestId = 0;
  const requests = new Map<number, (results: Array<string | null>) => void>();
  let activeSettings: PageTranslationSettings = { enabled: false, source: 'auto' };
  const translator = createPageTranslator((status) => send('status', status), (items) =>
    new Promise((resolve) => {
      const id = ++requestId;
      requests.set(id, resolve);
      linguaBridgeNative.postMessage(JSON.stringify({ type: 'translate', documentId, requestId: id, items }));
      window.setTimeout(() => {
        if (requests.delete(id)) resolve([]);
      }, 20000);
    }));
  linguaBridgeNative.onmessage = (event) => {
    let message: any;
    try { message = JSON.parse(event.data); } catch { return; }
    if (message.documentId === documentId && message.type === 'translationResult' &&
      Number.isSafeInteger(message.requestId) && Array.isArray(message.results)) {
      const resolve = requests.get(message.requestId);
      if (resolve) {
        requests.delete(message.requestId);
        resolve(message.results);
      }
      return;
    }
    if (message.documentId !== documentId || !['auto', 'fr', 'en'].includes(message.source) ||
      !['ewo-CM', 'fuv-CM', 'hau-CM', 'knc-CM', 'pcm-CM'].includes(message.target)) return;
    started = true;
    speechEnabled = message.speech === true;
    activeSettings = { enabled: message.enabled === true, source: message.source, target: message.target };
    translator.configure(activeSettings);
  };
  document.addEventListener('contextmenu', (event) => {
    if (!speechEnabled || !activeSettings.enabled ||
      !['hau-CM', 'fuv-CM'].includes(activeSettings.target || '') ||
      /(?:log[-_ ]?in|sign[-_ ]?in|auth|checkout|payment|wallet|dashboard)/i.test(location.pathname) ||
      document.querySelector('input[type="password"], [autocomplete^="cc-"], [data-linguabridge-private]')) return;
    const element = event.target;
    if (!(element instanceof Element) || element.closest('form, input, textarea, select, [contenteditable], [translate="no"], .notranslate')) return;
    const section = element.closest('p, h1, h2, h3, h4, li, blockquote, figcaption, button') || element;
    const text = section.textContent?.replace(/\s+/g, ' ').trim().slice(0, 240);
    if (!text || !/\p{L}/u.test(text)) return;
    event.preventDefault();
    linguaBridgeNative.postMessage(JSON.stringify({ type: 'speak', documentId, text, lang: activeSettings.target }));
  }, true);
  send('ready');
  const handshake = window.setInterval(() => {
    if (started) window.clearInterval(handshake);
    else send('ready');
  }, 350);
  window.addEventListener('pagehide', () => {
    translator.configure({ ...activeSettings, enabled: false });
    for (const resolve of requests.values()) resolve([]);
    requests.clear();
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) send('ready');
  });
}
