import type { TranslationResult } from '@linguabridge/shared-types';
import { generateBankingResponse } from '../../../packages/widget/src/banking-engine';
import { translateLocalText, getEwondoPhonetic } from '@linguabridge/translation-engine';
import { estimateSitePages, type SiteSizeEstimate } from './site-size';

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
  private audioUnlocked = false;
  private activeSource: AudioBufferSourceNode | null = null;
  private activeAudio: HTMLAudioElement | null = null;
  private onEndCallback: (() => void) | null = null;
  private currentUtteranceId = 0;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private audioBufferCache = new Map<string, AudioBuffer>();
  private readonly unlockAudio = () => {
    this.audioUnlocked = true;
    this.ensureAudioContext();
  };

  constructor(private readonly onAvailability?: (available: boolean, reason?: string) => void) {
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', this.unlockAudio, { capture: true, passive: true });
      window.addEventListener('click', this.unlockAudio, { capture: true, passive: true });
      window.addEventListener('keydown', this.unlockAudio, { capture: true, passive: true });
      window.addEventListener('touchend', this.unlockAudio, { capture: true, passive: true });
    }
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('pointerdown', this.unlockAudio, true);
    window.removeEventListener('click', this.unlockAudio, true);
    window.removeEventListener('keydown', this.unlockAudio, true);
    window.removeEventListener('touchend', this.unlockAudio, true);
    void this.audioCtx?.close?.();
    this.audioCtx = null;
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
    // Chrome only permits Web Audio startup after a gesture in this page.
    if (!this.audioUnlocked) return;
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
    if (targetLang === 'en' || targetLang === 'fr') {
      this.playBrowserVoice(clauseText, targetLang, thisId, onClauseEnd);
      return;
    }
    const cacheKey = `${targetLang}:${clauseText.toLowerCase()}`;

    // 1. FAST PATH (<1ms): Instant playback from decoded AudioBuffer cache
    const cachedBuffer = this.audioBufferCache.get(cacheKey);
    if (cachedBuffer) {
      this.playBuffer(cachedBuffer, thisId, onClauseEnd);
      return;
    }

    // Direct background service worker synthesis
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        {
          type: 'SYNTHESIZE_SPEECH',
          text: clauseText,
          lang: targetLang,
        },
        async (res: any) => {
          if (this.currentUtteranceId !== thisId) return;
          if (res?.success && res.result?.audioUrl) {
            this.onAvailability?.(true);
            await this.playNeuralAudio(res.result.audioUrl, thisId, clauseText, targetLang, cacheKey, onClauseEnd);
          } else {
            const reason = chrome.runtime.lastError
              ? 'Extension rechargée. Actualisez cet onglet avant de réessayer.'
              : typeof res?.error === 'string' ? res.error : 'La requête vocale n’a pas répondu.';
            this.onAvailability?.(false, reason);
            console.warn('[LinguaBridge Speech] Speech unavailable:', reason);
            onClauseEnd();
          }
        }
      );
      return;
    }

    // Fallback if running outside extension environment (e.g. standalone test page)
    fetch(`http://127.0.0.1:3002/synthesize?lang=${encodeURIComponent(targetLang)}&text=${encodeURIComponent(clauseText)}`)
      .then((r) => r.json())
      .then(async (data: any) => {
        if (this.currentUtteranceId !== thisId) return;
        if (data?.audioBase64) {
          const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
          await this.playNeuralAudio(audioUrl, thisId, clauseText, targetLang, cacheKey, onClauseEnd);
        } else {
          onClauseEnd();
        }
      })
      .catch(() => {
        onClauseEnd();
      });
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
      void this.audioCtx.resume().then(() => {
        if (this.currentUtteranceId === thisId && this.audioCtx?.state === 'running') {
          this.playBuffer(audioBuffer, thisId, onEnd);
        } else {
          this.onAvailability?.(false, 'Chrome a bloqué le son. Cliquez sur la page, puis réessayez.');
        }
      }).catch(() => this.onAvailability?.(false, 'Chrome a bloqué le son. Cliquez sur la page, puis réessayez.'));
      return;
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
    if (typeof window === 'undefined' || !text || targetLang === 'en' || targetLang === 'fr') return;
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
    // Strategy 1: Decode base64 WAV into Web Audio buffer (bypasses CSP media-src blocks)
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass && this.audioUnlocked && audioUrl.startsWith('data:audio/wav;base64,')) {
        this.ensureAudioContext();
        if (!this.audioCtx) throw new Error('AudioContext unavailable');
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
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
        this.onAvailability?.(false, 'Le fichier audio reçu ne peut pas être lu par Chrome.');
        if (onEnd) {
          onEnd();
        } else {
          this.finishUtterance(thisId);
        }
      };

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          this.onAvailability?.(false, 'Chrome a bloqué la lecture. Cliquez une fois sur la page, puis réessayez.');
          if (onEnd) {
            onEnd();
          } else {
            this.finishUtterance(thisId);
          }
        });
      }
    } catch {
      this.onAvailability?.(false, 'Chrome n’a pas pu démarrer la lecture audio.');
      if (onEnd) {
        onEnd();
      } else {
        this.finishUtterance(thisId);
      }
    }
  }

  private playBrowserVoice(text: string, targetLang: string, thisId: number, onEnd?: () => void): void {
    // Browser voices are used only for English and French. African targets keep
    // using the hosted voices so a European voice never reads those languages.
    if ((targetLang !== 'en' && targetLang !== 'fr') || !window.speechSynthesis ||
        typeof SpeechSynthesisUtterance === 'undefined') {
      if (onEnd) onEnd();
      else this.finishUtterance(thisId);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang === 'fr' ? 'fr-FR' : 'en-US';
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith(targetLang));
    if (voice) utterance.voice = voice;
    this.activeUtterance = utterance;
    utterance.onstart = () => { if (this.currentUtteranceId === thisId) this.isPlaying = true; };
    utterance.onend = () => {
      if (this.currentUtteranceId !== thisId) return;
      this.isPlaying = false;
      this.activeUtterance = null;
      this.onAvailability?.(true);
      if (onEnd) onEnd();
      else this.finishUtterance(thisId);
    };
    utterance.onerror = () => {
      if (this.currentUtteranceId !== thisId) return;
      this.onAvailability?.(false, 'Voix du navigateur indisponible. Cliquez sur la page, puis réessayez.');
      if (onEnd) onEnd();
      else this.finishUtterance(thisId);
    };
    window.speechSynthesis.speak(utterance);
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
  private compositeSourceMap = new Map<HTMLElement, string>();
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
  private enhancedEnabled = false;
  private enhancedGeneration = 0;
  private enhancedTimer: ReturnType<typeof setTimeout> | null = null;
  private enhancedCache = new Map<string, string>();
  private enhancedInFlight = new Set<string>();
  private pageWorkload = { segments: 0, characters: 0, linkedPages: 0 };
  private siteSizePromise: Promise<SiteSizeEstimate> | null = null;

  private translateLocal(text: string): string {
    return translateLocalText(text, this.currentSourceLang, this.currentTargetLang).translatedText;
  }

  private currentSourceLang = typeof document !== 'undefined' && document.documentElement?.lang?.toLowerCase().startsWith('en') ? 'en' : 'fr';
  private isOpen = false;
  private activePanel: 'translate' | 'assistant' = 'translate';
  private chatHistory: Array<{ role: 'user' | 'assistant'; text: string }> = [];
  private lastSelection = '';
  private isTouchSpeakEnabled = false;
  private speechPlayer = new EwondoSpeechPlayer((available, reason) => this.updateVoiceAvailability(available, reason));
  private voiceAvailable: boolean | null = null;
  private voiceFailureReason: string | null = null;

  private updateVoiceAvailability(available: boolean, reason?: string): void {
    this.voiceAvailable = available;
    this.voiceFailureReason = available ? null : reason || 'Voix indisponible. Vérifiez la clé API et le serveur.';
    const hint = this.shadow?.getElementById('voice-status');
    if (hint) hint.textContent = available
      ? 'Voix prête.'
      : this.voiceFailureReason;
  }

  // Instant speech & phonetic cache to eliminate voice latency
  private translationSpeechCache = new Map<string, { spokenTranslation: string; phonetic: string }>();

  // Hover-to-speak tracking & debouncing ("survoler une section ça parle seul, une fois")
  private hoverDwellTimeout: any = null;
  private currentHoveredEl: HTMLElement | null = null;
  private currentSpokenEl: HTMLElement | null = null;
  private lastSpokenEl: HTMLElement | null = null;

  // Lightweight debounced MutationObserver for dynamic SPA banking portals (Afriland, BICEC, Ecobank, UBA, Orange Money)
  private mutationObserver: MutationObserver | null = null;
  private observedRoots = new WeakSet<Node>();
  private mutationDebounceTimeout: any = null;
  private pendingMutations: Set<Node> = new Set();
  private isTranslating = false;

  private onMouseUpHandler: (() => void) | null = null;
  private onRuntimeMessageHandler: ((msg: any, sender?: any, sendResponse?: (response: any) => void) => boolean | void) | null = null;
  private onMouseOverHandler: ((e: MouseEvent) => void) | null = null;
  private onMouseOutHandler: ((e: MouseEvent) => void) | null = null;
  private onClickElementHandler: ((e: MouseEvent) => void) | null = null;
  private onTouchEndHandler: ((e: TouchEvent) => void) | null = null;
  private onFirstInteractionHandler: (() => void) | null = null;

  constructor() {
    this.init();
  }

  public getLangBadgeName(lang: string): string {
    switch (lang) {
      case 'en': return 'EN English';
      case 'fr': return 'FR Français';
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
    const french = (sample.match(/\b(le|la|les|des|vous|votre|pour|avec|compte|solde|frais|envoyer)\b/g) || []).length;
    const english = (sample.match(/\b(the|your|account|balance|fees|send|transfer|with|from|payment)\b/g) || []).length;
    return english > french ? 'en' : 'fr';
  }

  public isVoiceEnabled(): boolean {
    return this.isTouchSpeakEnabled;
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

      // Every matching frame translates its own DOM; only the top frame owns the UI.
      if (window === window.top) {
        this.container = document.createElement('div');
        this.container.id = 'linguabridge-extension-root';
        this.container.style.all = 'initial';
        this.container.style.position = 'fixed';
        this.container.style.bottom = '24px';
        this.container.style.right = '24px';
        this.container.style.zIndex = '2147483646';

        this.shadow = this.container.attachShadow({ mode: 'open' });
        this.render();
        target.appendChild(this.container);
        document.documentElement.setAttribute('data-linguabridge-extension', 'active');
      }
      this.pageWorkload = this.measurePageWorkload();
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['linguabridgeTargetLang', 'linguabridgeAudioEnabled', 'linguabridgeAutoTranslate', 'linguabridgeEnhancedTranslation'], (settings) => {
          if (settings.linguabridgeTargetLang) this.currentTargetLang = settings.linguabridgeTargetLang;
          this.isTouchSpeakEnabled = settings.linguabridgeAudioEnabled === true;
          this.enhancedEnabled = settings.linguabridgeEnhancedTranslation === true ||
            this.currentTargetLang === 'en' || this.currentTargetLang === 'fr';
          this.render();
          if (settings.linguabridgeAutoTranslate === true) this.translateFullPage();
        });
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
      this.onRuntimeMessageHandler = (msg: any, _sender?: any, sendResponse?: (response: any) => void) => {
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
          if (this.currentTargetLang === 'en' || this.currentTargetLang === 'fr') this.enhancedEnabled = true;
          this.voiceAvailable = null;
          this.voiceFailureReason = null;
          if (this.isPageTranslated) this.translateFullPage();
          else this.render();
        } else if (msg.type === 'POPUP_SET_ENHANCED_TRANSLATION') {
          this.enhancedEnabled = msg.enabled === true || this.currentTargetLang === 'en' || this.currentTargetLang === 'fr';
          this.enhancedCache.clear();
          if (this.isPageTranslated && this.enhancedEnabled) this.scheduleEnhancedTranslation();
        } else if (msg.type === 'GET_PAGE_METRICS') {
          const latest = this.measurePageWorkload();
          if (latest.linkedPages !== this.pageWorkload.linkedPages) this.siteSizePromise = null;
          this.pageWorkload = latest;
          sendResponse?.(this.pageWorkload);
        } else if (msg.type === 'GET_SITE_SIZE' && window === window.top) {
          this.pageWorkload = this.measurePageWorkload();
          this.siteSizePromise ||= estimateSitePages(location.href, this.pageWorkload.linkedPages);
          void this.siteSizePromise.then((estimate) => sendResponse?.(estimate));
          return true;
        } else if (msg.type === 'POPUP_SET_SPEECH') {
          this.isTouchSpeakEnabled = msg.enabled === true;
          if (!this.isTouchSpeakEnabled) this.clearHoverState();
          this.render();
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

      // Never intercept a banking site's normal click action.
      if (target.closest('button, a, input, select, textarea, label, [role="button"], [contenteditable]')) return;
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

      // Preserve native touch interactions on financial forms and controls.
      if (target.closest('button, a, input, select, textarea, label, [role="button"], [contenteditable]')) return;
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
  }

  public toggleTouchSpeakMode(): void {
    this.isTouchSpeakEnabled = !this.isTouchSpeakEnabled;
    if (typeof chrome !== 'undefined' && chrome.storage?.local) chrome.storage.local.set({ linguabridgeAudioEnabled: this.isTouchSpeakEnabled });
    if (this.isTouchSpeakEnabled) this.speechPlayer.prewarm();
    if (!this.isVoiceEnabled()) {
      this.clearHoverState();
      this.speechPlayer.stop();
      const bar = this.shadow?.getElementById('audio-bar');
      if (bar) bar.style.display = 'none';
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
    const bar = this.shadow?.getElementById('audio-bar');
    if (!bar) return;

    bar.style.display = 'flex';
    const textEl = this.shadow?.getElementById('audio-spoken-text');
    const phonEl = this.shadow?.getElementById('audio-phonetic');
    if (textEl) textEl.textContent = text;
    if (phonEl) phonEl.textContent = phonetic ? `[${phonetic}]` : '';
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
            this.observeOpenShadowRoots(node);
            this.pendingMutations.add(node);
            hasRelevantMutations = true;
          }
        } else if (m.type === 'characterData') {
          const target = m.target;
          if (this.isExtensionNode(target)) continue;
          const text = this.originalTextMap.get(target);
          if (text !== undefined && target.textContent !== this.translateLocal(text)) {
            this.originalTextMap.set(target, target.textContent ?? '');
          }
          this.pendingMutations.add(target);
          hasRelevantMutations = true;
        } else if (m.type === 'attributes') {
          const el = m.target as HTMLElement;
          if (this.isExtensionNode(el)) continue;
          const key = ({ 'aria-label': 'ariaLabel' } as Record<string, string>)[m.attributeName || ''] || m.attributeName;
          const original = this.originalAttrMap.get(el);
          if (original && key && Object.prototype.hasOwnProperty.call(original, key)) {
            this.originalAttrMap.set(el, { ...original, [key]: el.getAttribute(m.attributeName!) ?? '' });
          }
          this.pendingMutations.add(el);
          hasRelevantMutations = true;
        }
      }

      if (hasRelevantMutations) {
        this.scheduleDebouncedMutation();
      }
    });

    this.observeRoot(document.body);
    this.observeOpenShadowRoots(document.body);
  }

  private observeRoot(root: Node): void {
    if (!this.mutationObserver || this.observedRoots.has(root) || this.isExtensionNode(root)) return;
    this.mutationObserver.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'value', 'title', 'aria-label', 'alt'],
    });
    this.observedRoots.add(root);
  }

  private observeOpenShadowRoots(root: Node): void {
    if (this.isExtensionNode(root)) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      const shadow = (root as Element).shadowRoot;
      if (shadow) {
        this.observeRoot(shadow);
        this.observeOpenShadowRoots(shadow);
      }
    }
    if (root instanceof Element || root instanceof DocumentFragment) {
      root.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot && !this.isExtensionNode(el)) {
          this.observeRoot(el.shadowRoot);
          this.observeOpenShadowRoots(el.shadowRoot);
        }
      });
    }
  }

  private isExtensionNode(node: Node | null): boolean {
    if (!node) return false;
    if (node instanceof ShadowRoot) return this.isExtensionNode(node.host);
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

  private isProtectedElement(el: Element): boolean {
    const selector = 'script,style,code,pre,noscript,svg,[contenteditable],[hidden],[inert],[translate="no"],[aria-hidden="true"],input[type="password"]';
    if (el.closest(selector)) return true;
    let root: Node = el.getRootNode();
    while (root instanceof ShadowRoot) {
      if (root.host.closest(selector)) return true;
      root = root.host.getRootNode();
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
    this.scheduleEnhancedTranslation();
  }

  private translateElementAttributes(el: HTMLElement): void {
    if (!el || typeof (el as any).getAttribute !== 'function' || this.isExtensionNode(el) || this.isProtectedElement(el)) return;
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
    if (this.isProtectedElement(container) || container.querySelector('code,pre,[contenteditable],[hidden],[inert],[translate="no"],[aria-hidden="true"]')) return false;
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
    this.compositeSourceMap.set(container, trimmed);

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
      if (rootNode.nodeType === 1 && this.isProtectedElement(el)) return;

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
          if (this.isExtensionNode(c) || this.isProtectedElement(c)) continue;
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
          if (this.isExtensionNode(a) || this.isProtectedElement(a)) continue;
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
           if (this.isExtensionNode(parent) || this.isProtectedElement(parent)) return NodeFilter.FILTER_REJECT;

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
    if (!node.parentElement || this.isProtectedElement(node.parentElement) || node.parentElement.closest('textarea')) return;
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
    this.enhancedGeneration++;
    if (this.enhancedTimer) clearTimeout(this.enhancedTimer);
    this.pageWorkload = this.measurePageWorkload();
    this.siteSizePromise = null;
    this.isTranslating = true;
    try {
      this.currentSourceLang = this.detectSourceLanguage();
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
    this.scheduleEnhancedTranslation();
  }

  private measurePageWorkload(): { segments: number; characters: number; linkedPages: number } {
    let segments = 0;
    let characters = 0;
    const visit = (root: ParentNode) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        const value = node.textContent?.trim();
        if (!parent || !value || this.isExtensionNode(parent) || this.isProtectedElement(parent)) continue;
        segments++;
        characters += value.length;
      }
      for (const el of root.querySelectorAll<HTMLElement>('*')) {
        if (this.isExtensionNode(el) || this.isProtectedElement(el)) continue;
        for (const name of ['placeholder', 'title', 'aria-label', 'alt']) {
          const value = el.getAttribute(name)?.trim();
          if (value) { segments++; characters += value.length; }
        }
        if (el.shadowRoot) visit(el.shadowRoot);
      }
    };
    if (document.body) visit(document.body);
    const links = new Set<string>();
    for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      try {
        const url = new URL(link.href);
        if (url.origin === location.origin) links.add(url.href.split('#')[0]);
      } catch { /* Ignore malformed links. */ }
    }
    return { segments, characters, linkedPages: links.size };
  }

  private scheduleEnhancedTranslation(): void {
    if (!this.enhancedEnabled || !this.isPageTranslated || !chrome.runtime?.sendMessage ||
        this.currentSourceLang === this.currentTargetLang) return;
    if (this.enhancedTimer) clearTimeout(this.enhancedTimer);
    const generation = this.enhancedGeneration;
    this.enhancedTimer = setTimeout(() => {
      this.enhancedTimer = null;
      void this.translateWithServer(generation).catch(() => {});
    }, 150);
  }

  private async translateWithServer(generation: number): Promise<void> {
    if (generation !== this.enhancedGeneration || !this.isPageTranslated ||
        this.currentSourceLang === this.currentTargetLang) return;
    const groups = new Map<string, Array<(translated: string) => void>>();
    const sourceLang = this.currentSourceLang;
    const targetLang = this.currentTargetLang;
    const add = (source: string, apply: (translated: string) => void) => {
      const text = source.trim();
      if (text.length < 2 || text.length > 2000 || !/\p{L}/u.test(text)) return;
      const letters = text.match(/\p{L}/gu) || [];
      const latin = text.match(/\p{Script=Latin}/gu) || [];
      if (latin.length < letters.length * 0.8) return;
      const callbacks = groups.get(text) || [];
      callbacks.push(apply);
      groups.set(text, callbacks);
    };
    const compositeContainers = [...this.compositeSourceMap.keys()].filter((el) => el.isConnected);
    for (const [node, source] of this.originalTextMap) {
      const parent = node.parentElement;
      if (!node.isConnected || !parent || this.isExtensionNode(parent) || this.isProtectedElement(parent)) continue;
      if (compositeContainers.some((container) => container.contains(node))) continue;
      add(source, (translation) => {
        if (!node.isConnected || generation !== this.enhancedGeneration || !this.isPageTranslated) return;
        const expected = this.translateLocal(source.trim());
        if (node.textContent?.trim() !== expected && node.textContent?.trim() !== source.trim()) return;
        const match = source.match(/^(\s*)([\s\S]*?)(\s*)$/);
        node.textContent = `${match?.[1] || ''}${translation}${match?.[3] || ''}`;
      });
    }
    for (const container of compositeContainers) {
      const source = this.compositeSourceMap.get(container)!;
      add(source, (translation) => {
        if (!container.isConnected || generation !== this.enhancedGeneration || !this.isPageTranslated) return;
        const markers = source.match(/<\/?t\d+>/g) || [];
        if (markers.some((marker) => translation.split(marker).length !== source.split(marker).length) ||
          (translation.match(/<\/?t\d+>/g) || []).length !== markers.length) return;
        this.restoreSingleCompositeContainer(container);
        this.saveElementChildrenRecursively(container);
        const inlineElements: HTMLElement[] = [];
        if (this.buildMaskedSentence(container, inlineElements).trim() !== source) return;
        const fragment = this.reassembleTranslatedSentence(translation, inlineElements);
        container.replaceChildren(fragment);
      });
    }
    for (const [el, originals] of this.originalAttrMap) {
      if (!el.isConnected || this.isExtensionNode(el) || this.isProtectedElement(el)) continue;
      for (const [key, name] of Object.entries({ placeholder: 'placeholder', value: 'value', title: 'title', ariaLabel: 'aria-label', alt: 'alt' })) {
        const source = originals[key as keyof typeof originals];
        if (!source || (key === 'value' && !['button', 'submit', 'reset'].includes((el as HTMLInputElement).type))) continue;
        add(source, (translation) => {
          if (!el.isConnected || generation !== this.enhancedGeneration || !this.isPageTranslated) return;
          const current = key === 'value' ? (el as HTMLInputElement).value : el.getAttribute(name);
          if (current !== this.translateLocal(source.trim()) && current !== source) return;
          if (key === 'value') (el as HTMLInputElement).value = translation;
          else el.setAttribute(name, translation);
        });
      }
    }
    const texts = [...groups.keys()];
    this.isTranslating = true;
    try {
      for (const text of texts) {
        const cached = this.enhancedCache.get(`${sourceLang}:${targetLang}:${text}`);
        if (cached) for (const apply of groups.get(text) || []) apply(cached);
      }
      this.mutationObserver?.takeRecords();
    } finally {
      this.isTranslating = false;
    }
    const uncachedTexts = texts.filter((text) => {
      const key = `${sourceLang}:${targetLang}:${text}`;
      return !this.enhancedCache.has(key) && !this.enhancedInFlight.has(key);
    });
    for (let offset = 0; offset < uncachedTexts.length; offset += 20) {
      if (generation !== this.enhancedGeneration || !this.isPageTranslated) return;
      const batch = uncachedTexts.slice(offset, offset + 20);
      for (const text of batch) this.enhancedInFlight.add(`${sourceLang}:${targetLang}:${text}`);
      const response = await new Promise<any>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 18000);
        try {
          chrome.runtime.sendMessage({ type: 'ENHANCED_TRANSLATE_BATCH',
            items: batch.map((text) => ({ text, sourceLang, targetLang })) },
          (value: any) => { clearTimeout(timeout); resolve(chrome.runtime.lastError ? null : value); });
        } catch { clearTimeout(timeout); resolve(null); }
      });
      for (const text of batch) this.enhancedInFlight.delete(`${sourceLang}:${targetLang}:${text}`);
      if (!response?.success || !Array.isArray(response.results)) return;
      this.isTranslating = true;
      try {
        for (let i = 0; i < batch.length; i++) {
          const result = response.results[i];
          const translated = result?.translatedText?.trim();
          if (!['success', 'memory_hit'].includes(result?.status) || result?.provider === 'fixture' ||
            result?.targetLang !== targetLang || !translated || translated === batch[i] ||
            translated.length > batch[i].length * 4 + 200) continue;
          const key = `${sourceLang}:${targetLang}:${batch[i]}`;
          this.enhancedCache.set(key, translated);
          for (const apply of groups.get(batch[i]) || []) apply(translated);
        }
        this.mutationObserver?.takeRecords();
      } finally {
        this.isTranslating = false;
      }
    }
  }

  private precacheVisibleSections(): void {
    try {
      if (!this.isVoiceEnabled() || typeof window === 'undefined' || !document.body) return;
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
    this.enhancedGeneration++;
    if (this.enhancedTimer) clearTimeout(this.enhancedTimer);
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
      this.originalTextMap.clear();
      this.compositeSourceMap.clear();
      this.originalAttrMap.clear();
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

    this.shadow.innerHTML = `
      <style>
        .assistant-btn {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: #111;
          color: #ffffff;
          border: 1px solid #15803d;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .assistant-btn:hover {
          transform: scale(1.04);
          background: #292929;
        }
        .assistant-btn.active-speak {
          background: #292929;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        }
        .card {
          display: ${this.isOpen ? 'block' : 'none'};
          position: absolute;
          bottom: 64px;
          right: 0;
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
          background: ${this.isTouchSpeakEnabled ? '#15803d' : '#f9fafb'};
          color: ${this.isTouchSpeakEnabled ? '#ffffff' : '#111827'};
          border-color: ${this.isTouchSpeakEnabled ? '#15803d' : '#d1d5db'};
        }
        .speak-hint {
          display: ${this.isTouchSpeakEnabled ? 'block' : 'none'};
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
            <option value="en" ${this.currentTargetLang === 'en' ? 'selected' : ''}>English (EN)</option>
            <option value="fr" ${this.currentTargetLang === 'fr' ? 'selected' : ''}>Français (FR)</option>
            <option value="ewo-CM" ${this.currentTargetLang === 'ewo-CM' ? 'selected' : ''}>Ewondo (Centre, Sud, Est)</option>
            <option value="fuv-CM" ${this.currentTargetLang === 'fuv-CM' ? 'selected' : ''}>Fulfulde / Peul (Grand Nord, CEMAC)</option>
            <option value="hau-CM" ${this.currentTargetLang === 'hau-CM' ? 'selected' : ''}>Haoussa (Grand Nord, Corridors)</option>
            <option value="knc-CM" ${this.currentTargetLang === 'knc-CM' ? 'selected' : ''}>Kanuri (Extrême-Nord, Lac Tchad)</option>
            <option value="pcm-CM" ${this.currentTargetLang === 'pcm-CM' ? 'selected' : ''}>Pidgin English (NO, SO, Marchés)</option>
          </select>
          <p style="font-size:11px;color:#667085;margin-top:9px;">Langue source détectée automatiquement. EN/FR utilise le serveur configuré. Vérifiez les montants avant une transaction.</p>
        </div>

        <div style="margin-top: 10px;">
          ${
            this.isPageTranslated
              ? `<button class="btn-action" id="btn-restore"><span></span><span>Restaurer le texte d'origine</span></button>`
               : `<button class="btn-action primary" id="btn-translate-page"><span></span><span>Activer la traduction automatique</span></button>`
          }
        </div>

        <button class="btn-action speak-toggle" id="btn-toggle-speak">
          <span></span>
          <span>${this.isTouchSpeakEnabled ? 'Désactiver la lecture au toucher' : 'Activer la lecture sur demande'}</span>
        </button>

        <div class="speak-hint">
          <strong>Lecture au survol :</strong> Survolez ou cliquez sur une section. <span id="voice-status">${this.voiceAvailable === false ? 'Voix indisponible. Vérifiez la clé API, le service et le son du navigateur.' : this.voiceAvailable === true ? 'Voix prête.' : ['en', 'fr'].includes(this.currentTargetLang) ? 'Voix du navigateur disponible après un clic sur la page.' : ['hau-CM', 'fuv-CM'].includes(this.currentTargetLang) ? 'Voix hébergée disponible avec une clé API. Un clic sur la page peut être nécessaire pour autoriser le son.' : 'Voix expérimentale en ligne avec une clé API ; prononciation non vérifiée.'}</span>
        </div>

        <div id="selection-preview" class="preview-box"></div>
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

      <button class="assistant-btn ${this.isTouchSpeakEnabled ? 'active-speak' : ''}" id="btn-toggle" title="LinguaBridge - Accessibilité en Langue Maternelle">

      </button>

      <!-- Bottom floating speech indicator bar -->
      <div id="audio-bar" class="audio-bar">
        <span style="font-size: 16px;"></span>
        <div style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <div id="audio-spoken-text" style="font-weight: 700; font-size: 13px; color: #ffffff;"></div>
          <div id="audio-phonetic" style="font-size: 11px; color: #86efac; font-style: italic;"></div>
        </div>
        <button class="audio-btn" id="audio-replay">Rejouer</button>
        <button class="audio-btn stop-btn" id="audio-stop">Arrêter</button>
        <button id="audio-close" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:14px;padding:2px 6px;">✕</button>
      </div>
    `;

    if (this.voiceAvailable === false && this.voiceFailureReason) {
      const voiceStatus = this.shadow.getElementById('voice-status');
      if (voiceStatus) voiceStatus.textContent = this.voiceFailureReason;
    }

    // Attach listeners
    this.shadow.getElementById('btn-toggle')?.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.render();
    });

    this.shadow.getElementById('close-card')?.addEventListener('click', () => {
      this.isOpen = false;
      this.render();
    });

    this.shadow.getElementById('btn-translate-page')?.addEventListener('click', () => {
      chrome.storage?.local?.set({ linguabridgeAutoTranslate: true });
      this.translateFullPage();
      chrome.runtime?.sendMessage?.({ type: 'BROADCAST_PAGE_ACTION', action: 'translate', targetLang: this.currentTargetLang });
    });

    this.shadow.getElementById('btn-restore')?.addEventListener('click', () => {
      chrome.storage?.local?.set({ linguabridgeAutoTranslate: false });
      this.restorePage();
      chrome.runtime?.sendMessage?.({ type: 'BROADCAST_PAGE_ACTION', action: 'restore' });
    });

    this.shadow.getElementById('btn-toggle-speak')?.addEventListener('click', () => {
      this.toggleTouchSpeakMode();
    });



    this.shadow.getElementById('target-lang')?.addEventListener('change', (e) => {
      this.currentTargetLang = (e.target as HTMLSelectElement).value;
      this.currentSourceLang = this.detectSourceLanguage();
      if (this.currentTargetLang === 'en' || this.currentTargetLang === 'fr') this.enhancedEnabled = true;
      chrome.storage?.local?.set({ linguabridgeTargetLang: this.currentTargetLang,
        ...((this.currentTargetLang === 'en' || this.currentTargetLang === 'fr') ? { linguabridgeEnhancedTranslation: true } : {}) });
      this.translationSpeechCache.clear();
      this.voiceAvailable = null;
      this.voiceFailureReason = null;
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
      const bar = this.shadow?.getElementById('audio-bar');
      if (bar) bar.style.display = 'none';
    });
  }

  public destroy(): void {
    document.documentElement.removeAttribute('data-linguabridge-extension');
    this.stopSpeech();
    this.speechPlayer.destroy();
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
