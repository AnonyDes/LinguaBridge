import { LinguaBridgeClient } from '@linguabridge/sdk-js';
import { translateLocalText, getEwondoPhonetic } from '@linguabridge/translation-engine';
import { AfricanVoiceProvider } from '@linguabridge/speech-engine';

const client = new LinguaBridgeClient({
  baseUrl: 'http://localhost:3001',
});

const africanVoiceProvider = new AfricanVoiceProvider();

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

    if (message.type === 'SYNTHESIZE_SPEECH') {
      const text = message.text || '';
      const lang = message.lang || targetLang;
      console.log(`[LinguaBridge SW] SYNTHESIZE_SPEECH request: lang=${lang}, text="${text.substring(0, 40)}"`);

      // Direct ultra-fast fetch to running Python neural voice server
      const tryFetch = async (host: string) => {
        const url = `${host}/synthesize?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json() as any;
        if (!data || !data.audioBase64) throw new Error('Missing audio payload');
        return data;
      };

      tryFetch('http://127.0.0.1:3002')
        .catch(() => tryFetch('http://localhost:3002'))
        .then((data) => {
          console.log(`[LinguaBridge SW] Synthesized neural audio successfully (${data.audioBase64.length} b64 chars)`);
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
        .catch((fetchErr) => {
          console.warn('[LinguaBridge SW] Microservice port 3002 fetch failed, trying provider:', fetchErr?.message);
          africanVoiceProvider
            .synthesize(text, lang, message.options)
            .then((result) => {
              sendResponse({ success: true, result });
            })
            .catch((err) => {
              console.error('[LinguaBridge SW] Speech synthesis failed completely:', err?.message);
              sendResponse({ success: false, error: err?.message || 'Speech synthesis failed' });
            });
        });

      return true;
    }
  });
}

export { client };
