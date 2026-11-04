import type { TranslationResult } from '@linguabridge/shared-types';
import { translateSentenceToEwondo, getEwondoPhonetic } from '@linguabridge/translation-engine';

class EwondoSpeechPlayer {
  private isPlaying = false;
  private audioCtx: AudioContext | null = null;
  private onEndCallback: (() => void) | null = null;
  private cachedVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;
  private currentUtteranceId = 0;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoice();
      try {
        if (typeof window.speechSynthesis.addEventListener === 'function') {
          window.speechSynthesis.addEventListener('voiceschanged', () => this.initVoice());
        } else if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
          window.speechSynthesis.onvoiceschanged = () => this.initVoice();
        }
      } catch {
        // Ignored
      }
    }
  }

  public prewarm(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      this.initVoice();
      // Resume wakes up Chromium's paused/asleep speech synthesis pipeline with zero latency
      window.speechSynthesis.resume();
    } catch {
      // Ignored
    }
  }

  private initVoice(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        // Bantu / Ewondo tone articulation: Continental Romance vowels (French, Spanish, Italian) best preserve Ewondo phonemes
        this.cachedVoice =
          voices.find((v) => v.lang.startsWith('fr') || v.lang.startsWith('es') || v.lang.startsWith('it')) ||
          voices[0];
        this.voicesLoaded = true;
      }
    } catch {
      // Ignored
    }
  }

  public speak(text: string, phonetic?: string, onEnd?: () => void): void {
    if (typeof window === 'undefined') return;

    this.stop();
    this.currentUtteranceId++;
    const thisId = this.currentUtteranceId;
    this.onEndCallback = onEnd || null;

    const spokenRaw = phonetic || getEwondoPhonetic(text) || text;
    // Strip hyphens between syllables for acoustic TTS engine to eliminate awkward pauses and "trait d'union" stutter
    const spokenText = spokenRaw.replace(/-/g, '');

    if ('speechSynthesis' in window) {
      try {
        // Ensure speech synthesis is awake and unpaused
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(spokenText);
        // Retain reference on instance to prevent Chromium V8 GC issue 679437
        this.activeUtterance = utterance;

        // Pacing for crystal-clear tone clarity and Bantu phonetic articulation
        utterance.rate = 0.88;
        utterance.pitch = 1.0;
        utterance.lang = 'fr-FR'; // Pure continental vowels matching Bantu phonology

        if (!this.cachedVoice && !this.voicesLoaded) {
          this.initVoice();
        }
        if (this.cachedVoice) {
          utterance.voice = this.cachedVoice;
        }

        utterance.onstart = () => {
          if (this.currentUtteranceId === thisId) {
            this.isPlaying = true;
          }
        };

        const finish = () => {
          if (this.currentUtteranceId === thisId) {
            this.isPlaying = false;
            this.activeUtterance = null;
            if (this.onEndCallback) {
              const cb = this.onEndCallback;
              this.onEndCallback = null;
              cb();
            }
          }
        };

        utterance.onend = finish;
        utterance.onerror = (e) => {
          // If canceled or interrupted by another utterance, do not invoke error handler
          if ((e as any)?.error === 'interrupted' || (e as any)?.error === 'canceled') {
            return;
          }
          finish();
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        this.playAcousticChime();
        if (this.onEndCallback) {
          setTimeout(() => {
            if (this.currentUtteranceId === thisId && this.onEndCallback) {
              const cb = this.onEndCallback;
              this.onEndCallback = null;
              cb();
            }
          }, 350);
        }
      }
    } else {
      this.playAcousticChime();
      if (this.onEndCallback) {
        setTimeout(() => {
          if (this.currentUtteranceId === thisId && this.onEndCallback) {
            const cb = this.onEndCallback;
            this.onEndCallback = null;
            cb();
          }
        }, 350);
      }
    }
  }

  public pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  public stop(): void {
    this.currentUtteranceId++;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch {
        // Ignored
      }
    }
    this.activeUtterance = null;
    this.isPlaying = false;
    this.onEndCallback = null;
  }

  private playAcousticChime(): void {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtxClass();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    } catch {
      // Ignored
    }
  }
}

