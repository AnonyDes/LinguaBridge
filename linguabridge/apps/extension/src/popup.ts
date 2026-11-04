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

  // Robust tab messenger with dynamic script injection fallback
  async function sendMessageToActiveTab(message: any) {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    try {
      await chrome.tabs.sendMessage(tab.id, message);
      window.close();
    } catch {
      // Content script may not be injected yet (e.g. tab opened before extension load)
      if ((chrome as any).scripting) {
        try {
          await (chrome as any).scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
          });
          setTimeout(async () => {
            try {
              await chrome.tabs.sendMessage(tab.id!, message);
            } catch (_) {}
            window.close();
          }, 150);
        } catch (_) {
          window.close();
        }
      } else {
        window.close();
      }
    }
  }

  // Trigger page translation in active tab
  triggerPageBtn?.addEventListener('click', () => {
    sendMessageToActiveTab({ type: 'POPUP_TRANSLATE_PAGE', targetLang: 'ewo-CM' });
  });

  // Toggle touch-to-listen mode in active tab
  triggerSpeakBtn?.addEventListener('click', () => {
    sendMessageToActiveTab({ type: 'POPUP_TOGGLE_TOUCH_SPEAK' });
  });
});
