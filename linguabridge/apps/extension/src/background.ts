import { LinguaBridgeClient } from '@linguabridge/sdk-js';
import { translateLocalText, getEwondoPhonetic } from '@linguabridge/translation-engine';
import { AfricanVoiceProvider } from '@linguabridge/speech-engine';

const client = new LinguaBridgeClient({
  baseUrl: 'http://localhost:3001',
});

const africanVoiceProvider = new AfricanVoiceProvider();

// Module-level audio payload cache so cached utterances persist across messages and tabs
const AUDIO_PAYLOAD_CACHE = new Map<string, string>();

// Setup context menus
if (typeof chrome !== 'undefined' && chrome.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus?.removeAll?.(() => {
      chrome.contextMenus?.create({
        id: 'linguabridge-translate-selection',
        title: 'Traduire "%s" en langue maternelle',
        contexts: ['selection'],
      });
      chrome.contextMenus?.create({
        id: 'linguabridge-disable-site',
        title: 'Désactiver LinguaBridge sur ce site',
        contexts: ['action'],
      });
      chrome.contextMenus?.create({
        id: 'linguabridge-enable-site',
        title: 'Réactiver LinguaBridge sur ce site',
        contexts: ['action'],
      });
    });
  });

  chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'linguabridge-translate-selection' && info.selectionText && tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'CONTEXT_MENU_TRANSLATE',
        text: info.selectionText,
      });
      return;
    }

    if ((info.menuItemId === 'linguabridge-disable-site' || info.menuItemId === 'linguabridge-enable-site') && tab?.url) {
      let host = '';
      try {
        const parsed = new URL(tab.url);
        host = parsed.hostname || parsed.origin;
      } catch {}
      if (!host) return;

      const disable = info.menuItemId === 'linguabridge-disable-site';
      const data = await chrome.storage.local.get(['linguabridgeDisabledHosts']);
      const list: string[] = Array.isArray(data.linguabridgeDisabledHosts) ? data.linguabridgeDisabledHosts : [];
      const nextList = disable ? Array.from(new Set([...list, host])) : list.filter((h) => h !== host);
      await chrome.storage.local.set({ linguabridgeDisabledHosts: nextList });

      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: disable ? 'POPUP_DISABLE_SITE' : 'POPUP_ENABLE_SITE',
            host,
          });
        } catch {}
      }
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
      const normLang = (lang || 'ewo-CM').trim().toLowerCase();
      const cacheKey = `${normLang}:${text.trim().toLowerCase()}`;
      console.log(`[LinguaBridge SW] SYNTHESIZE_SPEECH request: lang=${lang} (norm=${normLang}), text="${text.substring(0, 40)}"`);

      // 1. FAST PATH (<1ms): Check background in-memory cache
      const cachedB64 = AUDIO_PAYLOAD_CACHE.get(cacheKey);
      if (cachedB64) {
        console.log(`[LinguaBridge SW] Instant 0ms cache hit for "${text.substring(0, 30)}"`);
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

      // Direct ultra-fast fetch to running Python neural voice server, with Fastify API proxy fallback
      const tryDirectVoice = async (host: string) => {
        const url = `${host}/synthesize?lang=${encodeURIComponent(normLang)}&text=${encodeURIComponent(text)}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json() as any;
        if (!data || !data.audioBase64) throw new Error('Missing audio payload');
        return data.audioBase64 as string;
      };

      const tryApiSpeech = async (host: string) => {
        const r = await fetch(`${host}/v1/speech/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, lang: normLang }),
          signal: AbortSignal.timeout(10000),
        });
        if (!r.ok) throw new Error(`API HTTP ${r.status}`);
        const data = await r.json() as any;
        const b64 = data?.audioBase64 || (typeof data?.audioUrl === 'string' ? data.audioUrl.replace('data:audio/wav;base64,', '') : '');
        if (!data?.available || !b64) throw new Error(data?.unavailableReason || 'API voice unavailable');
        return b64;
      };

      tryDirectVoice('http://127.0.0.1:3002')
        .catch(() => tryDirectVoice('http://localhost:3002'))
        .catch(() => tryApiSpeech('http://127.0.0.1:3001'))
        .catch(() => tryApiSpeech('http://localhost:3001'))
        .then((audioBase64) => {
          console.log(`[LinguaBridge SW] Synthesized neural audio successfully (${audioBase64.length} b64 chars)`);
          if (AUDIO_PAYLOAD_CACHE.size < 600) {
            AUDIO_PAYLOAD_CACHE.set(cacheKey, audioBase64);
          }
          sendResponse({
            success: true,
            result: {
              available: true,
              lang,
              audioBase64,
              audioUrl: `data:audio/wav;base64,${audioBase64}`,
              engine: 'meta-mms-neural-live',
            },
          });
        })
        .catch((fetchErr) => {
          console.warn('[LinguaBridge SW] Microservice port 3002 & API 3001 fetch failed:', fetchErr?.message);
          // Absolute Zero-Noise Mandate: Stay silent if microservice unreachable
          sendResponse({ success: false, error: fetchErr?.message || 'Neural voice service unavailable' });
        });

      return true;
    }
  });
}

export { client };