class ExtensionAssistant {
  private container: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private originalTextMap = new Map<Node, string>();
  private originalAttrMap = new Map<
    Element,
    { placeholder?: string; value?: string; title?: string; ariaLabel?: string; alt?: string }
  >();
  private isPageTranslated = false;
  private currentTargetLang = 'ewo-CM';
  private currentSourceLang = 'fr';
  private isOpen = false;
  private isTouchSpeakEnabled = false;
  private speechPlayer = new EwondoSpeechPlayer();

  // Instant speech & phonetic cache to eliminate voice latency
  private translationSpeechCache = new Map<string, { ewondo: string; phonetic: string }>();

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

  constructor() {
    this.init();
  }

  public isVoiceEnabled(): boolean {
    return this.isTouchSpeakEnabled || this.isPageTranslated;
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
      if (!document.body) return;

      this.container = document.createElement('div');
      this.container.id = 'linguabridge-extension-root';
      this.container.style.all = 'initial';
      this.container.style.position = 'fixed';
      this.container.style.bottom = '24px';
      this.container.style.right = '24px';
      this.container.style.zIndex = '2147483646';

      this.shadow = this.container.attachShadow({ mode: 'open' });
      this.render();
      document.body.appendChild(this.container);

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
      'h1, h2, h3, h4, h5, h6, p, button, a, li, td, th, label, dt, dd, summary, blockquote, figcaption, input, textarea, [role="button"], [role="link"], [role="heading"], [role="tab"], [role="menuitem"], [role="alert"]'
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
      if (text && text.length >= 2) {
        return semanticBlock;
      }
    }

    // 2. Reject macro containers (body, html)
    if (target === document.body || target === document.documentElement) {
      return null;
    }

