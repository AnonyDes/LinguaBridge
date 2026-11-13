import { LinguaBridgeClient } from '@linguabridge/sdk-js';
import { translateLocalText, getEwondoPhonetic } from '@linguabridge/translation-engine';
import { AfricanVoiceProvider } from '@linguabridge/speech-engine';

const client = new LinguaBridgeClient({
  baseUrl: 'http://localhost:3001',
});

const africanVoiceProvider = new AfricanVoiceProvider();
const audioPayloadCache = new Map<string, { audioBase64: string; engine: string }>();
const DEFAULT_API_BASE_URL = 'https://api-production-72bac574.up.railway.app';

class SpeechSetupError extends Error {}

function speechFailureMessage(error: unknown): string {
  if (error instanceof SpeechSetupError) return error.message;
  const status = Number((error as { statusCode?: number })?.statusCode);
  if (status === 401) return 'Clé LinguaBridge absente ou invalide. Ouvrez la fenêtre de l’extension et enregistrez le serveur.';
  if (status === 403) return 'La clé LinguaBridge ne permet pas la synthèse vocale.';
  if (status === 408) return 'La voix a dépassé le délai. Réessayez sur une phrase courte.';
  if (status === 422) return 'La voix est indisponible pour cette langue ou ce passage.';
  if (status === 429) return 'Limite de requêtes vocales atteinte. Réessayez plus tard.';
  if (status === 0) return 'Connexion au serveur vocal impossible. Vérifiez Internet et l’autorisation Chrome.';
  if (status >= 500) return 'Le serveur vocal est temporairement indisponible.';
  return 'Réponse vocale invalide ou service local indisponible.';
}

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
    if (message.type === 'ENHANCED_TRANSLATE_BATCH') {
      const items = Array.isArray(message.items) ? message.items.slice(0, 20) : [];
      if (!items.length || items.some((item: any) => !item || typeof item.text !== 'string' ||
        item.text.length > 2000 || !['fr', 'en'].includes(item.sourceLang) ||
        !['ewo-CM', 'fuv-CM', 'hau-CM', 'knc-CM', 'pcm-CM'].includes(item.targetLang))) {
        sendResponse({ success: false, error: 'Invalid page translation batch' });
        return;
      }
      chrome.storage.local.get(['linguabridgeEnhancedTranslation', 'linguabridgeApiBaseUrl', 'linguabridgeApiKey'], async (settings) => {
        if (settings.linguabridgeEnhancedTranslation !== true) {
          sendResponse({ success: false, error: 'Enhanced translation disabled' });
          return;
        }
        const configured = String(settings.linguabridgeApiBaseUrl || 'http://localhost:3001').replace(/\/$/, '');
        let url: URL;
        try { url = new URL(configured); } catch {
          sendResponse({ success: false, error: 'Invalid API URL' });
          return;
        }
        if (url.protocol !== 'https:' && !(url.protocol === 'http:' &&
          ['localhost', '127.0.0.1'].includes(url.hostname))) {
          sendResponse({ success: false, error: 'API URL requires HTTPS' });
          return;
        }
        try {
          const pageClient = new LinguaBridgeClient({ baseUrl: configured, apiKey: settings.linguabridgeApiKey,
            timeout: 15000, maxRetries: 0 });
          const results = await pageClient.translateBatch(items.map((item: any) => ({
            sourceText: item.text, sourceLang: item.sourceLang, targetLang: item.targetLang,
            domain: 'financial', privacyPolicy: 'allow_external', providerPreference: 'openrouter', maxLatencyMs: 15000,
          })));
          sendResponse({ success: true, results });
        } catch {
          sendResponse({ success: false, error: 'Translation service unavailable' });
        }
      });
      return true;
    }
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
              speechAvailable: false,
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
              speechAvailable: false,
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
              { code: 'ewo-CM', name: 'Ewondo (Langue Maternelle)', nativeName: 'Kóbɔ́ Ewondo', speechAvailable: false, packStatus: 'production_approved', isAvailable: true },
              { code: 'fuv-CM', name: 'Fulfulde / Peul', nativeName: 'Pulaar / Fulfulde', speechAvailable: false, packStatus: 'production_approved', isAvailable: true },
              { code: 'hau-CM', name: 'Haoussa', nativeName: 'Harshen Hausa', speechAvailable: false, packStatus: 'production_approved', isAvailable: true },
              { code: 'knc-CM', name: 'Kanuri', nativeName: 'Kànurí', speechAvailable: false, packStatus: 'production_approved', isAvailable: true },
              { code: 'pcm-CM', name: 'Cameroon Pidgin', nativeName: 'Kamtok', speechAvailable: false, packStatus: 'production_approved', isAvailable: true },
              { code: 'fr', name: 'Français', nativeName: 'Français', speechAvailable: false, packStatus: 'production_approved', isAvailable: true },
              { code: 'en', name: 'English', nativeName: 'English', speechAvailable: false, packStatus: 'production_approved', isAvailable: true },
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

      chrome.storage.local.get(['linguabridgeApiBaseUrl', 'linguabridgeApiKey'])
        .then(async (settings) => {
          const configured = String(settings.linguabridgeApiBaseUrl || DEFAULT_API_BASE_URL).trim().replace(/\/$/, '');
          let apiUrl: URL;
          try { apiUrl = new URL(configured); } catch {
            throw new SpeechSetupError('Adresse du serveur vocal invalide. Enregistrez le serveur dans la fenêtre de l’extension.');
          }
          const remote = apiUrl.protocol === 'https:';
          const local = apiUrl.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(apiUrl.hostname);
          if (!remote && !local) throw new SpeechSetupError('Le serveur vocal doit utiliser HTTPS ou localhost.');
          if (remote) {
            if (!String(settings.linguabridgeApiKey || '').trim()) {
              throw new SpeechSetupError('Clé LinguaBridge manquante. Ouvrez l’extension et cliquez sur « Enregistrer le serveur ».');
            }
            const permitted = await chrome.permissions.contains({ origins: [`${apiUrl.origin}/*`] });
            if (!permitted) {
              throw new SpeechSetupError('Accès au serveur non autorisé dans Chrome. Ouvrez l’extension et cliquez sur « Enregistrer le serveur ».');
            }
          }
          const cacheKey = `${remote ? configured : 'local'}:${normLang}:${text.trim()}`;
          const cached = audioPayloadCache.get(cacheKey);
          if (cached) return { ...cached, lang };
          const data = remote
            ? (await new LinguaBridgeClient({ baseUrl: configured, apiKey: settings.linguabridgeApiKey,
              timeout: 30000, maxRetries: 0 }).synthesizeSpeech({ text, lang: normLang }) as any).data
            : await tryFetch('http://127.0.0.1:3002').catch(() => tryFetch('http://localhost:3002'));
          if (typeof data?.audioBase64 !== 'string' || data.audioBase64.length <= 60 ||
            data.lang?.toLowerCase() !== normLang ||
            !['meta-mms-neural-live', 'openrouter-gemini-tts', 'openrouter-gemini-tts-experimental'].includes(data.engine)) {
            throw new Error('Missing audio for the requested language');
          }
          if (audioPayloadCache.size < 40 && data.audioBase64.length <= 400000) {
            audioPayloadCache.set(cacheKey, { audioBase64: data.audioBase64, engine: data.engine });
          }
          return data;
        })
        .then((data) => {
          sendResponse({
            success: true,
            result: {
              available: true,
              lang,
              audioBase64: data.audioBase64,
              audioUrl: `data:audio/wav;base64,${data.audioBase64}`,
              engine: data.engine,
            },
          });
        })
        .catch((error: unknown) => {
          sendResponse({ success: false, error: speechFailureMessage(error) });
        });

      return true;
    }
  });
}

export { client };
