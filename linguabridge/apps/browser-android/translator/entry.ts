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
  let activeSettings: PageTranslationSettings = { enabled: false, source: 'auto' };
  const translator = createPageTranslator((status) => send('status', status));
  linguaBridgeNative.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.documentId !== documentId || !['auto', 'fr', 'en'].includes(message.source) ||
      !['ewo-CM', 'fuv-CM', 'hau-CM', 'knc-CM', 'pcm-CM'].includes(message.target)) return;
    started = true;
    activeSettings = { enabled: message.enabled === true, source: message.source, target: message.target };
    translator.configure(activeSettings);
  };
  send('ready');
  const handshake = window.setInterval(() => {
    if (started) window.clearInterval(handshake);
    else send('ready');
  }, 350);
  window.addEventListener('pagehide', () => translator.configure({ ...activeSettings, enabled: false }));
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) send('ready');
  });
}