    // 3. If target has multiple block children, let the cursor hover the specific child
    if (target.querySelectorAll && target.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, button, dt, dd').length > 0) {
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
    if (text && text.length >= 2) {
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
          if (msg.targetLang) this.currentTargetLang = msg.targetLang;
          this.translateFullPage();
        } else if (msg.type === 'POPUP_TOGGLE_TOUCH_SPEAK' || msg.type === 'POPUP_TOGGLE_HOVER_SPEAK') {
          this.toggleTouchSpeakMode();
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

      // If switching sections, stop previous speech and clear previous spoken element outline immediately
      if (this.currentSpokenEl && this.currentSpokenEl !== section) {
        this.stopSpeech();
      }

      this.currentHoveredEl = section;
      section.style.outline = '2px solid #16a34a';
      section.style.outlineOffset = '2px';
      section.style.cursor = 'pointer';

      // "parle seul , une fois": If this section was already spoken in this hover, do not re-speak
      if (this.lastSpokenEl === section) return;

      // Prewarm voice synthesis on hover for zero-latency speech start
      this.speechPlayer.prewarm();

      // Debounce dwell delay (220ms) to avoid triggering on fast mouse passage
      this.hoverDwellTimeout = setTimeout(() => {
        if (this.currentHoveredEl === section && this.lastSpokenEl !== section) {
          this.lastSpokenEl = section;
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
          if (text && text.length >= 2) {
            this.speakTextSection(text, section);
          }
        }
      }, 220);
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
      if (!text || text.length < 2) return;

      e.preventDefault();
      e.stopPropagation();

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
      if (!text || text.length < 2) return;

      e.preventDefault();
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
    this.speechPlayer.prewarm();
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
    let ewondoText: string;
    let phonetic: string;

    const cached = this.translationSpeechCache.get(rawText);
    if (cached) {
      ewondoText = cached.ewondo;
      phonetic = cached.phonetic;
    } else {
      ewondoText = translateSentenceToEwondo(rawText);
      phonetic = getEwondoPhonetic(ewondoText);
      this.translationSpeechCache.set(rawText, { ewondo: ewondoText, phonetic });
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
    this.showAudioFloatingBar(ewondoText, phonetic);

    // Speak immediately with local browser Web Speech API
    this.speechPlayer.speak(ewondoText, phonetic, () => {
      if (this.currentSpokenEl === targetEl) {
        if (targetEl && targetEl !== this.currentHoveredEl) {
          targetEl.style.outline = '';
          targetEl.style.cursor = '';
        }
        this.currentSpokenEl = null;
      }
    });
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
    const localTrans = translateSentenceToEwondo(text);
    const localPhonetic = getEwondoPhonetic(localTrans);

    const renderPreview = (translatedText: string, phonetic: string, warnings: string[]) => {
      box.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 2px; color: #111827;">Sélectionné : "${text}"</div>
        <div style="color: #15803d; font-weight: 700; font-size: 14px;">"${translatedText}"</div>
        ${phonetic ? `<div style="color: #4b5563; font-size: 11px; margin-top: 2px; font-style: italic;">Prononciation : [${phonetic}]</div>` : ''}
        <div style="margin-top: 6px; display: flex; gap: 8px;">
          <button id="btn-speak-selection" style="background: #16a34a; color: #ffffff; border: 1px solid #15803d; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">
            🔊 Écouter en langue maternelle
          </button>
        </div>
        ${
          warnings.length > 0
            ? `<div style="margin-top: 6px; padding: 6px 8px; background: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px; color: #111827; font-size: 11px;">
                🛡️ <strong>Garde financière :</strong> ${warnings.join(', ')}
              </div>`
            : ''
        }
      `;

      this.shadow?.getElementById('btn-speak-selection')?.addEventListener('click', () => {
        this.speechPlayer.speak(translatedText, phonetic);
      });
    };

    // Show instant local translation with zero network latency
    renderPreview(localTrans, localPhonetic, []);

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
            const phon = response.result.phonetic || getEwondoPhonetic(response.result.translatedText);
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
        const translatedPh = translateSentenceToEwondo(sourcePh);
        if (translatedPh && translatedPh !== sourcePh) {
          inputEl.placeholder = translatedPh;
          this.translationSpeechCache.set(translatedPh, {
            ewondo: translatedPh,
            phonetic: getEwondoPhonetic(translatedPh),
          });
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
        const translatedVal = translateSentenceToEwondo(sourceVal);
        if (translatedVal && translatedVal !== sourceVal) {
          inputEl.value = translatedVal;
          this.translationSpeechCache.set(translatedVal, {
            ewondo: translatedVal,
            phonetic: getEwondoPhonetic(translatedVal),
          });
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
      const translatedTitle = translateSentenceToEwondo(sourceTitle);
      if (translatedTitle && translatedTitle !== sourceTitle) {
        el.setAttribute('title', translatedTitle);
        this.translationSpeechCache.set(translatedTitle, {
          ewondo: translatedTitle,
          phonetic: getEwondoPhonetic(translatedTitle),
        });
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
      const translatedAria = translateSentenceToEwondo(sourceAria);
      if (translatedAria && translatedAria !== sourceAria) {
        el.setAttribute('aria-label', translatedAria);
        this.translationSpeechCache.set(translatedAria, {
          ewondo: translatedAria,
          phonetic: getEwondoPhonetic(translatedAria),
        });
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
        const translatedAlt = translateSentenceToEwondo(sourceAlt);
        if (translatedAlt && translatedAlt !== sourceAlt) {
          el.setAttribute('alt', translatedAlt);
          this.translationSpeechCache.set(translatedAlt, {
            ewondo: translatedAlt,
            phonetic: getEwondoPhonetic(translatedAlt),
          });
        }
      }
    }
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
      const translated = translateSentenceToEwondo(trimmed);
      if (translated && translated !== trimmed) {
        node.textContent = leading + translated + trailing;
        // Warm up speech cache for instant hover reading without delay
        if (!this.translationSpeechCache.has(translated)) {
          this.translationSpeechCache.set(translated, {
            ewondo: translated,
            phonetic: getEwondoPhonetic(translated),
          });
        }
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
    } finally {
      this.isTranslating = false;
    }
  }

  public restorePage(): void {
    this.isTranslating = true;
    try {
      // 1. Restore text nodes
      for (const [node, original] of this.originalTextMap.entries()) {
        if (node.isConnected) {
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
          border-radius: 26px;
          background: #16a34a;
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
          background: #15803d;
        }
        .assistant-btn.active-speak {
          background: #15803d;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        }
        .card {
          display: ${this.isOpen ? 'block' : 'none'};
          position: absolute;
          bottom: 64px;
          right: 0;
          width: 320px;
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
          background: #16a34a;
          color: #ffffff;
          border-color: #16a34a;
        }
        .btn-action.primary:hover {
          background: #15803d;
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
          background: #16a34a;
          color: #ffffff;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }
        .audio-btn:hover {
          background: #15803d;
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
        <div class="header">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span>LinguaBridge</span>
            <span class="badge-nat">🇨🇲 Kóbɔ́ Ewondo</span>
          </div>
          <button id="close-card" style="background:none;border:none;cursor:pointer;color:#6b7280;font-size:16px;">✕</button>
        </div>

        <div style="margin-bottom: 8px;">
          <label style="font-weight: 600; font-size: 12px; color: #4b5563;">Langue maternelle :</label>
          <select id="target-lang" style="width: 100%; padding: 7px; border-radius: 6px; border: 1px solid #d1d5db; margin-top: 4px; font-size: 13px; font-weight: 600; background: #ffffff;">
            <option value="ewo-CM" selected>🇨🇲 Kóbɔ́ Ewondo (Langue Maternelle)</option>
          </select>
        </div>

        <div style="margin-top: 10px;">
          ${
            this.isPageTranslated
              ? `<button class="btn-action" id="btn-restore"><span>↩️</span><span>Restaurer le texte d'origine</span></button>`
              : `<button class="btn-action primary" id="btn-translate-page"><span>🌐</span><span>Traduire toute la page</span></button>`
          }
        </div>

        <button class="btn-action speak-toggle" id="btn-toggle-speak">
          <span>🔊</span>
          <span>${this.isTouchSpeakEnabled ? 'Désactiver la lecture au toucher & survol' : 'Activer la lecture au toucher & survol'}</span>
        </button>

        <div class="speak-hint">
          👉 <strong>Mode vocal actif :</strong> Survolez, touchez ou cliquez sur n'importe quelle section pour l'écouter en langue maternelle.
        </div>

        <div id="selection-preview" class="preview-box"></div>
      </div>

      <button class="assistant-btn ${this.isTouchSpeakEnabled ? 'active-speak' : ''}" id="btn-toggle" title="LinguaBridge - Accessibilité en Langue Maternelle">
        ${this.isTouchSpeakEnabled ? '🔊' : '🌐'}
      </button>

      <!-- Bottom floating speech indicator bar -->
      <div id="audio-bar" class="audio-bar">
        <span style="font-size: 16px;">🔊</span>
        <div style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <div id="audio-spoken-text" style="font-weight: 700; font-size: 13px; color: #ffffff;"></div>
          <div id="audio-phonetic" style="font-size: 11px; color: #86efac; font-style: italic;"></div>
        </div>
        <button class="audio-btn" id="audio-replay">Rejouer</button>
        <button class="audio-btn stop-btn" id="audio-stop">Arrêter</button>
        <button id="audio-close" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:14px;padding:2px 6px;">✕</button>
      </div>
    `;

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
      this.translateFullPage();
    });

    this.shadow.getElementById('btn-restore')?.addEventListener('click', () => {
      this.restorePage();
    });

    this.shadow.getElementById('btn-toggle-speak')?.addEventListener('click', () => {
      this.toggleTouchSpeakMode();
    });

    this.shadow.getElementById('target-lang')?.addEventListener('change', (e) => {
      this.currentTargetLang = (e.target as HTMLSelectElement).value;
      if (this.isPageTranslated) {
        this.translateFullPage();
      }
    });

    // Audio bar controls
    this.shadow.getElementById('audio-replay')?.addEventListener('click', () => {
      const text = this.shadow?.getElementById('audio-spoken-text')?.textContent || '';
      const phonetic = this.shadow?.getElementById('audio-phonetic')?.textContent?.replace(/[\[\]]/g, '') || '';
      this.speechPlayer.speak(text, phonetic);
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
