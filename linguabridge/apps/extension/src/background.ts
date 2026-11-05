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
      title: 'Traduire "%s" en langue maternelle (Ewondo)',
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

// Background message dispatcher
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const targetLang = message.targetLang || 'ewo-CM';
    const isEwondo = targetLang.includes('ewo');
    const local = (text: string, sourceLang?: string) => translateLocalText(text, sourceLang || (isEwondo ? 'fr' : 'en'), targetLang);

    if (message.type === 'TRANSLATE_TEXT' && !isEwondo) {
      const result = local(message.text, message.sourceLang);
      sendResponse({ success: true, result: { ...result, originalText: message.text, sourceLang: message.sourceLang || 'en', targetLang, provider: 'duala-research-exact', speechAvailable: false } });
      return false;
    }
    if (message.type === 'TRANSLATE_BATCH' && !isEwondo) {
      sendResponse({ success: true, results: message.items.map((item: any) => ({ ...local(item.text, item.sourceLang), originalText: item.text, sourceLang: item.sourceLang || 'en', targetLang, provider: 'duala-research-exact', speechAvailable: false })) });
      return false;
    }

    if (message.type === 'TRANSLATE_TEXT') {
      client
        .translate({
          text: message.text,
          sourceLang: message.sourceLang || 'fr',
          targetLang: message.targetLang || 'ewo-CM',
          domain: message.domain || 'financial',
        })
        .then((result) => {
          if ((!result.translatedText || result.translatedText === message.text) && isEwondo) {
            const localTrans = local(message.text, message.sourceLang).translatedText;
            sendResponse({
              success: true,
              result: {
                ...result,
                translatedText: localTrans,
                status: local(message.text, message.sourceLang).status,
                phonetic: getEwondoPhonetic(localTrans),
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
          // Autonomous offline / fallback execution
          const trans = isEwondo ? local(message.text, message.sourceLang).translatedText : message.text;
          sendResponse({
            success: true,
            result: {
              id: `local-${Date.now()}`,
              originalText: message.text,
              translatedText: trans,
              sourceLang: message.sourceLang || 'fr',
              targetLang: message.targetLang || 'ewo-CM',
              provider: isEwondo ? 'ewondo-lexicon' : 'duala-research-exact',
              status: isEwondo && trans !== message.text ? 'success' : 'unverified',
              cacheStatus: 'miss',
              warnings: local(message.text, message.sourceLang).warnings,
              latencyMs: 1,
              speechAvailable: true,
              phonetic: isEwondo ? getEwondoPhonetic(trans) : undefined,
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
            if ((!r.translatedText || r.translatedText === message.items[idx]?.text) && isEwondo) {
              const trans = local(message.items[idx]?.text || '', message.items[idx]?.sourceLang).translatedText;
              return {
                ...r,
                translatedText: trans,
                status: local(message.items[idx]?.text || '', message.items[idx]?.sourceLang).status,
                phonetic: getEwondoPhonetic(trans),
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
          // Autonomous offline / fallback execution for batch
          const results = message.items.map((item: any, idx: number) => {
            const trans = isEwondo ? local(item.text, item.sourceLang).translatedText : item.text;
            return {
              id: `local-batch-${idx}`,
              originalText: item.text,
              translatedText: trans,
              sourceLang: item.sourceLang || 'fr',
              targetLang: item.targetLang || 'ewo-CM',
              provider: isEwondo ? 'ewondo-lexicon' : 'duala-research-exact',
              status: isEwondo && trans !== item.text ? 'success' : 'unverified',
              cacheStatus: 'miss',
              warnings: local(item.text, item.sourceLang).warnings,
              latencyMs: 1,
              speechAvailable: true,
              phonetic: isEwondo ? getEwondoPhonetic(trans) : undefined,
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
              { code: 'dua-CM', name: 'Duala (recherche expérimentale)', nativeName: 'Duala', speechAvailable: false, packStatus: 'unverified', isAvailable: false },
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
