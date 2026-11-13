import { generateBankingResponse } from '../../../packages/widget/src/banking-engine';

type Message = { type: string; [key: string]: unknown };
const $ = (id: string) => document.getElementById(id);
const supported = new Set(['ewo-CM', 'fuv-CM', 'hau-CM', 'knc-CM', 'pcm-CM']);

async function activeTabMessage(message: Message): Promise<boolean> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return false;
  try {
    await chrome.tabs.sendMessage(tab.id, message);
    return true;
  } catch {
    try {
      const contentScript = chrome.runtime.getManifest().content_scripts?.[0]?.js?.[0];
      if (!contentScript) return false;
      await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: [contentScript] });
      await chrome.tabs.sendMessage(tab.id, message);
      return true;
    } catch { return false; }
  }
}
function showStatus(text: string) { const el = $('popup-status'); if (el) el.textContent = text; }
function showTab(tab: 'translate' | 'assistant') {
  for (const name of ['translate', 'assistant']) {
    $('tab-' + name)?.setAttribute('aria-selected', String(name === tab));
    const panel = $('panel-' + name);
    if (panel) panel.hidden = name !== tab;
  }
}
document.addEventListener('DOMContentLoaded', async () => {
  const select = $('popup-target-lang') as HTMLSelectElement;
  const toggle = $('btn-speech-toggle') as HTMLButtonElement;
  const saved = await chrome.storage.local.get(['linguabridgeTargetLang', 'linguabridgeAudioEnabled', 'linguabridgeAutoTranslate']);
  select.value = supported.has(saved.linguabridgeTargetLang) ? saved.linguabridgeTargetLang : 'ewo-CM';
  toggle.setAttribute('aria-checked', String(saved.linguabridgeAudioEnabled === true));
  if (saved.linguabridgeAutoTranslate === true) showStatus('Traduction automatique active. Les passages inconnus restent dans la langue source.');
  $('tab-translate')?.addEventListener('click', () => showTab('translate'));
  $('tab-assistant')?.addEventListener('click', () => showTab('assistant'));
  select.addEventListener('change', async () => {
    await chrome.storage.local.set({ linguabridgeTargetLang: select.value });
    await activeTabMessage({ type: 'POPUP_SET_TARGET_LANGUAGE', targetLang: select.value });
    showStatus('Langue enregistrée.');
  });
  $('btn-trigger-page')?.addEventListener('click', async () => {
    await chrome.storage.local.set({ linguabridgeAutoTranslate: true });
    const ok = await activeTabMessage({ type: 'POPUP_TRANSLATE_PAGE', targetLang: select.value });
    showStatus(ok ? 'Traduction activée pour les pages suivantes. Le lexique local peut laisser des passages inchangés.' : 'Traduction activée, mais cette page ne permet pas l’injection de l’extension.');
  });
  $('btn-restore-page')?.addEventListener('click', async () => {
    await chrome.storage.local.set({ linguabridgeAutoTranslate: false });
    const ok = await activeTabMessage({ type: 'POPUP_RESTORE_PAGE' });
    showStatus(ok ? 'Texte original restauré.' : 'Page non accessible.');
  });
  toggle.addEventListener('click', async () => {
    const enabled = toggle.getAttribute('aria-checked') !== 'true';
    await chrome.storage.local.set({ linguabridgeAudioEnabled: enabled });
    toggle.setAttribute('aria-checked', String(enabled));
    await activeTabMessage({ type: 'POPUP_SET_SPEECH', enabled });
    showStatus(enabled ? 'Lecture sur demande activée.' : 'Lecture désactivée.');
  });
  $('btn-stop-speech')?.addEventListener('click', async () => {
    await activeTabMessage({ type: 'POPUP_STOP_SPEECH' });
    showStatus('Lecture arrêtée.');
  });
  const log = $('chat-log')!;
  const input = $('chat-input') as HTMLInputElement;
  function addMessage(role: 'user' | 'assistant', text: string) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble ' + role;
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }
  function ask(text: string) {
    const question = text.trim();
    if (!question) return;
    addMessage('user', question);
    const response = generateBankingResponse(question, select.value);
    addMessage('assistant', response.text);
    input.value = '';
  }
  $('chat-form')?.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  document.querySelectorAll<HTMLButtonElement>('[data-question]').forEach(button => {
    button.addEventListener('click', () => ask(button.dataset.question || ''));
  });
});
