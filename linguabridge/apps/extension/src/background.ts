import { LinguaBridgeClient } from '@linguabridge/sdk-js';
import { translateLocalText, getEwondoPhonetic } from '@linguabridge/translation-engine';

const client = new LinguaBridgeClient({
  baseUrl: 'http://localhost:3001',
});

// Setup context menus
if (typeof chrome !== 'undefined' && chrome.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus?.create({
      id: 'linguabridge-translate-selection',
      title: 'Traduire "%s" en langue maternelle',
      contexts: ['selection'],
    });
  });

  chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'linguabridge-translate-selection' && info.selectionText && tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'CONTEXT_MENU_TRANSLATE',
        text: info.selectionText,
      });
    }
  });
}

// Background message dispatcher supporting all 5 Sovereign Cameroonian Languages
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const targetLang = message.targetLang || 'ewo-CM';
    const isEwondo = targetLang.includes('ewo');
    const local = (text: string, sourceLang?: string) =>
      translateLocalText(text, sourceLang || (isEwondo ? 'fr' : 'en'), targetLang);

    if (message.type === 'TRANSLATE_TEXT') {
      client
        .translate({
          text: message.text,
          sourceLang: message.sourceLang || (isEwondo ? 'fr' : 'en'),
          targetLang,
          domain: message.domain || 'financial',
        })
        .then((result) => {
          if (!result.translatedText || result.translatedText === message.text) {
            const localRes = local(message.text, message.sourceLang);
            sendResponse({
              success: true,
              result: {
                ...result,
                translatedText: localRes.translatedText,
                status: localRes.status,
                phonetic: isEwondo ? getEwondoPhonetic(localRes.translatedText) : undefined,
              },
            });
            return;
          }
          sendResponse({
            success: true,
            result: {
              ...result,
              phonetic: isEwondo ? getEwondoPhonetic(result.translatedText) : undefined,
            },
          });
        })
        .catch(() => {
          // Autonomous offline / fallback execution across all 5 languages
          const localRes = local(message.text, message.sourceLang);
          sendResponse({
            success: true,
            result: {
              id: `local-${Date.now()}`,
              originalText: message.text,
              translatedText: localRes.translatedText,
              sourceLang: message.sourceLang || (isEwondo ? 'fr' : 'en'),
              targetLang,
              provider: 'sovereign-lexicon',
              status: localRes.status,
              cacheStatus: 'miss',
              warnings: localRes.warnings,
              latencyMs: 1,
              speechAvailable: true,
              phonetic: isEwondo ? getEwondoPhonetic(localRes.translatedText) : undefined,
            },
          });
        });
      return true; // Keep message channel open for async response
    }

    if (message.type === 'TRANSLATE_BATCH') {
      client
        .translateBatch(message.items)
        .then((results) => {
          const processed = results.map((r, idx) => {
            const item = message.items[idx];
            if (!r.translatedText || r.translatedText === item?.text) {
              const localRes = local(item?.text || '', item?.sourceLang);
              return {
                ...r,
                translatedText: localRes.translatedText,
                status: localRes.status,
                phonetic: isEwondo ? getEwondoPhonetic(localRes.translatedText) : undefined,
              };
            }
            return {
              ...r,
              phonetic: isEwondo ? getEwondoPhonetic(r.translatedText) : undefined,
            };
          });
          sendResponse({ success: true, results: processed });
        })
        .catch(() => {
          // Autonomous offline fallback execution across all 5 languages
          const results = message.items.map((item: any, idx: number) => {
            const localRes = local(item.text, item.sourceLang);
            return {
              id: `local-batch-${idx}`,
              originalText: item.text,
              translatedText: localRes.translatedText,
              sourceLang: item.sourceLang || (isEwondo ? 'fr' : 'en'),
              targetLang: item.targetLang || targetLang,
              provider: 'sovereign-lexicon',
              status: localRes.status,
              cacheStatus: 'miss',
              warnings: localRes.warnings,
              latencyMs: 1,
              speechAvailable: true,
              phonetic: isEwondo ? getEwondoPhonetic(localRes.translatedText) : undefined,
            };
          });
          sendResponse({ success: true, results });
        });
      return true;
    }

    if (message.type === 'GET_LANGUAGES') {
      client
        .getLanguages()
        .then((languages) => sendResponse({ success: true, languages }))
        .catch(() => {
          sendResponse({
            success: true,
            languages: [
              { code: 'ewo-CM', name: 'Ewondo (Langue Maternelle)', nativeName: 'Kóbɔ́ Ewondo', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
              { code: 'fuv-CM', name: 'Fulfulde / Peul', nativeName: 'Pulaar / Fulfulde', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
              { code: 'hau-CM', name: 'Haoussa', nativeName: 'Harshen Hausa', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
              { code: 'knc-CM', name: 'Kanuri', nativeName: 'Kànurí', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
              { code: 'pcm-CM', name: 'Cameroon Pidgin', nativeName: 'Kamtok', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
              { code: 'fr', name: 'Français', nativeName: 'Français', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
              { code: 'en', name: 'English', nativeName: 'English', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
            ],
          });
        });
      return true;
    }
  });
}

export { client };
