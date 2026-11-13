import type { TranslationResult } from '@linguabridge/shared-types';
import { generateBankingResponse } from '../../../packages/widget/src/banking-engine';
import { translateLocalText, getEwondoPhonetic } from '@linguabridge/translation-engine';

function splitIntoAcousticClauses(text: string): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= 48) return [clean];

  const clauses: string[] = [];
  const parts = clean.split(/(?<=[.!?;:,])\s+/);
  let current = '';

  for (const part of parts) {
    if (!part) continue;
    const candidate = current ? `${current} ${part}` : part;
    if (candidate.length <= 48) {
      current = candidate;
    } else {
      if (current) clauses.push(current.trim());
      if (part.length <= 48) {
        current = part;
      } else {
        const words = part.split(/\s+/);
        let sub = '';
        for (const w of words) {
          const candSub = sub ? `${sub} ${w}` : w;
          if (candSub.length <= 45) {
            sub = candSub;
          } else {
            if (sub) clauses.push(sub.trim());
            sub = w;
          }
        }
        current = sub;
      }
    }
  }
  if (current && current.trim()) clauses.push(current.trim());
  return clauses.filter((c) => c.length > 0);
}

class AfricanSpeechPlayer {
  private isPlaying = false;
  private audioCtx: AudioContext | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private activeAudio: HTMLAudioElement | null = null;
  private onEndCallback: (() => void) | null = null;
  private currentUtteranceId = 0;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private audioBufferCache = new Map<string, AudioBuffer>();
  public onUnavailableCallback: ((reason: string) => void) | null = null;

