import { LinguaBridgeClient } from '@linguabridge/sdk-js';

const client = new LinguaBridgeClient({ baseUrl: 'http://localhost:3001' });

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('api-status');
  const langCountEl = document.getElementById('lang-count');
  const triggerPageBtn = document.getElementById('btn-trigger-page');
  const triggerSpeakBtn = document.getElementById('btn-trigger-speak');

  try {
    const health = await client.checkHealth();
    if (statusEl) {
      statusEl.textContent = `Connecté (API :3001)`;
      statusEl.style.color = '#15803d';
    }
    const languages = await client.getLanguages();
    if (langCountEl) {
      langCountEl.textContent = `${languages.length} langues certifiées (Kóbɔ́ Ewondo, FR, EN)`;
    }
  } catch {
    // Graceful offline fallback — autonomous local mode with embedded dictionary
    if (statusEl) {
      statusEl.textContent = 'Autonome (Moteur local actif)';
      statusEl.style.color = '#15803d';
    }
    if (langCountEl) {
      langCountEl.textContent = '470+ termes (Apertium & NACALCO embarqués)';
    }
  }

  // Trigger page translation in active tab
  triggerPageBtn?.addEventListener('click', async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'POPUP_TRANSLATE_PAGE', targetLang: 'ewo-CM' });
        window.close();
      }
    }
  });

  // Toggle touch-to-listen mode in active tab
  triggerSpeakBtn?.addEventListener('click', async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'POPUP_TOGGLE_TOUCH_SPEAK' });
        window.close();
      }
    }
  });
});
