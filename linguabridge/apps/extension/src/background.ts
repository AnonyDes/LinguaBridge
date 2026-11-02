import { LinguaBridgeClient } from '@linguabridge/sdk-js';

const client = new LinguaBridgeClient({
  baseUrl: 'http://localhost:3001',
});

// Setup context menus
if (typeof chrome !== 'undefined' && chrome.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus?.create({
      id: 'linguabridge-translate-selection',
      title: 'Translate "%s" with LinguaBridge',
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
    if (message.type === 'TRANSLATE_TEXT') {
      client
        .translate({
          text: message.text,
          sourceLang: message.sourceLang || 'fr',
          targetLang: message.targetLang || 'en',
          domain: message.domain || 'financial',
        })
        .then((result) => sendResponse({ success: true, result }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
    }

    if (message.type === 'TRANSLATE_BATCH') {
      client
        .translateBatch(message.items)
        .then((results) => sendResponse({ success: true, results }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }

    if (message.type === 'GET_LANGUAGES') {
      client
        .getLanguages()
        .then((languages) => sendResponse({ success: true, languages }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }
  });
}

export { client };
