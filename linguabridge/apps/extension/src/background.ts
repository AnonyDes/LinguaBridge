import { LinguaBridgeClient } from '@linguabridge/sdk-js';
import { translateLocalText, getEwondoPhonetic } from '@linguabridge/translation-engine';
import { AfricanVoiceProvider } from '@linguabridge/speech-engine';

const client = new LinguaBridgeClient({
  baseUrl: 'http://localhost:3001',
});

const africanVoiceProvider = new AfricanVoiceProvider();
const audioPayloadCache = new Map<string, string>();

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
    if (message.type === 'BROADCAST_PAGE_ACTION' && _sender.tab?.id) {
      const action = message.action === 'restore' ? 'POPUP_RESTORE_PAGE' : 'POPUP_TRANSLATE_PAGE';
      chrome.tabs.sendMessage(_sender.tab.id, { type: action, targetLang: message.targetLang })
        .then(() => sendResponse({ success: true }))
        .catch(() => sendResponse({ success: false }));
      return true;
    }
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
          if (result.status !== 'unsafe' && (!result.translatedText || result.translatedText === message.text)) {
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
            if (r.status !== 'unsafe' && (!r.translatedText || r.translatedText === item?.text)) {
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
              { code: 'knc-CM', name: 'Kanuri', nativeName: 'Kànurí', speechAvailable: false, packStatus: 'production_approved', isAvailable: true },
              { code: 'pcm-CM', name: 'Cameroon Pidgin', nativeName: 'Kamtok', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
              { code: 'fr', name: 'Français', nativeName: 'Français', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
              { code: 'en', name: 'English', nativeName: 'English', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
            ],
          });
        });
      return true;
    }

    if (message.type === 'SYNTHESIZE_SPEECH') {
      const text = message.text || '';
      const lang = message.lang || targetLang;
      const normLang = (lang || 'ewo-CM').trim().toLowerCase();
      if (!africanVoiceProvider.isLanguageSupported(normLang) || !text.trim() || text.length > 2000) {
        sendResponse({ success: false, error: 'Voice unavailable for this request' });
        return;
      }
      const cacheKey = `${normLang}:${text.trim()}`;

      // 1. FAST PATH (<1ms): Check background in-memory cache
      const cachedB64 = audioPayloadCache.get(cacheKey);
      if (cachedB64) {
        sendResponse({
          success: true,
          result: {
            available: true,
            lang,
            audioBase64: cachedB64,
            audioUrl: `data:audio/wav;base64,${cachedB64}`,
            engine: 'meta-mms-neural-live',
          },
        });
        return true;
      }

      // Direct ultra-fast fetch to running Python neural voice server
      const tryFetch = async (host: string) => {
        const r = await fetch(`${host}/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: normLang, text }),
          signal: AbortSignal.timeout(15000),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json() as any;
        if (typeof data?.audioBase64 !== 'string' || data.audioBase64.length <= 60 ||
          data.lang?.toLowerCase() !== normLang || data.engine !== 'meta-mms-neural-live') {
          throw new Error('Missing audio for the requested language');
        }
        return data;
      };

      tryFetch('http://127.0.0.1:3002')
        .catch(() => tryFetch('http://localhost:3002'))
        .then((data) => {
          if (audioPayloadCache.size < 40 && data.audioBase64.length <= 400000) {
            audioPayloadCache.set(cacheKey, data.audioBase64);
          }
          sendResponse({
            success: true,
            result: {
              available: true,
              lang,
              audioBase64: data.audioBase64,
              audioUrl: `data:audio/wav;base64,${data.audioBase64}`,
              engine: 'meta-mms-neural-live',
            },
          });
        })
        .catch(() => {
          sendResponse({ success: false, error: 'Neural voice service unavailable' });
        });

      return true;
    }
  });
}

export { client };