  constructor() {
    this.prewarm();
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.ensureAudioContext();
      };
      window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
      window.addEventListener('click', unlock, { capture: true, passive: true });
      window.addEventListener('keydown', unlock, { capture: true, passive: true });
      window.addEventListener('touchend', unlock, { capture: true, passive: true });
    }
  }

  public prewarm(): void {
    if (typeof window === 'undefined') return;
    try {
      this.ensureAudioContext();
    } catch {
      // Ignored
    }
  }

  public ensureAudioContext(): void {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        if (!this.audioCtx) {
          this.audioCtx = new AudioCtxClass();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
      }
    } catch {
      // Ignored
    }
  }

  public isAudioContextSuspended(): boolean {
    return !this.audioCtx || this.audioCtx.state === 'suspended';
  }

  public speak(text: string, phonetic?: string, onEnd?: () => void, targetLang = 'ewo-CM'): void {
    if (typeof window === 'undefined') return;

    this.stop();
    this.currentUtteranceId++;
    const thisId = this.currentUtteranceId;
    this.onEndCallback = onEnd || null;

    const isEwondo = targetLang.startsWith('ewo');
    const spokenRaw = phonetic || (isEwondo ? getEwondoPhonetic(text) : text) || text;
    const spokenText = spokenRaw.replace(/-/g, '').trim();
    if (!spokenText) return;

    // Prime Web Audio context
    this.ensureAudioContext();

    const clauses = splitIntoAcousticClauses(spokenText);
    if (clauses.length <= 1) {
      this.playSingleClause(spokenText, thisId, targetLang, () => {
        this.finishUtterance(thisId);
      });
    } else {
      this.playClauseQueue(clauses, 0, thisId, targetLang);
    }
  }

  private playClauseQueue(
    clauses: string[],
    index: number,
    thisId: number,
    targetLang: string
  ): void {
    if (this.currentUtteranceId !== thisId || index >= clauses.length) {
      if (index >= clauses.length) {
        this.finishUtterance(thisId);
      }
      return;
    }

    const currentClause = clauses[index];
    // Pre-fetch the next clause concurrently while current clause is preparing/playing
    if (index + 1 < clauses.length) {
      this.precache(clauses[index + 1], targetLang);
    }

    this.playSingleClause(currentClause, thisId, targetLang, () => {
      if (this.currentUtteranceId === thisId) {
        this.playClauseQueue(clauses, index + 1, thisId, targetLang);
      }
    });
  }

  private playSingleClause(
    clauseText: string,
    thisId: number,
    targetLang: string,
    onClauseEnd: () => void
  ): void {
    const cacheKey = `${targetLang}:${clauseText.toLowerCase()}`;

    // 1. FAST PATH (<1ms): Instant playback from decoded AudioBuffer cache
    const cachedBuffer = this.audioBufferCache.get(cacheKey);
    if (cachedBuffer) {
      this.playBuffer(cachedBuffer, thisId, onClauseEnd);
      return;
    }

    const tryDirectFetch = () => {
      return fetch(`http://127.0.0.1:3002/synthesize?lang=${encodeURIComponent(targetLang)}&text=${encodeURIComponent(clauseText)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .catch(() =>
          fetch('http://127.0.0.1:3001/v1/speech/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: clauseText, lang: targetLang }),
          }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`API HTTP ${r.status}`))))
        )
        .then(async (data: any) => {
          if (this.currentUtteranceId !== thisId) return;
          const b64 = data?.audioBase64 || (typeof data?.audioUrl === 'string' ? data.audioUrl.replace('data:audio/wav;base64,', '') : '');
          if (b64) {
            const audioUrl = `data:audio/wav;base64,${b64}`;
            await this.playNeuralAudio(audioUrl, thisId, clauseText, targetLang, cacheKey, onClauseEnd);
          } else {
            this.onUnavailableCallback?.('Serveur vocal (:3002) indisponible');
            onClauseEnd();
          }
        })
        .catch(() => {
          if (this.currentUtteranceId !== thisId) return;
          this.onUnavailableCallback?.('Serveur vocal (:3002) hors ligne');
          onClauseEnd();
        });
    };

    // Direct background service worker synthesis
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      try {
        chrome.runtime.sendMessage(
          {
            type: 'SYNTHESIZE_SPEECH',
            text: clauseText,
            lang: targetLang,
          },
          async (res: any) => {
            if (this.currentUtteranceId !== thisId) return;
            const runtimeErr = chrome.runtime?.lastError;
            if (!runtimeErr && res?.success && res.result?.audioUrl) {
              await this.playNeuralAudio(res.result.audioUrl, thisId, clauseText, targetLang, cacheKey, onClauseEnd);
            } else {
              tryDirectFetch();
            }
          }
        );
      } catch {
        tryDirectFetch();
      }
      return;
    }

    // Fallback when running outside extension messaging runtime
    tryDirectFetch();
  }

  private playBuffer(audioBuffer: AudioBuffer, thisId: number, onEnd?: () => void): void {
    if (!this.audioCtx) {
      this.ensureAudioContext();
    }
    if (!this.audioCtx || this.currentUtteranceId !== thisId) return;

    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {}
      this.activeSource = null;
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioCtx.destination);
    this.activeSource = source;
    this.isPlaying = true;
    console.log(`[LinguaBridge Speech] AudioBuffer playback started (duration: ${audioBuffer.duration.toFixed(2)}s, ctx state: ${this.audioCtx.state})`);

    source.onended = () => {
      console.log('[LinguaBridge Speech] AudioBuffer playback finished');
      if (this.currentUtteranceId === thisId) {
        this.isPlaying = false;
        this.activeSource = null;
        if (onEnd) {
          onEnd();
        } else if (this.onEndCallback) {
          const cb = this.onEndCallback;
          this.onEndCallback = null;
          cb();
        }
      }
    };

    source.start(0);
  }

  private async cacheAudioUrl(cacheKey: string, audioUrl: string): Promise<AudioBuffer | null> {
    try {
      this.ensureAudioContext();
      if (!this.audioCtx) return null;

      const base64Data = audioUrl.replace('data:audio/wav;base64,', '');
      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const audioBuffer = await this.audioCtx.decodeAudioData(bytes.buffer.slice(0));
      this.audioBufferCache.set(cacheKey, audioBuffer);
      return audioBuffer;
    } catch {
      return null;
    }
  }

  public async precache(text: string, targetLang = 'ewo-CM'): Promise<void> {
    if (typeof window === 'undefined' || !text) return;
    const isEwondo = targetLang.startsWith('ewo');
    const spokenRaw = isEwondo ? getEwondoPhonetic(text) : text;
    const spokenText = spokenRaw.replace(/-/g, '').trim();
    if (!spokenText) return;

    const clauses = splitIntoAcousticClauses(spokenText);
    const clauseToPrecache = clauses[0] || spokenText;
    const cacheKey = `${targetLang}:${clauseToPrecache.trim().toLowerCase()}`;

    if (this.audioBufferCache.has(cacheKey)) return;

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        {
          type: 'SYNTHESIZE_SPEECH',
          text: clauseToPrecache,
          lang: targetLang,
        },
        async (res: any) => {
          if (res && res.success && res.result?.audioUrl) {
            await this.cacheAudioUrl(cacheKey, res.result.audioUrl);
          }
        }
      );
    }
  }

  private async playNeuralAudio(
    audioUrl: string,
    thisId: number,
    spokenText: string,
    targetLang: string,
    cacheKey?: string,
    onEnd?: () => void
  ): Promise<void> {
    console.log(`[LinguaBridge Speech] playNeuralAudio received payload (${audioUrl.length} chars) for "${spokenText.substring(0, 30)}"`);
    // Strategy 1: Decode base64 WAV into Web Audio buffer (bypasses CSP media-src blocks)
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass && audioUrl.startsWith('data:audio/wav;base64,')) {
        if (!this.audioCtx) {
          this.audioCtx = new AudioCtxClass();
        }
        if (this.audioCtx.state === 'suspended') {
          await Promise.race([
            this.audioCtx.resume(),
            new Promise<void>((resolve) => setTimeout(resolve, 180)),
          ]);
        }
        if (this.audioCtx.state === 'suspended') {
          throw new Error('AudioContext suspended');
        }

        const base64Data = audioUrl.replace('data:audio/wav;base64,', '');
        const binaryStr = atob(base64Data);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const audioBuffer = await this.audioCtx.decodeAudioData(bytes.buffer.slice(0));
        if (cacheKey) {
          this.audioBufferCache.set(cacheKey, audioBuffer);
        }
        if (this.currentUtteranceId !== thisId) return;

        this.playBuffer(audioBuffer, thisId, onEnd);
        return;
      }
    } catch {
      // Proceed to HTML5 audio fallback below
    }

    // Strategy 2: HTML5 Audio element
    try {
      const audio = new Audio(audioUrl);
      this.activeAudio = audio;

      audio.onplay = () => {
        if (this.currentUtteranceId === thisId) {
          this.isPlaying = true;
        }
      };

      const finish = () => {
        if (this.currentUtteranceId === thisId) {
          this.isPlaying = false;
          this.activeAudio = null;
          if (onEnd) {
            onEnd();
          } else if (this.onEndCallback) {
            const cb = this.onEndCallback;
            this.onEndCallback = null;
            cb();
          }
        }
      };

      audio.onended = finish;
      audio.onerror = () => {
        if (onEnd) {
          onEnd();
        } else {
          this.finishUtterance(thisId);
        }
      };

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          if (onEnd) {
            onEnd();
          } else {
            this.finishUtterance(thisId);
          }
        });
      }
    } catch {
      if (onEnd) {
        onEnd();
      } else {
        this.finishUtterance(thisId);
      }
    }
  }

  private playBrowserVoice(_text: string, _targetLang: string, thisId: number): void {
    // Permanent Block: Google and European/Windows browser speech engines are strictly blocked.
    // Only Meta MMS African neural engine is permitted.
    this.finishUtterance(thisId);
  }

  private finishUtterance(thisId: number): void {
    if (this.currentUtteranceId === thisId) {
      this.isPlaying = false;
      this.activeAudio = null;
      this.activeSource = null;
      this.activeUtterance = null;
      (window as any).__linguaActiveUtterance = null;
      if (this.onEndCallback) {
        const cb = this.onEndCallback;
        this.onEndCallback = null;
        cb();
      }
    }
  }

  public pause(): void {
    if (this.activeAudio && !this.activeAudio.paused) {
      this.activeAudio.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (this.activeAudio && this.activeAudio.paused) {
      this.activeAudio.play().catch(() => {});
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  public stop(): void {
    this.currentUtteranceId++;
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {
        // Ignored
      }
      this.activeSource = null;
    }
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch {
        // Ignored
      }
      this.activeAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch {
        // Ignored
      }
    }
    this.activeUtterance = null;
    (window as any).__linguaActiveUtterance = null;
    this.isPlaying = false;
    this.onEndCallback = null;
  }
}

const EwondoSpeechPlayer = AfricanSpeechPlayer;

class ExtensionAssistant {
  private container: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private originalTextMap = new Map<Node, string>();
  private originalChildNodesMap = new Map<HTMLElement, Node[]>();
  private static readonly INLINE_TAGS = new Set([
    'EM', 'STRONG', 'SPAN', 'B', 'I', 'U', 'A', 'SMALL', 'MARK', 'SUB', 'SUP', 'CODE', 'ABBR', 'CITE', 'TIME', 'BDO', 'BDI'
  ]);
  private static readonly CONTAINER_SELECTOR =
    'h1, h2, h3, h4, h5, h6, p, li, button, label, dt, dd, td, th, blockquote, figcaption, summary, caption, [role="alert"], [role="dialog"], dialog, div.alert, div.modal, div.banner-alert, div.popup-error';
  private static readonly CONTAINER_BLOCK_TAGS = new Set([
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'BUTTON', 'LABEL', 'DT', 'DD', 'TD', 'TH', 'BLOCKQUOTE', 'FIGCAPTION', 'SUMMARY', 'CAPTION',
    'DIALOG', '[ROLE="ALERT"]', '[ROLE="DIALOG"]', 'DIV.ALERT', 'DIV.MODAL', 'DIV.BANNER-ALERT', 'DIV.POPUP-ERROR'
  ]);
  private originalAttrMap = new Map<
    Element,
    { placeholder?: string; value?: string; title?: string; ariaLabel?: string; alt?: string }
  >();
  private isPageTranslated = false;
  private currentTargetLang = 'ewo-CM';

  private translateLocal(text: string): string {
    return translateLocalText(text, this.currentSourceLang, this.currentTargetLang).translatedText;
  }

  private currentSourceLang = typeof document !== 'undefined' && document.documentElement?.lang?.toLowerCase().startsWith('en') ? 'en' : 'fr';
  public isOpen = false;
  public isCardOpen(): boolean { return this.isOpen; }
  private activePanel: 'translate' | 'assistant' = 'translate';
  private chatHistory: Array<{ role: 'user' | 'assistant'; text: string }> = [];
  private lastSelection = '';
  private isTouchSpeakEnabled = false;
  private userPausedVoice = false;
  private isSiteDisabled = false;
  public customPos: { left: number; top: number } | null = null;
  private dragSuppressClick = false;
  private activeBarState = { visible: false, text: '', phonetic: '' };
  private speechPlayer = new EwondoSpeechPlayer();

  // Instant speech & phonetic cache to eliminate voice latency
  private translationSpeechCache = new Map<string, { spokenTranslation: string; phonetic: string }>();

  // Hover-to-speak tracking & debouncing ("survoler une section ça parle seul, une fois")
  private hoverDwellTimeout: any = null;
  private currentHoveredEl: HTMLElement | null = null;
  private currentSpokenEl: HTMLElement | null = null;
  private lastSpokenEl: HTMLElement | null = null;

  // Lightweight debounced MutationObserver for dynamic SPA banking portals (Afriland, BICEC, Ecobank, UBA, Orange Money)
  private mutationObserver: MutationObserver | null = null;
  private mutationDebounceTimeout: any = null;
  private pendingMutations: Set<Node> = new Set();
  private isTranslating = false;

  private onMouseUpHandler: (() => void) | null = null;
  private onRuntimeMessageHandler: ((msg: any) => void) | null = null;
  private onMouseOverHandler: ((e: MouseEvent) => void) | null = null;
  private onMouseOutHandler: ((e: MouseEvent) => void) | null = null;
  private onClickElementHandler: ((e: MouseEvent) => void) | null = null;
  private onTouchEndHandler: ((e: TouchEvent) => void) | null = null;
  private onFirstInteractionHandler: (() => void) | null = null;
  private onDragMoveHandler: ((e: MouseEvent) => void) | null = null;
  private onDragEndHandler: ((e: MouseEvent) => void) | null = null;
  private onClickOutsideHandler: ((e: MouseEvent) => void) | null = null;

  constructor() {
    this.speechPlayer.onUnavailableCallback = (reason: string) => {
      const phonEl = this.shadow?.getElementById('audio-phonetic');
      if (phonEl) {
        phonEl.textContent = reason;
        phonEl.style.color = '#fbbf24';
      }
    };
    this.init();
  }

  private getCurrentHost(): string {
    if (typeof window === 'undefined' || !window.location) return '';
    return window.location.hostname || window.location.origin || '';
  }

  public clampPosition(left: number, top: number): { left: number; top: number } {
    if (typeof window === 'undefined') return { left, top };
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    const minTop = 12;
    const maxTop = Math.max(minTop, vh - 68);
    const leftEdge = 12;
    const rightEdge = Math.max(leftEdge, vw - 68);

    // Lateral border snap: strictly snap to left edge (12px) or right edge (vw - 68px)
    const midX = vw / 2;
    const snappedLeft = left < midX ? leftEdge : rightEdge;
    const clampedTop = Math.max(minTop, Math.min(maxTop, Math.round(top)));

    return {
      left: snappedLeft,
      top: clampedTop,
    };
  }

  public applyContainerPosition(left: number, top: number): void {
    if (!this.container) return;
    const clamped = this.clampPosition(left, top);
    this.customPos = clamped;
    this.container.style.bottom = 'auto';
    this.container.style.right = 'auto';
    this.container.style.left = `${clamped.left}px`;
    this.container.style.top = `${clamped.top}px`;
  }

  public getLangBadgeName(lang: string): string {
    switch (lang) {
      case 'ewo-CM': return '🇨🇲 Ewondo';
      case 'fuv-CM': return '🇨🇲 Fulfulde';
      case 'hau-CM': return '🇨🇲 Haoussa';
      case 'knc-CM': return '🇨🇲 Kanuri';
      case 'pcm-CM': return '🇨🇲 Pidgin';
      default: return '🇨🇲 Langue Nationale';
    }
  }

  private detectSourceLanguage(): string {
    const declared = (document.documentElement.lang || '').toLowerCase();
    if (declared.startsWith('fr')) return 'fr';
    if (declared.startsWith('en')) return 'en';
    const sample = (document.body?.innerText || '').slice(0, 5000).toLowerCase();
    const french = (sample.match(/\\b(le|la|les|des|vous|votre|pour|avec|compte|solde|frais|envoyer)\\b/g) || []).length;
    const english = (sample.match(/\\b(the|your|account|balance|fees|send|transfer|with|from|payment)\\b/g) || []).length;
    return english > french ? 'en' : 'fr';
  }

  public isVoiceEnabled(): boolean {
    if (this.isSiteDisabled) return false;
    return this.isTouchSpeakEnabled || (this.isPageTranslated && !this.userPausedVoice);
  }

  public stopSpeech(): void {
    this.speechPlayer.stop();
    if (this.currentSpokenEl) {
      this.currentSpokenEl.style.outline = '';
      this.currentSpokenEl.style.cursor = '';
      if (this.currentHoveredEl === this.currentSpokenEl) {
        this.currentHoveredEl = null;
      }
      this.currentSpokenEl = null;
    }
  }

  private init() {
    if (document.getElementById('linguabridge-extension-root')) return;

    const mount = () => {
      if (document.getElementById('linguabridge-extension-root')) return;
      const target = document.body || document.documentElement;
      if (!target) return;

      this.container = document.createElement('div');
      this.container.id = 'linguabridge-extension-root';
      this.container.style.all = 'initial';
      this.container.style.position = 'fixed';
      this.container.style.bottom = '24px';
      this.container.style.right = '24px';
      this.container.style.zIndex = '2147483646';

      this.shadow = this.container.attachShadow({ mode: 'open' });
      const markInside = (e: Event) => {
        (e as any).__lbInside = true;
      };
      this.shadow.addEventListener('click', markInside, true);
      this.container.addEventListener('click', markInside, true);
      this.render();
      target.appendChild(this.container);
      // Notify the LinguaBridge website to hide its separate assistant launcher.
      document.documentElement.setAttribute('data-linguabridge-extension', 'active');
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const host = this.getCurrentHost();
        chrome.storage.local.get(
          ['linguabridgeTargetLang', 'linguabridgeAudioEnabled', 'linguabridgeDisabledHosts', 'linguabridgeWidgetPos'],
          (settings) => {
            const disabledHosts: string[] = Array.isArray(settings.linguabridgeDisabledHosts)
              ? settings.linguabridgeDisabledHosts
              : [];
            if (host && disabledHosts.includes(host)) {
              this.disableOnCurrentSite(false);
              return;
            }
            if (settings.linguabridgeTargetLang) this.currentTargetLang = settings.linguabridgeTargetLang;
            if (settings.linguabridgeAudioEnabled === true) {
              this.isTouchSpeakEnabled = true;
              this.userPausedVoice = false;
            } else if (settings.linguabridgeAudioEnabled === false) {
              this.isTouchSpeakEnabled = false;
            }
            if (
              settings.linguabridgeWidgetPos &&
              typeof settings.linguabridgeWidgetPos.left === 'number' &&
              typeof settings.linguabridgeWidgetPos.top === 'number'
            ) {
              this.applyContainerPosition(settings.linguabridgeWidgetPos.left, settings.linguabridgeWidgetPos.top);
            }
            this.render();
          }
        );
      }

      this.setupListeners();
      this.setupMutationObserver();
    };

    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', mount);
    } else {
      mount();
    }
  }

  private clearHoverState(): void {
    if (this.hoverDwellTimeout) {
      clearTimeout(this.hoverDwellTimeout);
      this.hoverDwellTimeout = null;
    }
    if (this.currentHoveredEl) {
      this.currentHoveredEl.style.outline = '';
      this.currentHoveredEl.style.cursor = '';
      this.currentHoveredEl = null;
    }
    this.stopSpeech();
    this.lastSpokenEl = null;
  }

  private findMeaningfulSection(target: HTMLElement): HTMLElement | null {
    if (!target) return null;
    if (this.isExtensionNode(target)) return null;

    const tag = target.tagName ? target.tagName.toLowerCase() : '';
    if (['script', 'style', 'code', 'pre', 'noscript', 'svg', 'path', 'iframe'].includes(tag)) {
      return null;
    }

    // 1. Look for closest semantic text or interactive element
    const semanticBlock = target.closest(
      'h1, h2, h3, h4, h5, h6, p, button, a, li, td, th, label, dt, dd, summary, blockquote, figcaption, input, textarea, [role="button"], [role="link"], [role="heading"], [role="tab"], [role="menuitem"], [role="alert"], [role="dialog"], dialog, div.alert, div.modal, div.banner-alert, div.popup-error'
    ) as HTMLElement | null;

    if (semanticBlock && !this.isExtensionNode(semanticBlock)) {
      const sTag = (semanticBlock.tagName || '').toLowerCase();
      const isInput = sTag === 'input' || sTag === 'textarea';
      const text = isInput
        ? (semanticBlock as any).value?.trim() ||
          (semanticBlock as any).placeholder?.trim() ||
          semanticBlock.getAttribute('aria-label')?.trim() ||
          semanticBlock.getAttribute('title')?.trim()
        : semanticBlock.innerText?.trim() ||
          semanticBlock.textContent?.trim() ||
          semanticBlock.getAttribute('aria-label')?.trim() ||
          semanticBlock.getAttribute('title')?.trim();
      if (text && text.length >= 1) {
        return semanticBlock;
      }
    }

    // 2. Reject macro containers (body, html)
    if (target === document.body || target === document.documentElement) {
      return null;
    }

    // 3. If target has multiple block children, let the cursor hover the specific child (unless target is an alert or modal)
    if (
      target.querySelectorAll &&
      target.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, button, dt, dd').length > 0 &&
      !target.matches?.('[role="alert"], [role="dialog"], dialog, div.alert, div.modal, div.banner-alert, div.popup-error')
    ) {
      return null;
    }

    // 4. Fallback to leaf or target text
    const tTag = (target.tagName || '').toLowerCase();
    const isTargetInput = tTag === 'input' || tTag === 'textarea';
    const text = isTargetInput
      ? (target as any).value?.trim() ||
        (target as any).placeholder?.trim() ||
        target.getAttribute('aria-label')?.trim() ||
        target.getAttribute('title')?.trim()
      : target.innerText?.trim() ||
        target.textContent?.trim() ||
        target.getAttribute('aria-label')?.trim() ||
        target.getAttribute('title')?.trim();
    if (text && text.length >= 1) {
      return target;
    }

    return null;
  }

  private setupListeners() {
    // Zero-latency prewarm on first user interaction in page
    this.onFirstInteractionHandler = () => {
      this.speechPlayer.prewarm();
      if (this.onFirstInteractionHandler) {
        window.removeEventListener('pointerdown', this.onFirstInteractionHandler);
        window.removeEventListener('keydown', this.onFirstInteractionHandler);
        this.onFirstInteractionHandler = null;
      }
    };
    window.addEventListener('pointerdown', this.onFirstInteractionHandler, { once: true });
    window.addEventListener('keydown', this.onFirstInteractionHandler, { once: true });

    // Listen for text selection
    this.onMouseUpHandler = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text || text.length < 2) return;

      this.lastSelection = text;
      this.isOpen = true;
      this.activePanel = 'translate';
      this.render();
      this.translateSelectedText(text);
    };
    document.addEventListener('mouseup', this.onMouseUpHandler);

    // Listen for background & popup messages
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      this.onRuntimeMessageHandler = (msg: any) => {
        if (msg.type === 'CONTEXT_MENU_TRANSLATE' && msg.text) {
          this.isOpen = true;
          this.render();
          this.translateSelectedText(msg.text);
        } else if (msg.type === 'POPUP_TRANSLATE_PAGE') {
          if (msg.targetLang) {
            this.currentTargetLang = msg.targetLang;
            this.currentSourceLang = this.detectSourceLanguage();
          }
          this.translateFullPage();
        } else if (msg.type === 'POPUP_SET_TARGET_LANGUAGE') {
          this.currentTargetLang = msg.targetLang || 'ewo-CM';
          this.render();
        } else if (msg.type === 'POPUP_SET_SPEECH') {
          this.isTouchSpeakEnabled = msg.enabled === true;
          this.userPausedVoice = !this.isTouchSpeakEnabled;
          if (this.isTouchSpeakEnabled) this.speechPlayer.prewarm();
          if (!this.isVoiceEnabled()) this.clearHoverState();
          this.render();
        } else if (msg.type === 'POPUP_DISABLE_SITE') {
          this.disableOnCurrentSite(false);
        } else if (msg.type === 'POPUP_ENABLE_SITE') {
          this.enableOnCurrentSite();
        } else if (msg.type === 'POPUP_STOP_SPEECH') {
          this.clearHoverState();
          const bar = this.shadow?.getElementById('audio-bar');
          if (bar) bar.style.display = 'none';
        } else if (msg.type === 'POPUP_TOGGLE_TOUCH_SPEAK' || msg.type === 'POPUP_TOGGLE_HOVER_SPEAK') {
          this.toggleTouchSpeakMode();
        } else if (msg.type === 'POPUP_RESTORE_PAGE') {
          this.restorePage();
        }
      };
      chrome.runtime.onMessage.addListener(this.onRuntimeMessageHandler);
    }

    // Global speech control events from web pages (e.g. LinguaBridge mute button)
    window.addEventListener('message', (event) => {
      if (event?.data?.type === 'LINGUABRIDGE_STOP_VOICE') {
        this.clearHoverState();
        this.stopSpeech();
        const bar = this.shadow?.getElementById('audio-bar');
        if (bar) bar.style.display = 'none';
      } else if (event?.data?.type === 'LINGUABRIDGE_MUTE_VOICE') {
        const muted = !!event.data.muted;
        this.userPausedVoice = muted;
        if (muted) {
          this.isTouchSpeakEnabled = false;
          this.clearHoverState();
          this.stopSpeech();
          const bar = this.shadow?.getElementById('audio-bar');
          if (bar) bar.style.display = 'none';
        }
        this.render();
      }
    });

    window.addEventListener('linguabridge:stop-speech', () => {
      this.clearHoverState();
      this.stopSpeech();
      const bar = this.shadow?.getElementById('audio-bar');
      if (bar) bar.style.display = 'none';
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.clearHoverState();
        this.stopSpeech();
        const bar = this.shadow?.getElementById('audio-bar');
        if (bar) bar.style.display = 'none';
      }
    });

    // Hover-to-speak: Automatically triggers speech in Kóbɔ́ Ewondo once upon dwelling on a section
    this.onMouseOverHandler = (e: MouseEvent) => {
      if (!this.isVoiceEnabled()) return;
      const target = e.target as HTMLElement;
      if (!target || this.isExtensionNode(target)) return;

      const section = this.findMeaningfulSection(target);
      if (!section) return;

      // Moving within the currently hovered section: no-op
      if (this.currentHoveredEl === section) return;

      // Cancel previous pending hover dwell
      if (this.hoverDwellTimeout) {
        clearTimeout(this.hoverDwellTimeout);
        this.hoverDwellTimeout = null;
      }

      // Clear outline on previous hovered element
      if (this.currentHoveredEl && this.currentHoveredEl !== section) {
        this.currentHoveredEl.style.outline = '';
        this.currentHoveredEl.style.cursor = '';
      }

      this.currentHoveredEl = section;
      section.style.outline = '2px solid #16a34a';
      section.style.outlineOffset = '2px';
      section.style.cursor = 'pointer';

      // "parle seul , une fois": If this section was already spoken in this hover, do not re-speak
      if (this.lastSpokenEl === section) return;

      // Prewarm voice synthesis on hover for zero-latency speech start
      this.speechPlayer.prewarm();

      // Proactive instant hover pre-fetch (t = 0ms dwell)
      try {
        const secTag = (section.tagName || '').toLowerCase();
        const isSecInput = secTag === 'input' || secTag === 'textarea';
        const textToPrecache = isSecInput
          ? (section as any).value?.trim() || (section as any).placeholder?.trim() || section.getAttribute('aria-label')?.trim()
          : section.innerText?.trim() || section.textContent?.trim() || section.getAttribute('aria-label')?.trim();
        if (textToPrecache && textToPrecache.length >= 1) {
          const trans = this.translateLocal(textToPrecache);
          if (trans) {
            this.speechPlayer.precache(trans, this.currentTargetLang);
          }
        }
      } catch {}

      // Debounce dwell delay (200ms) so casual mouse movement does not trigger or abort speech
      this.hoverDwellTimeout = setTimeout(() => {
        if (this.currentHoveredEl === section && this.lastSpokenEl !== section) {
          this.lastSpokenEl = section;
          // Only stop previous speech when new section actually begins speaking
          if (this.currentSpokenEl && this.currentSpokenEl !== section) {
            this.stopSpeech();
          }
          const secTag = (section.tagName || '').toLowerCase();
          const isSecInput = secTag === 'input' || secTag === 'textarea';
          const text = isSecInput
            ? (section as any).value?.trim() ||
              (section as any).placeholder?.trim() ||
              section.getAttribute('aria-label')?.trim() ||
              section.getAttribute('title')?.trim()
            : section.innerText?.trim() ||
              section.textContent?.trim() ||
              section.getAttribute('aria-label')?.trim() ||
              section.getAttribute('title')?.trim();
          if (text && text.length >= 1) {
            this.speakTextSection(text, section);
          }
        }
      }, 200);
    };

    this.onMouseOutHandler = (e: MouseEvent) => {
      if (!this.isVoiceEnabled()) return;
      const target = e.target as HTMLElement;
      if (!target || this.isExtensionNode(target)) return;

      const section = this.findMeaningfulSection(target);
      if (!section) return;

      // Check if mouse actually moved into a child element of the section
      const related = e.relatedTarget as Node | null;
      if (related && section.contains(related)) {
        return;
      }

      // Mouse genuinely left this section
      if (this.currentHoveredEl === section) {
        if (this.hoverDwellTimeout) {
          clearTimeout(this.hoverDwellTimeout);
          this.hoverDwellTimeout = null;
        }
        section.style.outline = '';
        section.style.cursor = '';
        this.currentHoveredEl = null;
      }

      // Reset lastSpokenEl when cursor leaves section, so hovering it again later speaks again
      if (this.lastSpokenEl === section) {
        this.lastSpokenEl = null;
      }
    };

    // Click-to-speak (instant, 0ms dwell)
    this.onClickElementHandler = (e: MouseEvent) => {
      if (!this.isVoiceEnabled()) return;
      const target = e.target as HTMLElement;
      if (!target || this.isExtensionNode(target)) return;

      const section = this.findMeaningfulSection(target);
      if (!section) return;

      if (this.hoverDwellTimeout) {
        clearTimeout(this.hoverDwellTimeout);
        this.hoverDwellTimeout = null;
      }

      const secTag = (section.tagName || '').toLowerCase();
      const isSecInput = secTag === 'input' || secTag === 'textarea';
      const text = isSecInput
        ? (section as any).value?.trim() ||
          (section as any).placeholder?.trim() ||
          section.getAttribute('aria-label')?.trim() ||
          section.getAttribute('title')?.trim()
        : section.innerText?.trim() ||
          section.textContent?.trim() ||
          section.getAttribute('aria-label')?.trim() ||
          section.getAttribute('title')?.trim();
      if (!text || text.length < 1) return;

      // Skip editable form controls so typing/selecting is uninterrupted, while speaking labels/links/buttons without preventDefault
      if (target.closest('input:not([type="button"]):not([type="submit"]):not([type="reset"]), select, textarea, [contenteditable="true"]')) return;
      this.speechPlayer.prewarm();
      this.stopSpeech();
      this.lastSpokenEl = section;
      this.speakTextSection(text, section);
    };

    // Mobile touch support
    this.onTouchEndHandler = (e: TouchEvent) => {
      if (!this.isVoiceEnabled()) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
      if (!target || this.isExtensionNode(target)) return;

      const section = this.findMeaningfulSection(target);
      if (!section) return;

      const secTag = (section.tagName || '').toLowerCase();
      const isSecInput = secTag === 'input' || secTag === 'textarea';
      const text = isSecInput
        ? (section as any).value?.trim() ||
          (section as any).placeholder?.trim() ||
          section.getAttribute('aria-label')?.trim() ||
          section.getAttribute('title')?.trim()
        : section.innerText?.trim() ||
          section.textContent?.trim() ||
          section.getAttribute('aria-label')?.trim() ||
          section.getAttribute('title')?.trim();
      if (!text || text.length < 1) return;

      // Preserve native touch on editable inputs while articulating readable labels/buttons/text
      if (target.closest('input:not([type="button"]):not([type="submit"]):not([type="reset"]), select, textarea, [contenteditable="true"]')) return;
      this.speechPlayer.prewarm();
      this.stopSpeech();
      this.lastSpokenEl = section;
      this.speakTextSection(text, section);
    };

    document.addEventListener('mouseover', this.onMouseOverHandler, true);
    document.addEventListener('mouseout', this.onMouseOutHandler, true);
    document.addEventListener('pointerover', this.onMouseOverHandler as any, true);
    document.addEventListener('pointerout', this.onMouseOutHandler as any, true);
    document.addEventListener('click', this.onClickElementHandler, true);
    document.addEventListener('touchend', this.onTouchEndHandler, { capture: true, passive: false });

    // Click outside container auto-closes popup card
    this.onClickOutsideHandler = (e: MouseEvent) => {
      if (!this.isOpen) return;
      if (this.dragSuppressClick) return;
      if (this.isEventInsideWidget(e)) return;

      const selection = typeof window.getSelection === 'function' ? window.getSelection() : null;
      if (selection && selection.toString().trim().length >= 2) return;

      this.isOpen = false;
      this.render();
    };
    document.addEventListener('click', this.onClickOutsideHandler);
  }

  public toggleTouchSpeakMode(): void {
    this.isTouchSpeakEnabled = !this.isTouchSpeakEnabled;
    this.userPausedVoice = !this.isTouchSpeakEnabled;
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ linguabridgeAudioEnabled: this.isTouchSpeakEnabled });
    }
    if (this.isTouchSpeakEnabled) this.speechPlayer.prewarm();
    if (!this.isVoiceEnabled()) {
      this.clearHoverState();
      this.speechPlayer.stop();
      this.activeBarState = { visible: false, text: '', phonetic: '' };
      const bar = this.shadow?.getElementById('audio-bar');
      if (bar) bar.style.display = 'none';
    }
    this.render();
  }

  public disableOnCurrentSite(persist = true): void {
    this.isSiteDisabled = true;
    this.isOpen = false;
    this.stopSpeech();
    this.clearHoverState();
    if (this.isPageTranslated) {
      this.restorePage();
    }
    document.documentElement.removeAttribute('data-linguabridge-extension');
    if (this.container) {
      this.container.style.display = 'none';
    }
    if (persist && typeof chrome !== 'undefined' && chrome.storage?.local) {
      const host = this.getCurrentHost();
      if (host) {
        chrome.storage.local.get(['linguabridgeDisabledHosts'], (data) => {
          const list: string[] = Array.isArray(data?.linguabridgeDisabledHosts) ? data.linguabridgeDisabledHosts : [];
          if (!list.includes(host)) {
            chrome.storage.local.set({ linguabridgeDisabledHosts: [...list, host] });
          }
        });
      }
    }
  }

  public enableOnCurrentSite(): void {
    this.isSiteDisabled = false;
    document.documentElement.setAttribute('data-linguabridge-extension', 'active');
    if (this.container) {
      this.container.style.display = '';
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const host = this.getCurrentHost();
      if (host) {
        chrome.storage.local.get(['linguabridgeDisabledHosts'], (data) => {
          const list: string[] = Array.isArray(data?.linguabridgeDisabledHosts) ? data.linguabridgeDisabledHosts : [];
          chrome.storage.local.set({ linguabridgeDisabledHosts: list.filter((h) => h !== host) });
        });
      }
    }
    this.render();
  }

  public speakTextSection(rawText: string, targetEl?: HTMLElement): void {
    if (!rawText || !rawText.trim()) return;

    // Fast synchronous cache lookup / translation (0ms latency boost)
    const cacheKey = `${this.currentTargetLang}:${rawText.trim()}`;
    let spokenTranslation: string;
    let phonetic: string;

    const cached = this.translationSpeechCache.get(cacheKey);
    if (cached) {
      spokenTranslation = cached.spokenTranslation;
      phonetic = cached.phonetic;
    } else {
      spokenTranslation = this.translateLocal(rawText);
      phonetic = this.currentTargetLang.startsWith('ewo') ? getEwondoPhonetic(spokenTranslation) : '';
      this.translationSpeechCache.set(cacheKey, { spokenTranslation, phonetic });
    }

    // Visual highlight on speaking section
    if (this.currentSpokenEl && this.currentSpokenEl !== targetEl) {
      this.currentSpokenEl.style.outline = '';
      this.currentSpokenEl.style.cursor = '';
    }
    if (targetEl) {
      this.currentSpokenEl = targetEl;
      targetEl.style.outline = '2px solid #16a34a';
      targetEl.style.outlineOffset = '2px';
    }

    // Show floating phonetic subtitle bar immediately
    this.showAudioFloatingBar(spokenTranslation, phonetic);

    // Speak immediately with authentic Meta MMS African neural engine
    this.speechPlayer.speak(spokenTranslation, phonetic, () => {
      if (this.currentSpokenEl === targetEl) {
        if (targetEl && targetEl !== this.currentHoveredEl) {
          targetEl.style.outline = '';
          targetEl.style.cursor = '';
        }
        this.currentSpokenEl = null;
      }
    }, this.currentTargetLang);
  }

  private showAudioFloatingBar(text: string, phonetic: string): void {
    this.activeBarState = { visible: true, text, phonetic };
    const bar = this.shadow?.getElementById('audio-bar');
    if (!bar) return;

    bar.style.display = 'flex';
    const textEl = this.shadow?.getElementById('audio-spoken-text');
    const phonEl = this.shadow?.getElementById('audio-phonetic');
    if (textEl) textEl.textContent = text;
    if (phonEl) {
      phonEl.style.color = '#86efac';
      phonEl.textContent = phonetic ? `[${phonetic}]` : '';
    }
  }

  public async translateSelectedText(text: string): Promise<void> {
    const box = this.shadow?.getElementById('selection-preview');
    if (!box) return;

    box.style.display = 'block';

    // Synchronously compute local translation immediately for 0ms latency boost
    const localTrans = this.translateLocal(text);
    const localPhonetic = this.currentTargetLang.startsWith('ewo') ? getEwondoPhonetic(localTrans) : '';

    const renderPreview = (translatedText: string, phonetic: string, warnings: string[]) => {
      box.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 2px; color: #111827;">Sélectionné : "${text}"</div>
        <div style="color: #15803d; font-weight: 700; font-size: 14px;">"${translatedText}"</div>
        ${phonetic ? `<div style="color: #4b5563; font-size: 11px; margin-top: 2px; font-style: italic;">Prononciation : [${phonetic}]</div>` : ''}
        <div style="margin-top: 6px; display: flex; gap: 8px;">
          <button id="btn-speak-selection" style="background: #16a34a; color: #ffffff; border: 1px solid #15803d; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">
            Écouter en langue maternelle
          </button>
        </div>
        ${
          warnings.length > 0
            ? `<div style="margin-top: 6px; padding: 6px 8px; background: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px; color: #111827; font-size: 11px;">
                <strong>Garde financière :</strong> ${warnings.join(', ')}
              </div>`
            : ''
        }
      `;

      this.shadow?.getElementById('btn-speak-selection')?.addEventListener('click', (e) => {
        const btn = e.currentTarget as HTMLElement;
        const orig = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = 'Lecture vocale...';
        this.speechPlayer.speak(translatedText, phonetic, () => {
          if (btn) btn.innerHTML = orig;
        }, this.currentTargetLang);
      });
    };

    // Show instant local translation with zero network latency
    renderPreview(localTrans, localPhonetic, translateLocalText(text, this.currentSourceLang, this.currentTargetLang).warnings);

    // Also query background/API if available to enrich guards
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        {
          type: 'TRANSLATE_TEXT',
          text,
          sourceLang: this.currentSourceLang,
          targetLang: this.currentTargetLang,
          domain: 'financial',
        },
        (response) => {
          if (response?.success && response.result) {
            const phon = this.currentTargetLang.startsWith('ewo') ? (response.result.phonetic || getEwondoPhonetic(response.result.translatedText)) : '';
            renderPreview(response.result.translatedText, phon, response.result.warnings || []);
          }
        }
      );
    }
  }

  private setupMutationObserver(): void {
    if (typeof MutationObserver === 'undefined') return;
    if (typeof document === 'undefined' || !document.body) return;

    this.mutationObserver = new MutationObserver((mutations) => {
      // Prevent recursive trigger loops while applying translation
      if (this.isTranslating) return;
      if (!this.isPageTranslated) return;

      let hasRelevantMutations = false;
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'childList') {
          for (let j = 0; j < m.addedNodes.length; j++) {
            const node = m.addedNodes[j];
            if (this.isExtensionNode(node)) continue;
            this.pendingMutations.add(node);
            hasRelevantMutations = true;
          }
        } else if (m.type === 'characterData') {
          const target = m.target;
          if (this.isExtensionNode(target)) continue;
          this.pendingMutations.add(target);
          hasRelevantMutations = true;
        }
      }

      if (hasRelevantMutations) {
        this.scheduleDebouncedMutation();
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  public isEventInsideWidget(e: Event): boolean {
    if ((e as any).__lbInside) return true;
    if (!this.container) return false;

    if (typeof (e as any).composedPath === 'function') {
      const path = (e as any).composedPath();
      if (Array.isArray(path)) {
        if (path.includes(this.container) || (this.shadow && path.includes(this.shadow))) {
          return true;
        }
      }
    }

    const target = e.target as Node | null;
    if (!target) return false;

    if (target === this.container) return true;
    if (this.container.contains(target)) return true;
    if (this.shadow && this.shadow.contains(target)) return true;
    if (typeof (target as any).getRootNode === 'function' && target.getRootNode() === this.shadow) {
      return true;
    }
    if (this.isExtensionNode(target)) return true;

    return false;
  }

  private isExtensionNode(node: Node | null): boolean {
    if (!node) return false;
    if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const el = node as HTMLElement;
      if (el.id === 'linguabridge-extension-root' || el.closest?.('#linguabridge-extension-root')) {
        return true;
      }
    } else if (node.parentElement) {
      if (
        node.parentElement.id === 'linguabridge-extension-root' ||
        node.parentElement.closest?.('#linguabridge-extension-root')
      ) {
        return true;
      }
    }
    return false;
  }

  private scheduleDebouncedMutation(): void {
    if (this.mutationDebounceTimeout) {
      clearTimeout(this.mutationDebounceTimeout);
    }
    this.mutationDebounceTimeout = setTimeout(() => {
      this.processPendingMutations();
    }, 50);
  }

  private processPendingMutations(): void {
    if (!this.isPageTranslated || this.pendingMutations.size === 0) {
      this.pendingMutations.clear();
      return;
    }

    this.isTranslating = true;
    try {
      for (const node of this.pendingMutations) {
        this.translateNodeSubtree(node);
      }
      if (this.mutationObserver) {
        this.mutationObserver.takeRecords();
      }
    } finally {
      this.pendingMutations.clear();
      this.isTranslating = false;
    }
  }

  private translateElementAttributes(el: HTMLElement): void {
    if (!el || typeof (el as any).getAttribute !== 'function' || this.isExtensionNode(el)) return;
    const tag = (el.tagName || '').toLowerCase();

    // 1. Placeholder translation on inputs and textareas
    if (tag === 'input' || tag === 'textarea') {
      const inputEl = el as any;
      const ph = inputEl.placeholder;
      if (ph && ph.trim()) {
        const orig = this.originalAttrMap.get(el);
        if (!orig || orig.placeholder === undefined) {
          this.originalAttrMap.set(el, { ...orig, placeholder: ph });
        }
        const sourcePh = (this.originalAttrMap.get(el)?.placeholder ?? ph).trim();
        const translatedPh = this.translateLocal(sourcePh);
        if (translatedPh && translatedPh !== sourcePh) {
          inputEl.placeholder = translatedPh;
          const cacheKey = `${this.currentTargetLang}:${translatedPh.trim()}`;
          this.translationSpeechCache.set(cacheKey, {
            spokenTranslation: translatedPh,
            phonetic: this.currentTargetLang.startsWith('ewo') ? getEwondoPhonetic(translatedPh) : '',
          });
        } else {
          inputEl.placeholder = this.originalAttrMap.get(el)?.placeholder ?? ph;
        }
      }
    }

    // 2. Button value translation on input[type="button" | "submit" | "reset"]
    if (tag === 'input') {
      const inputEl = el as any;
      const type = (inputEl.type || '').toLowerCase();
      if (['button', 'submit', 'reset'].includes(type) && inputEl.value && inputEl.value.trim()) {
        const orig = this.originalAttrMap.get(el);
        if (!orig || orig.value === undefined) {
          this.originalAttrMap.set(el, { ...orig, value: inputEl.value });
        }
        const sourceVal = (this.originalAttrMap.get(el)?.value ?? inputEl.value).trim();
        const translatedVal = this.translateLocal(sourceVal);
        if (translatedVal && translatedVal !== sourceVal) {
          inputEl.value = translatedVal;
          const cacheKey = `${this.currentTargetLang}:${translatedVal.trim()}`;
          this.translationSpeechCache.set(cacheKey, {
            spokenTranslation: translatedVal,
            phonetic: this.currentTargetLang.startsWith('ewo') ? getEwondoPhonetic(translatedVal) : '',
          });
        } else {
          inputEl.value = this.originalAttrMap.get(el)?.value ?? inputEl.value;
        }
      }
    }

    // 3. title attribute
    const title = el.getAttribute('title');
    if (title && title.trim()) {
      const orig = this.originalAttrMap.get(el);
      if (!orig || orig.title === undefined) {
        this.originalAttrMap.set(el, { ...orig, title });
      }
      const sourceTitle = (this.originalAttrMap.get(el)?.title ?? title).trim();
      const translatedTitle = this.translateLocal(sourceTitle);
      if (translatedTitle && translatedTitle !== sourceTitle) {
        el.setAttribute('title', translatedTitle);
        const cacheKey = `${this.currentTargetLang}:${translatedTitle.trim()}`;
        this.translationSpeechCache.set(cacheKey, {
          spokenTranslation: translatedTitle,
          phonetic: this.currentTargetLang.startsWith('ewo') ? getEwondoPhonetic(translatedTitle) : '',
        });
      } else {
        const origTitle = this.originalAttrMap.get(el)?.title;
        if (origTitle !== undefined) el.setAttribute('title', origTitle);
      }
    }

    // 4. aria-label attribute
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) {
      const orig = this.originalAttrMap.get(el);
      if (!orig || orig.ariaLabel === undefined) {
        this.originalAttrMap.set(el, { ...orig, ariaLabel });
      }
      const sourceAria = (this.originalAttrMap.get(el)?.ariaLabel ?? ariaLabel).trim();
      const translatedAria = this.translateLocal(sourceAria);
      if (translatedAria && translatedAria !== sourceAria) {
        el.setAttribute('aria-label', translatedAria);
        const cacheKey = `${this.currentTargetLang}:${translatedAria.trim()}`;
        this.translationSpeechCache.set(cacheKey, {
          spokenTranslation: translatedAria,
          phonetic: this.currentTargetLang.startsWith('ewo') ? getEwondoPhonetic(translatedAria) : '',
        });
      } else {
        const origAria = this.originalAttrMap.get(el)?.ariaLabel;
        if (origAria !== undefined) el.setAttribute('aria-label', origAria);
      }
    }

    // 5. alt attribute on images
    if (tag === 'img') {
      const alt = el.getAttribute('alt');
      if (alt && alt.trim()) {
        const orig = this.originalAttrMap.get(el);
        if (!orig || orig.alt === undefined) {
          this.originalAttrMap.set(el, { ...orig, alt });
        }
        const sourceAlt = (this.originalAttrMap.get(el)?.alt ?? alt).trim();
        const translatedAlt = this.translateLocal(sourceAlt);
        if (translatedAlt && translatedAlt !== sourceAlt) {
          el.setAttribute('alt', translatedAlt);
          const cacheKey = `${this.currentTargetLang}:${translatedAlt.trim()}`;
          this.translationSpeechCache.set(cacheKey, {
            spokenTranslation: translatedAlt,
            phonetic: this.currentTargetLang.startsWith('ewo') ? getEwondoPhonetic(translatedAlt) : '',
          });
        } else {
          const origAlt = this.originalAttrMap.get(el)?.alt;
          if (origAlt !== undefined) el.setAttribute('alt', origAlt);
        }
      }
    }
  }

  private buildMaskedSentence(node: Node, inlineElements: HTMLElement[]): string {
    let res = '';
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === 3) {
        res += child.textContent || '';
      } else if (child.nodeType === 1) {
        const childEl = child as HTMLElement;
        const tag = (childEl.tagName || '').toUpperCase();
        if (ExtensionAssistant.INLINE_TAGS.has(tag)) {
          const idx = inlineElements.length;
          inlineElements.push(childEl);
          const inner = this.buildMaskedSentence(childEl, inlineElements);
          res += `<t${idx}>${inner}</t${idx}>`;
        } else if (tag === 'BR') {
          res += '\n';
        } else {
          res += childEl.textContent || '';
        }
      }
    }
    return res;
  }

  private reassembleTranslatedSentence(
    translated: string,
    inlineElements: HTMLElement[]
  ): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const stack: (HTMLElement | DocumentFragment)[] = [fragment];
    const tokenRegex = /(<t(\d+)>)|(<\/t(\d+)>)|(⟦T(\d+):)|(⟧)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(translated)) !== null) {
      const textBefore = translated.slice(lastIndex, match.index);
      if (textBefore) {
        stack[stack.length - 1].appendChild(document.createTextNode(textBefore));
      }

      if (match[1]) {
        // <tN>
        const idx = parseInt(match[2], 10);
        const top = stack[stack.length - 1];
        if (idx >= 0 && idx < inlineElements.length) {
          const el = inlineElements[idx];
          while (el.firstChild) el.removeChild(el.firstChild);
          top.appendChild(el);
          stack.push(el);
        } else {
          const span = document.createElement('span');
          top.appendChild(span);
          stack.push(span);
        }
      } else if (match[3]) {
        // </tN>
        if (stack.length > 1) stack.pop();
      } else if (match[5]) {
        // ⟦TN:
        const idx = parseInt(match[6], 10);
        const top = stack[stack.length - 1];
        if (idx >= 0 && idx < inlineElements.length) {
          const el = inlineElements[idx];
          while (el.firstChild) el.removeChild(el.firstChild);
          top.appendChild(el);
          stack.push(el);
        } else {
          const span = document.createElement('span');
          top.appendChild(span);
          stack.push(span);
        }
      } else if (match[7]) {
        // ⟧
        if (stack.length > 1) stack.pop();
      }

      lastIndex = tokenRegex.lastIndex;
    }

    const remainingText = translated.slice(lastIndex);
    if (remainingText) {
      stack[stack.length - 1].appendChild(document.createTextNode(remainingText));
    }

    return fragment;
  }

  private saveElementChildrenRecursively(el: HTMLElement): void {
    if (!this.originalChildNodesMap.has(el)) {
      this.originalChildNodesMap.set(el, Array.from(el.childNodes));
      for (let i = 0; i < el.childNodes.length; i++) {
        const child = el.childNodes[i];
        if (child.nodeType === 3) {
          if (!this.originalTextMap.has(child)) {
            this.originalTextMap.set(child, child.textContent || '');
          }
        } else if (child.nodeType === 1) {
          this.saveElementChildrenRecursively(child as HTMLElement);
        }
      }
    }
  }

  private restoreCompositeContainers(): void {
    const entries = Array.from(this.originalChildNodesMap.entries()).reverse();
    for (const [el, origChildren] of entries) {
      while (el.firstChild) el.removeChild(el.firstChild);
      for (const child of origChildren) {
        if (child.nodeType === 3 && this.originalTextMap.has(child)) {
          child.textContent = this.originalTextMap.get(child)!;
        }
        el.appendChild(child);
      }
    }
    this.originalChildNodesMap.clear();
  }

  private restoreSingleCompositeContainer(container: HTMLElement): void {
    const entries = Array.from(this.originalChildNodesMap.entries()).reverse();
    for (const [el, origChildren] of entries) {
      if (el === container || container.contains(el)) {
        while (el.firstChild) el.removeChild(el.firstChild);
        for (const child of origChildren) {
          if (child.nodeType === 3 && this.originalTextMap.has(child)) {
            child.textContent = this.originalTextMap.get(child)!;
          }
          el.appendChild(child);
        }
        this.originalChildNodesMap.delete(el);
      }
    }
  }

  private translateCompositeContainer(container: HTMLElement): boolean {
    if (this.originalChildNodesMap.has(container)) {
      this.restoreSingleCompositeContainer(container);
    }
    this.saveElementChildrenRecursively(container);

    const inlineElements: HTMLElement[] = [];
    const maskedText = this.buildMaskedSentence(container, inlineElements);

    const wsMatch = maskedText.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const leading = wsMatch ? wsMatch[1] : '';
    const trimmed = wsMatch ? wsMatch[2] : '';
    const trailing = wsMatch ? wsMatch[3] : '';
    if (!trimmed) return false;

    const translated = this.translateLocal(trimmed);
    if (!translated || translated === trimmed) return false;

    const fullTranslated = leading + translated + trailing;
    const newFragment = this.reassembleTranslatedSentence(fullTranslated, inlineElements);

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(newFragment);

    const fullText = container.textContent || '';
    if (fullText) {
      const cacheKey = `${this.currentTargetLang}:${fullText.trim()}`;
      if (!this.translationSpeechCache.has(cacheKey)) {
        this.translationSpeechCache.set(cacheKey, {
          spokenTranslation: fullText,
          phonetic: this.currentTargetLang.startsWith('ewo') ? getEwondoPhonetic(fullText) : '',
        });
      }
    }
    return true;
  }

  private translateNodeSubtree(rootNode: Node): void {
    if (!rootNode || !rootNode.isConnected) return;
    if (this.isExtensionNode(rootNode)) return;

    if (rootNode.nodeType === 3) { // Node.TEXT_NODE
      this.translateSingleTextNode(rootNode);
      return;
    }

    if (rootNode.nodeType === 1 || rootNode.nodeType === 11) { // Node.ELEMENT_NODE or DOCUMENT_FRAGMENT_NODE (ShadowRoot)
      const el = rootNode as HTMLElement;
      const tag = el.tagName?.toLowerCase();
      if (['script', 'style', 'code', 'pre', 'noscript'].includes(tag)) return;

      // Translate attributes on el itself (placeholders, button values, title, aria-label, alt)
      if (rootNode.nodeType === 1) {
        this.translateElementAttributes(el);
      }

      // Translate attributes on all inputs, textareas, elements with aria-label, title, or alt
      if (el.querySelectorAll) {
        const attrElements = el.querySelectorAll<HTMLElement>('input, textarea, [title], [aria-label], img[alt]');
        for (let i = 0; i < attrElements.length; i++) {
          this.translateElementAttributes(attrElements[i]);
        }
      }

      // Support Shadow DOM trees in custom Web Components (e.g., custom banking widgets)
      if ((el as any).shadowRoot && !this.isExtensionNode((el as any).shadowRoot)) {
        this.translateNodeSubtree((el as any).shadowRoot);
      }
      if (el.querySelectorAll) {
        const customElements = el.querySelectorAll<HTMLElement>('*');
        for (let i = 0; i < customElements.length; i++) {
          const shadow = (customElements[i] as any).shadowRoot;
          if (shadow && !this.isExtensionNode(shadow)) {
            this.translateNodeSubtree(shadow);
          }
        }
      }

      // Translate composite containers with mixed inline tags
      const translatedContainers = new Set<HTMLElement>();
      if (el.querySelectorAll) {
        const candidateContainers = el.querySelectorAll<HTMLElement>(ExtensionAssistant.CONTAINER_SELECTOR);
        for (let i = 0; i < candidateContainers.length; i++) {
          const c = candidateContainers[i];
          if (this.isExtensionNode(c)) continue;
          if (c.querySelector(ExtensionAssistant.CONTAINER_SELECTOR)) continue;

          const hasInline = Array.from(c.children).some((child) =>
            ExtensionAssistant.INLINE_TAGS.has((child.tagName || '').toUpperCase())
          );
          if (hasInline) {
            const didTranslate = this.translateCompositeContainer(c);
            if (didTranslate) {
              translatedContainers.add(c);
            }
          }
        }
      }

      const elTag = (el.tagName || '').toUpperCase();
      const isContainerBlock =
        ExtensionAssistant.CONTAINER_BLOCK_TAGS.has(elTag) ||
        (typeof el.matches === 'function' && el.matches(ExtensionAssistant.CONTAINER_SELECTOR));
      if (
        isContainerBlock &&
        !el.querySelector?.(ExtensionAssistant.CONTAINER_SELECTOR)
      ) {
        const hasInline = Array.from(el.children).some((child) =>
          ExtensionAssistant.INLINE_TAGS.has((child.tagName || '').toUpperCase())
        );
        if (hasInline && !translatedContainers.has(el)) {
          const didTranslate = this.translateCompositeContainer(el);
          if (didTranslate) {
            translatedContainers.add(el);
          }
        }
      }

      // Also check standalone <a> links with mixed inline elements not inside a block container
      if (el.querySelectorAll) {
        const candidateLinks = el.querySelectorAll<HTMLElement>('a');
        for (let i = 0; i < candidateLinks.length; i++) {
          const a = candidateLinks[i];
          if (this.isExtensionNode(a)) continue;
          if (a.closest(ExtensionAssistant.CONTAINER_SELECTOR)) continue;
          const hasInline = Array.from(a.children).some((child) =>
            ExtensionAssistant.INLINE_TAGS.has((child.tagName || '').toUpperCase())
          );
          if (hasInline && !translatedContainers.has(a)) {
            const didTranslate = this.translateCompositeContainer(a);
            if (didTranslate) {
              translatedContainers.add(a);
            }
          }
        }
      }

      // Walk all text nodes comprehensively across headings, paragraphs, buttons, table cells, spans, links, labels, modals
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const parentTag = parent.tagName?.toLowerCase();
          if (['script', 'style', 'code', 'pre', 'noscript'].includes(parentTag)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (this.isExtensionNode(parent)) return NodeFilter.FILTER_REJECT;

          for (const tc of translatedContainers) {
            if (tc.contains(node)) return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        },
      });

      let curr = walker.nextNode();
      while (curr) {
        this.translateSingleTextNode(curr);
        curr = walker.nextNode();
      }
    }
  }

  private translateSingleTextNode(node: Node): void {
    if (!this.originalTextMap.has(node)) {
      this.originalTextMap.set(node, node.textContent || '');
    }
    const sourceText = this.originalTextMap.get(node) || node.textContent || '';
    const trimmed = sourceText.trim();
    if (trimmed) {
      const match = sourceText.match(/^(\s*)([\s\S]*?)(\s*)$/);
      const leading = match ? match[1] : '';
      const trailing = match ? match[3] : '';
      const translated = this.translateLocal(trimmed);
      if (translated && translated !== trimmed) {
        node.textContent = leading + translated + trailing;
        // Warm up speech cache for instant hover reading without delay
        const cacheKey = `${this.currentTargetLang}:${translated.trim()}`;
        if (!this.translationSpeechCache.has(cacheKey)) {
          this.translationSpeechCache.set(cacheKey, {
            spokenTranslation: translated,
            phonetic: this.currentTargetLang.startsWith('ewo') ? getEwondoPhonetic(translated) : '',
          });
        }
      } else {
        // Reset to original sourceText if no translation for this language
        node.textContent = sourceText;
      }
    }
  }

  public translateFullPage(): void {
    this.isTranslating = true;
    try {
      this.speechPlayer.prewarm();
      this.translateNodeSubtree(document.body);
      this.isPageTranslated = true;
      this.render();

      // Proactive zero-latency pre-caching: pre-fetch neural audio for top visible headings and key sections
      this.precacheVisibleSections();
      if (this.mutationObserver) {
        this.mutationObserver.takeRecords();
      }
    } finally {
      this.isTranslating = false;
    }
  }

  private precacheVisibleSections(): void {
    try {
      if (typeof window === 'undefined' || !document.body) return;
      const elements = Array.from(
        document.querySelectorAll('h1, h2, h3, button, [role="button"]')
      ) as HTMLElement[];

      const candidates: string[] = [];
      for (const el of elements) {
        if (this.isExtensionNode(el)) continue;
        const text = (el.innerText || el.textContent || '').trim();
        if (text.length >= 2 && text.length <= 60 && !candidates.includes(text)) {
          candidates.push(text);
          if (candidates.length >= 3) break;
        }
      }

      candidates.forEach((t, index) => {
        const translated = this.translateLocal(t);
        const speechText = (translated || t).trim();
        if (index === 0) {
          this.speechPlayer.precache(speechText, this.currentTargetLang);
        } else {
          setTimeout(() => {
            this.speechPlayer.precache(speechText, this.currentTargetLang);
          }, index * 300);
        }
      });
    } catch {
      // Ignored
    }
  }

  public restorePage(): void {
    this.isTranslating = true;
    try {
      // 1. Restore composite containers with inline tags to pristine DOM child node order
      this.restoreCompositeContainers();

      // 2. Restore individual text nodes
      for (const [node, original] of this.originalTextMap.entries()) {
        if (node.nodeType === 3 && node.isConnected) {
          node.textContent = original;
        }
      }

      // 2. Restore input/textarea placeholders, button values, title, aria-label, alt
      for (const [el, orig] of this.originalAttrMap.entries()) {
        if (el.isConnected) {
          const inputEl = el as any;
          const tag = (el.tagName || '').toLowerCase();
          if (orig.placeholder !== undefined && (tag === 'input' || tag === 'textarea')) {
            inputEl.placeholder = orig.placeholder;
          }
          if (orig.value !== undefined && tag === 'input') {
            inputEl.value = orig.value;
          }
          if (orig.title !== undefined) {
            el.setAttribute('title', orig.title);
          }
          if (orig.ariaLabel !== undefined) {
            el.setAttribute('aria-label', orig.ariaLabel);
          }
          if (orig.alt !== undefined && tag === 'img') {
            el.setAttribute('alt', orig.alt);
          }
        }
      }

      this.isPageTranslated = false;
      this.clearHoverState();
      this.speechPlayer.stop();
      this.render();
      if (this.mutationObserver) {
        this.mutationObserver.takeRecords();
      }
    } finally {
      this.isTranslating = false;
    }
  }

  private render() {
    if (!this.shadow) return;

    const vw = typeof window !== 'undefined' ? window.innerWidth || 1024 : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight || 768 : 768;
    const openDownward = this.customPos ? this.customPos.top < vh / 2 : false;
    const openRightward = this.customPos ? this.customPos.left < vw / 2 : false;
    const voiceActive = this.isVoiceEnabled();

    const launcherIconSvg = voiceActive
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6be18c" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6" stroke="#6be18c"/></svg>';

    this.shadow.innerHTML = `
      <style>
        .assistant-btn {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: #111111;
          color: #ffffff;
          border: 1.5px solid ${voiceActive ? '#22c55e' : '#15803d'};
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          user-select: none;
          touch-action: none;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .assistant-btn:active {
          cursor: grabbing;
        }
        .assistant-btn:hover {
          transform: scale(1.04);
          background: #1f2937;
        }
        .assistant-btn.active-speak {
          background: #0f291a;
          border: 2px solid #22c55e;
          box-shadow: 0 4px 16px rgba(21, 128, 61, 0.35);
        }
        .voice-dot {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${voiceActive ? '#22c55e' : 'transparent'};
          box-shadow: ${voiceActive ? '0 0 6px #22c55e' : 'none'};
        }
        .drag-grip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: grab;
          user-select: none;
          touch-action: none;
          padding: 4px 6px;
          margin: -6px -4px 8px;
          border-radius: 6px;
          color: #6b7280;
          font-size: 11px;
          font-weight: 600;
        }
        .drag-grip:hover {
          background: #f3f4f6;
          color: #111827;
        }
        .drag-grip:active {
          cursor: grabbing;
        }
        .btn-disable-site {
          width: 100%;
          margin-top: 10px;
          padding: 7px 10px;
          border-radius: 6px;
          border: 1px dashed #d1d5db;
          background: transparent;
          color: #4b5563;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-disable-site:hover {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #b91c1c;
        }
        .card {
          display: ${this.isOpen ? 'block' : 'none'};
          position: absolute;
          ${openDownward ? 'top: 64px; bottom: auto;' : 'bottom: 64px; top: auto;'}
          ${openRightward ? 'left: 0; right: auto;' : 'right: 0; left: auto;'}
          width: min(360px, calc(100vw - 48px));
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          color: #111827;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 14px;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        .badge-nat {
          font-size: 11px;
          font-weight: 600;
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .btn-action {
          width: 100%;
          padding: 9px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-sizing: border-box;
          transition: background 0.15s ease;
        }
        .btn-action:hover {
          background: #f9fafb;
        }
        .btn-action.primary {
          background: #111;
          color: #ffffff;
          border-color: #111;
        }
        .btn-action.primary:hover {
          background: #292929;
        }
        .btn-action.speak-toggle {
          background: ${voiceActive ? '#15803d' : '#f9fafb'};
          color: ${voiceActive ? '#ffffff' : '#111827'};
          border-color: ${voiceActive ? '#15803d' : '#d1d5db'};
        }
        .speak-hint {
          display: ${voiceActive ? 'block' : 'none'};
          margin-top: 8px;
          padding: 8px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          color: #15803d;
          font-size: 11px;
          line-height: 1.4;
        }
        .lb-quick{border:1px solid #e0e3e7;border-radius:8px;background:#f7f8f9;padding:7px 9px;font-size:11px;cursor:pointer}
        .preview-box {
          display: none;
          margin-top: 10px;
          padding: 10px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 12px;
        }
        /* Floating Audio Player Subtitle Bar */
        .audio-bar {
          display: none;
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #111827;
          color: #ffffff;
          border-radius: 8px;
          padding: 10px 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
          align-items: center;
          gap: 12px;
          z-index: 2147483647;
          max-width: 90vw;
          border: 1px solid #374151;
        }
        .audio-btn {
          background: #111;
          color: #ffffff;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }
        .audio-btn:hover {
          background: #292929;
        }
        .audio-btn.stop-btn {
          background: #374151;
          color: #ffffff;
        }
        .audio-btn.stop-btn:hover {
          background: #4b5563;
        }
      </style>

      <div class="card">
        <div class="drag-grip" id="lb-drag-handle" title="Glisser pour déplacer LinguaBridge">
          <span style="display:inline-flex;align-items:center;gap:5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            Déplacer l'assistant
          </span>
          <span style="font-size:10px;color:#9ca3af;">glisser</span>
        </div>
        <div style="display:flex;gap:5px;background:#f3f4f6;padding:4px;border-radius:10px;margin-bottom:14px;">
          <button id="lb-tab-translate" style="flex:1;border:0;padding:10px;border-radius:8px;background:${this.activePanel === 'translate' ? '#fff' : 'transparent'};cursor:pointer;font-weight:650;">Traduction</button>
          <button id="lb-tab-assistant" style="flex:1;border:0;padding:10px;border-radius:8px;background:${this.activePanel === 'assistant' ? '#fff' : 'transparent'};cursor:pointer;font-weight:650;">Assistant</button>
        </div>
        <div style="display:${this.activePanel === 'translate' ? 'block' : 'none'};">
        <div class="header">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>LinguaBridge</span>
            <span class="badge-nat">${this.getLangBadgeName(this.currentTargetLang)}</span>
          </div>
          <button id="close-card" style="background:none;border:none;cursor:pointer;color:#6b7280;font-size:16px;">✕</button>
        </div>

        <div style="margin-bottom: 8px;">
          <label style="font-weight: 600; font-size: 12px; color: #4b5563;">Langue maternelle :</label>
          <select id="target-lang" style="width: 100%; padding: 7px; border-radius: 6px; border: 1px solid #d1d5db; margin-top: 4px; font-size: 13px; font-weight: 600; background: #ffffff;">
            <option value="ewo-CM" ${this.currentTargetLang === 'ewo-CM' ? 'selected' : ''}>Ewondo (Centre, Sud, Est)</option>
            <option value="fuv-CM" ${this.currentTargetLang === 'fuv-CM' ? 'selected' : ''}>Fulfulde / Peul (Grand Nord, CEMAC)</option>
            <option value="hau-CM" ${this.currentTargetLang === 'hau-CM' ? 'selected' : ''}>Haoussa (Grand Nord, Corridors)</option>
            <option value="knc-CM" ${this.currentTargetLang === 'knc-CM' ? 'selected' : ''}>Kanuri (Extrême-Nord, Lac Tchad)</option>
            <option value="pcm-CM" ${this.currentTargetLang === 'pcm-CM' ? 'selected' : ''}>Pidgin English (NO, SO, Marchés)</option>
          </select>
          <p style="font-size:11px;color:#667085;margin-top:9px;">Français et anglais détectés automatiquement. Vérifiez les montants avant une transaction.</p>
        </div>

        <div style="margin-top: 10px;">
          ${
            this.isPageTranslated
              ? `<button class="btn-action" id="btn-restore"><span></span><span>Restaurer le texte d'origine</span></button>`
              : `<button class="btn-action primary" id="btn-translate-page"><span></span><span>Traduire toute la page</span></button>`
          }
        </div>

        <button class="btn-action speak-toggle" id="btn-toggle-speak">
          <span></span>
          <span>${this.isTouchSpeakEnabled ? 'Désactiver la lecture au toucher' : 'Activer la lecture sur demande'}</span>
        </button>

        <div class="speak-hint">
          <strong>Mode vocal actif :</strong> Survolez, touchez ou cliquez sur n'importe quelle section pour l'écouter en langue maternelle.
        </div>

        <div id="selection-preview" class="preview-box"></div>
        <button type="button" class="btn-disable-site" id="btn-disable-site" title="Masquer et désactiver LinguaBridge sur ce site">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
          Désactiver sur ce site
        </button>
        </div>
        <div style="display:${this.activePanel === 'assistant' ? 'block' : 'none'};">
          <div class="header"><span>Assistant financier</span><button id="lb-close-chat" style="border:0;background:transparent;cursor:pointer;">Fermer</button></div>
          <p style="font-size:12px;color:#667085;">Questions bancaires courantes. Réponses locales limitées.</p>
          <div id="lb-chat-log" style="height:200px;overflow:auto;display:flex;flex-direction:column;gap:9px;margin:12px 0;"></div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;"><button class="lb-quick" data-question="Comment envoyer de l’argent ?">Transfert</button><button class="lb-quick" data-question="Comment consulter mon solde ?">Solde</button><button class="lb-quick" data-question="Quels sont les frais de retrait ?">Frais</button><button class="lb-quick" data-question="Comment sécuriser mon compte ?">Sécurité</button></div>
          <form id="lb-chat-form" style="display:flex;gap:6px;"><input id="lb-chat-input" maxlength="500" placeholder="Votre question..." style="flex:1;min-width:0;border:1px solid #d0d5dd;border-radius:8px;padding:9px;"><button type="submit" style="background:#111;color:#fff;border:0;border-radius:8px;padding:9px;">Envoyer</button></form>
          <p style="font-size:11px;color:#667085;">Ne communiquez jamais votre PIN ou mot de passe.</p>
        </div>
      </div>

      <button class="assistant-btn ${voiceActive ? 'active-speak' : ''}" id="btn-toggle" title="LinguaBridge - Glisser pour déplacer, clic gauche pour ouvrir, clic droit pour désactiver sur ce site">
        ${launcherIconSvg}
        <span class="voice-dot"></span>
      </button>

      <!-- Bottom floating speech indicator bar -->
      <div id="audio-bar" class="audio-bar" style="${this.activeBarState.visible ? 'display:flex;' : ''}">
        <span style="font-size: 16px;"></span>
        <div style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <div id="audio-spoken-text" style="font-weight: 700; font-size: 13px; color: #ffffff;">${this.activeBarState.visible ? this.activeBarState.text : ''}</div>
          <div id="audio-phonetic" style="font-size: 11px; color: #86efac; font-style: italic;">${this.activeBarState.visible && this.activeBarState.phonetic ? `[${this.activeBarState.phonetic}]` : ''}</div>
        </div>
        <button class="audio-btn" id="audio-replay">Rejouer</button>
        <button class="audio-btn stop-btn" id="audio-stop">Arrêter</button>
        <button id="audio-close" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:14px;padding:2px 6px;">✕</button>
      </div>
    `;

    // Attach listeners
    const btnToggle = this.shadow.getElementById('btn-toggle');
    const dragHandle = this.shadow.getElementById('lb-drag-handle');

    const startDrag = (e: MouseEvent) => {
      if (e.button !== 0 || !this.container) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = this.container.getBoundingClientRect();
      const origLeft = this.customPos ? this.customPos.left : (rect.left || (typeof window !== 'undefined' ? window.innerWidth - 76 : 900));
      const origTop = this.customPos ? this.customPos.top : (rect.top || (typeof window !== 'undefined' ? window.innerHeight - 76 : 600));
      let moved = false;

      if (this.onDragMoveHandler) window.removeEventListener('mousemove', this.onDragMoveHandler);
      if (this.onDragEndHandler) window.removeEventListener('mouseup', this.onDragEndHandler);

      this.onDragMoveHandler = (moveEvt: MouseEvent) => {
        const dx = moveEvt.clientX - startX;
        const dy = moveEvt.clientY - startY;
        if (!moved && Math.hypot(dx, dy) < 5) return;
        moved = true;
        this.applyContainerPosition(origLeft + dx, origTop + dy);
      };

      this.onDragEndHandler = (endEvt?: MouseEvent) => {
        if (this.onDragMoveHandler) {
          window.removeEventListener('mousemove', this.onDragMoveHandler);
          this.onDragMoveHandler = null;
        }
        if (this.onDragEndHandler) {
          window.removeEventListener('mouseup', this.onDragEndHandler);
          this.onDragEndHandler = null;
        }
        if (moved) {
          if (endEvt && typeof endEvt.clientX === 'number') {
            const dx = endEvt.clientX - startX;
            const dy = endEvt.clientY - startY;
            this.applyContainerPosition(origLeft + dx, origTop + dy);
          }
          this.dragSuppressClick = true;
          setTimeout(() => { this.dragSuppressClick = false; }, 60);
          if (this.customPos && typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.set({ linguabridgeWidgetPos: this.customPos });
          }
          this.render();
        }
      };

      window.addEventListener('mousemove', this.onDragMoveHandler);
      window.addEventListener('mouseup', this.onDragEndHandler);
    };

    btnToggle?.addEventListener('mousedown', startDrag);
    dragHandle?.addEventListener('mousedown', startDrag);

    btnToggle?.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      if (this.isSiteDisabled) {
        this.enableOnCurrentSite();
      } else {
        this.disableOnCurrentSite(true);
      }
    });

    btnToggle?.addEventListener('click', (e: MouseEvent) => {
      (e as any).__lbInside = true;
      e.stopPropagation();
      if (this.dragSuppressClick) {
        this.dragSuppressClick = false;
        return;
      }
      this.speechPlayer.prewarm();
      this.isOpen = !this.isOpen;
      this.render();
    });

    this.shadow.getElementById('close-card')?.addEventListener('click', () => {
      this.isOpen = false;
      this.render();
    });

    this.shadow.getElementById('btn-translate-page')?.addEventListener('click', () => {
      this.speechPlayer.prewarm();
      this.translateFullPage();
    });

    this.shadow.getElementById('btn-restore')?.addEventListener('click', () => {
      this.restorePage();
    });

    this.shadow.getElementById('btn-toggle-speak')?.addEventListener('click', () => {
      this.speechPlayer.prewarm();
      this.toggleTouchSpeakMode();
    });

    this.shadow.getElementById('btn-disable-site')?.addEventListener('click', () => {
      this.disableOnCurrentSite(true);
    });



    this.shadow.getElementById('target-lang')?.addEventListener('change', (e) => {
      this.currentTargetLang = (e.target as HTMLSelectElement).value;
      this.currentSourceLang = this.detectSourceLanguage();
      chrome.storage?.local?.set({ linguabridgeTargetLang: this.currentTargetLang });
      this.translationSpeechCache.clear();
      this.stopSpeech();
      if (this.isPageTranslated) {
        this.translateFullPage();
      } else {
        this.render();
      }
    });

    this.shadow.getElementById('lb-tab-translate')?.addEventListener('click', () => { this.activePanel = 'translate'; this.render(); });
    this.shadow.getElementById('lb-tab-assistant')?.addEventListener('click', () => { this.activePanel = 'assistant'; this.render(); });
    this.shadow.getElementById('lb-close-chat')?.addEventListener('click', () => { this.isOpen = false; this.render(); });
    const chatLog = this.shadow.getElementById('lb-chat-log');
    if (chatLog) {
      const history = this.chatHistory.length ? this.chatHistory : [{ role: 'assistant', text: 'Bonjour. Posez une question sur un transfert, un solde ou la sécurité.' }];
      for (const message of history) {
        const item = document.createElement('div');
        item.textContent = message.text;
        item.style.cssText = 'max-width:90%;padding:10px;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere;background:' + (message.role === 'user' ? '#111;color:#fff;align-self:flex-end' : '#f2f3f5;color:#111;align-self:flex-start');
        chatLog.appendChild(item);
      }
      chatLog.scrollTop = chatLog.scrollHeight;
    }
    const ask = (question: string) => {
      if (!question.trim()) return;
      const response = generateBankingResponse(question.trim(), this.currentTargetLang);
      this.chatHistory.push({ role: 'user', text: question.trim() }, { role: 'assistant', text: response.text });
      this.render();
    };
    this.shadow.getElementById('lb-chat-form')?.addEventListener('submit', e => { e.preventDefault(); ask((this.shadow?.getElementById('lb-chat-input') as HTMLInputElement)?.value || ''); });
    this.shadow.querySelectorAll<HTMLButtonElement>('.lb-quick').forEach(b => b.addEventListener('click', () => ask(b.dataset.question || '')));

    // Audio bar controls
    this.shadow.getElementById('audio-replay')?.addEventListener('click', () => {
      const text = this.shadow?.getElementById('audio-spoken-text')?.textContent || '';
      const phonetic = this.shadow?.getElementById('audio-phonetic')?.textContent?.replace(/[\[\]]/g, '') || '';
      this.speechPlayer.speak(text, phonetic, undefined, this.currentTargetLang);
    });

    this.shadow.getElementById('audio-stop')?.addEventListener('click', () => {
      this.stopSpeech();
    });

    this.shadow.getElementById('audio-close')?.addEventListener('click', () => {
      this.stopSpeech();
      this.activeBarState = { visible: false, text: '', phonetic: '' };
      const bar = this.shadow?.getElementById('audio-bar');
      if (bar) bar.style.display = 'none';
    });
  }

  public destroy(): void {
    document.documentElement.removeAttribute('data-linguabridge-extension');
    this.stopSpeech();
    if (this.isPageTranslated) {
      this.restorePage();
    }
    this.clearHoverState();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
      this.shadow = null;
    }
    if (this.onMouseUpHandler) {
      document.removeEventListener('mouseup', this.onMouseUpHandler);
      this.onMouseUpHandler = null;
    }
    if (this.onClickOutsideHandler) {
      document.removeEventListener('click', this.onClickOutsideHandler);
      this.onClickOutsideHandler = null;
    }
    if (this.onRuntimeMessageHandler && typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.removeListener(this.onRuntimeMessageHandler);
      this.onRuntimeMessageHandler = null;
    }
    if (this.onMouseOverHandler) {
      document.removeEventListener('mouseover', this.onMouseOverHandler, true);
      document.removeEventListener('pointerover', this.onMouseOverHandler as any, true);
      this.onMouseOverHandler = null;
    }
    if (this.onMouseOutHandler) {
      document.removeEventListener('mouseout', this.onMouseOutHandler, true);
      document.removeEventListener('pointerout', this.onMouseOutHandler as any, true);
      this.onMouseOutHandler = null;
    }
    if (this.onClickElementHandler) {
      document.removeEventListener('click', this.onClickElementHandler, true);
      this.onClickElementHandler = null;
    }
    if (this.onTouchEndHandler) {
      document.removeEventListener('touchend', this.onTouchEndHandler, true);
      this.onTouchEndHandler = null;
    }
    if (this.onFirstInteractionHandler) {
      window.removeEventListener('pointerdown', this.onFirstInteractionHandler);
      window.removeEventListener('keydown', this.onFirstInteractionHandler);
      this.onFirstInteractionHandler = null;
    }
    if (this.onDragMoveHandler) {
      window.removeEventListener('mousemove', this.onDragMoveHandler);
      this.onDragMoveHandler = null;
    }
    if (this.onDragEndHandler) {
      window.removeEventListener('mouseup', this.onDragEndHandler);
      this.onDragEndHandler = null;
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.mutationDebounceTimeout) {
      clearTimeout(this.mutationDebounceTimeout);
      this.mutationDebounceTimeout = null;
    }
    this.pendingMutations.clear();
    this.originalTextMap.clear();
    this.originalAttrMap.clear();
    this.translationSpeechCache.clear();
  }
}

// Instantiate assistant if in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  new ExtensionAssistant();
}

export { ExtensionAssistant };
