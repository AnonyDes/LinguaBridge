import { LinguaBridgeClient } from '@linguabridge/sdk-js';
import type { Language } from '@linguabridge/shared-types';
import {
  ACTIVE_CAMEROON_LANGUAGES,
  filterVisibleLanguages,
  generateBankingResponse,
  speakAfricanText,
  type BankingResponse,
  type ExtractedFinancialEntity,
} from './banking-engine';

export interface WidgetOptions {
  apiUrl?: string;
  apiKey?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultSourceLang?: string;
  defaultTargetLang?: string;
  theme?: 'light' | 'dark' | 'auto';
  autoTranslate?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  phonetic?: string;
  lang: string;
  timestamp: number;
  entities?: ExtractedFinancialEntity[];
  zeroDriftVerified?: boolean;
}

export class LinguaBridgeWidget {
  private static instance: LinguaBridgeWidget | null = null;
  private client: LinguaBridgeClient;
  private options: WidgetOptions;
  private container: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private isOpen = false;
  private currentTargetLang = 'ewo-CM';
  private currentSourceLang = 'fr';
  private originalDomMap = new Map<Node, string>();
  private originalChildNodesMap = new Map<HTMLElement, Node[]>();
  private originalAttrMap = new Map<
    Element,
    { placeholder?: string; value?: string; title?: string; ariaLabel?: string; alt?: string }
  >();

  private static readonly INLINE_TAGS = new Set([
    'EM', 'STRONG', 'SPAN', 'B', 'I', 'U', 'A', 'SMALL', 'MARK', 'SUB', 'SUP', 'CODE', 'ABBR', 'CITE', 'TIME', 'BDO', 'BDI'
  ]);

  private static readonly CONTAINER_SELECTOR =
    'h1, h2, h3, h4, h5, h6, p, li, button, label, dt, dd, td, th, blockquote, figcaption, summary, caption';
  private static readonly CONTAINER_BLOCK_TAGS = new Set([
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'BUTTON', 'LABEL', 'DT', 'DD', 'TD', 'TH', 'BLOCKQUOTE', 'FIGCAPTION', 'SUMMARY', 'CAPTION'
  ]);
  private isPageTranslated = false;
  private availableLanguages: Language[] = [];
  private chatMessages: ChatMessage[] = [];
  private isSpeaking = false;
  private activeSpeakingId: string | null = null;

  constructor(options: WidgetOptions = {}) {
    this.options = {
      apiUrl: options.apiUrl || 'http://localhost:3001',
      position: options.position || 'bottom-right',
      defaultSourceLang: options.defaultSourceLang || 'fr',
      defaultTargetLang: options.defaultTargetLang || 'ewo-CM',
      theme: options.theme || 'auto',
      autoTranslate: options.autoTranslate || false,
      ...options,
    };

    this.currentTargetLang = this.options.defaultTargetLang!;
    this.currentSourceLang = this.options.defaultSourceLang!;
    this.client = new LinguaBridgeClient({
      baseUrl: this.options.apiUrl,
      apiKey: this.options.apiKey,
    });

    // Initialize with sovereign default languages
    this.availableLanguages = this.getDefaultLanguages();

    // Initialize initial greeting in target language
    this.initGreetingMessage();
  }

  public static init(options: WidgetOptions = {}): LinguaBridgeWidget {
    if (!LinguaBridgeWidget.instance) {
      LinguaBridgeWidget.instance = new LinguaBridgeWidget(options);
      LinguaBridgeWidget.instance.mount();
    }
    return LinguaBridgeWidget.instance;
  }

  private getDefaultLanguages(): Language[] {
    const cameroonLangs: Language[] = ACTIVE_CAMEROON_LANGUAGES.map((l) => ({
      code: l.code,
      name: l.name,
      nativeName: l.nativeName,
      speechAvailable: l.speechAvailable,
      packStatus: 'production_approved',
      isAvailable: true,
    }));

    return cameroonLangs;
  }

  private initGreetingMessage(): void {
    const greeting = generateBankingResponse('bonjour', this.currentTargetLang);
    this.chatMessages = [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: greeting.text,
        phonetic: greeting.phonetic,
        lang: this.currentTargetLang,
        timestamp: Date.now(),
        entities: greeting.entities,
        zeroDriftVerified: greeting.zeroDriftVerified,
      },
    ];
  }

  public mount(): void {
    if (typeof document === 'undefined') return;
    if (this.container) return;

    this.container = document.createElement('linguabridge-widget-host');
    this.container.style.position = 'fixed';
    this.container.style.zIndex = '2147483647';
    this.container.style.bottom = this.options.position?.includes('bottom') ? '24px' : 'auto';
    this.container.style.top = this.options.position?.includes('top') ? '24px' : 'auto';
    this.container.style.right = this.options.position?.includes('right') ? '24px' : 'auto';
    this.container.style.left = this.options.position?.includes('left') ? '24px' : 'auto';

    this.shadow = this.container.attachShadow({ mode: 'open' });
    this.render();
    document.body.appendChild(this.container);

    this.loadLanguages();
    this.setupSelectionListener();
  }

  private async loadLanguages(): Promise<void> {
    try {
      const fetched = await this.client.getLanguages();
      // Strict invariant: Filter out Duala from visible options
      const visible = filterVisibleLanguages(fetched);

      // Ensure all 5 active Cameroonian languages are represented
      const mergedMap = new Map<string, Language>();
      for (const lang of this.getDefaultLanguages()) {
        mergedMap.set(lang.code, lang);
      }
      for (const lang of visible) {
        if (!lang.code.toLowerCase().startsWith('dua')) {
          mergedMap.set(lang.code, lang);
        }
      }

      this.availableLanguages = Array.from(mergedMap.values());
      this.render();
    } catch {
      this.availableLanguages = this.getDefaultLanguages();
      this.render();
    }
  }

  public getAvailableLanguages(): Language[] {
    return filterVisibleLanguages(this.availableLanguages);
  }

  public getCurrentTargetLang(): string {
    return this.currentTargetLang;
  }

  public setLanguage(langCode: string): void {
    if (langCode.toLowerCase().startsWith('dua')) {
      // Disallow Duala strictly
      return;
    }
    this.currentTargetLang = langCode;
    const greeting = generateBankingResponse('bonjour', this.currentTargetLang);
    this.chatMessages.push({
      id: `msg-lang-${Date.now()}`,
      sender: 'assistant',
      text: greeting.text,
      phonetic: greeting.phonetic,
      lang: this.currentTargetLang,
      timestamp: Date.now(),
      zeroDriftVerified: true,
    });
    this.render();
  }

  public getChatMessages(): ChatMessage[] {
    return [...this.chatMessages];
  }

  /**
   * Interactive Banking Chat: sends a query, receives answer in chosen language with AST Guard
   */
  public async sendChatMessage(query: string): Promise<BankingResponse | null> {
    const trimmed = query.trim();
    if (!trimmed) return null;

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      lang: this.currentSourceLang,
      timestamp: Date.now(),
    };
    this.chatMessages.push(userMsg);
    this.render();

    // 2. Generate local/connected banking response with zero-drift AST protection
    const resp = generateBankingResponse(trimmed, this.currentTargetLang);

    // 3. Add bot message
    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: 'assistant',
      text: resp.text,
      phonetic: resp.phonetic,
      lang: this.currentTargetLang,
      timestamp: Date.now(),
      entities: resp.entities,
      zeroDriftVerified: resp.zeroDriftVerified,
    };
    this.chatMessages.push(botMsg);
    this.render();

    // Scroll chat to bottom if element is present
    const chatContainer = this.shadow?.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    return resp;
  }

  /**
   * Interactive voice speech synthesis
   */
  public speak(text: string, phonetic?: string, lang?: string): boolean {
    const targetLang = lang || this.currentTargetLang;
    const phoneticText = phonetic || text;
    this.isSpeaking = true;

    return speakAfricanText(
      text,
      phoneticText,
      targetLang,
      () => {
        this.isSpeaking = true;
      },
      () => {
        this.isSpeaking = false;
        this.activeSpeakingId = null;
        this.render();
      }
    );
  }

  private translateElementAttributes(
    el: HTMLElement,
    attrItems: { el: HTMLElement; type: 'placeholder' | 'value' | 'title' | 'ariaLabel' | 'alt'; text: string }[]
  ): void {
    if (!el || typeof (el as any).getAttribute !== 'function' || el.closest?.('linguabridge-widget-host')) return;
    const tag = (el.tagName || '').toLowerCase();

    // 1. Placeholder
    if (tag === 'input' || tag === 'textarea') {
      const inputEl = el as any;
      const ph = inputEl.placeholder;
      if (ph && ph.trim()) {
        const orig = this.originalAttrMap.get(el);
        if (!orig || orig.placeholder === undefined) {
          this.originalAttrMap.set(el, { ...orig, placeholder: ph });
        }
        const sourcePh = (this.originalAttrMap.get(el)?.placeholder ?? ph).trim();
        attrItems.push({ el, type: 'placeholder', text: sourcePh });
      }
    }

    // 2. Submit / button value
    if (tag === 'input') {
      const inputEl = el as any;
      const type = (inputEl.type || '').toLowerCase();
      if (['button', 'submit', 'reset'].includes(type) && inputEl.value && inputEl.value.trim()) {
        const orig = this.originalAttrMap.get(el);
        if (!orig || orig.value === undefined) {
          this.originalAttrMap.set(el, { ...orig, value: inputEl.value });
        }
        const sourceVal = (this.originalAttrMap.get(el)?.value ?? inputEl.value).trim();
        attrItems.push({ el, type: 'value', text: sourceVal });
      }
    }

    // 3. title
    const title = el.getAttribute('title');
    if (title && title.trim()) {
      const orig = this.originalAttrMap.get(el);
      if (!orig || orig.title === undefined) {
        this.originalAttrMap.set(el, { ...orig, title });
      }
      const sourceTitle = (this.originalAttrMap.get(el)?.title ?? title).trim();
      attrItems.push({ el, type: 'title', text: sourceTitle });
    }

    // 4. aria-label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) {
      const orig = this.originalAttrMap.get(el);
      if (!orig || orig.ariaLabel === undefined) {
        this.originalAttrMap.set(el, { ...orig, ariaLabel });
      }
      const sourceAria = (this.originalAttrMap.get(el)?.ariaLabel ?? ariaLabel).trim();
      attrItems.push({ el, type: 'ariaLabel', text: sourceAria });
    }

    // 5. alt on img
    if (tag === 'img') {
      const alt = el.getAttribute('alt');
      if (alt && alt.trim()) {
        const orig = this.originalAttrMap.get(el);
        if (!orig || orig.alt === undefined) {
          this.originalAttrMap.set(el, { ...orig, alt });
        }
        const sourceAlt = (this.originalAttrMap.get(el)?.alt ?? alt).trim();
        attrItems.push({ el, type: 'alt', text: sourceAlt });
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
        if (LinguaBridgeWidget.INLINE_TAGS.has(tag)) {
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

  private prepareCompositeContainer(c: HTMLElement): void {
    if (this.originalChildNodesMap.has(c)) {
      const origNodes = this.originalChildNodesMap.get(c)!;
      while (c.firstChild) c.removeChild(c.firstChild);
      for (const n of origNodes) {
        if (this.originalDomMap.has(n)) n.textContent = this.originalDomMap.get(n)!;
        c.appendChild(n);
      }
    } else {
      this.originalChildNodesMap.set(c, Array.from(c.childNodes));
      for (let j = 0; j < c.childNodes.length; j++) {
        const ch = c.childNodes[j];
        if (!this.originalDomMap.has(ch)) {
          this.originalDomMap.set(ch, ch.textContent || '');
        }
        if (ch.nodeType === 1) {
          const chWalker = document.createTreeWalker(ch, NodeFilter.SHOW_TEXT);
          let chCurr = chWalker.nextNode();
          while (chCurr) {
            if (!this.originalDomMap.has(chCurr)) {
              this.originalDomMap.set(chCurr, chCurr.textContent || '');
            }
            chCurr = chWalker.nextNode();
          }
        }
      }
    }
  }

  public async translatePage(): Promise<void> {
    if (typeof document === 'undefined') return;

    const compositeItems: { container: HTMLElement; inlineElements: HTMLElement[]; text: string; leading: string; trailing: string }[] = [];
    const attrItems: { el: HTMLElement; type: 'placeholder' | 'value' | 'title' | 'ariaLabel' | 'alt'; text: string }[] = [];
    const textNodeItems: { node: Node; leading: string; text: string; trailing: string }[] = [];
    const translatedContainers = new Set<HTMLElement>();

    const collectFromRoot = (root: Node) => {
      if (!root || !root.isConnected) return;
      if (root.nodeType === 1 || root.nodeType === 11) {
        const el = root as HTMLElement;
        const tag = (el.tagName || '').toLowerCase();
        if (['script', 'style', 'code', 'pre', 'noscript', 'linguabridge-widget-host'].includes(tag)) return;
        if (el.closest?.('linguabridge-widget-host')) return;

        // Attributes
        if (root.nodeType === 1) {
          this.translateElementAttributes(el, attrItems);
        }
        if (el.querySelectorAll) {
          const attrElements = el.querySelectorAll<HTMLElement>('input, textarea, [title], [aria-label], img[alt]');
          for (let i = 0; i < attrElements.length; i++) {
            this.translateElementAttributes(attrElements[i], attrItems);
          }
        }

        // Shadow DOM custom components
        if ((el as any).shadowRoot && !(el as any).shadowRoot.host?.closest?.('linguabridge-widget-host')) {
          collectFromRoot((el as any).shadowRoot);
        }
        if (el.querySelectorAll) {
          const customs = el.querySelectorAll<HTMLElement>('*');
          for (let i = 0; i < customs.length; i++) {
            const shadow = (customs[i] as any).shadowRoot;
            if (shadow && !shadow.host?.closest?.('linguabridge-widget-host')) {
              collectFromRoot(shadow);
            }
          }
        }

        // Composite containers
        if (el.querySelectorAll) {
          const candidates = el.querySelectorAll<HTMLElement>(LinguaBridgeWidget.CONTAINER_SELECTOR);
          for (let i = 0; i < candidates.length; i++) {
            const c = candidates[i];
            if (c.closest?.('linguabridge-widget-host')) continue;
            if (c.querySelector(LinguaBridgeWidget.CONTAINER_SELECTOR)) continue;

            const hasInline = Array.from(c.children).some((child) =>
              LinguaBridgeWidget.INLINE_TAGS.has((child.tagName || '').toUpperCase())
            );
            if (hasInline) {
              this.prepareCompositeContainer(c);

              const inlineElements: HTMLElement[] = [];
              const maskedText = this.buildMaskedSentence(c, inlineElements);

              const wsMatch = maskedText.match(/^(\s*)([\s\S]*?)(\s*)$/);
              const leading = wsMatch ? wsMatch[1] : '';
              const trimmed = wsMatch ? wsMatch[2] : '';
              const trailing = wsMatch ? wsMatch[3] : '';

              if (trimmed) {
                compositeItems.push({ container: c, inlineElements, text: trimmed, leading, trailing });
                translatedContainers.add(c);
              }
            }
          }
        }

        // Check standalone <a> links with mixed inline elements not inside a block container
        if (el.querySelectorAll) {
          const candidateLinks = el.querySelectorAll<HTMLElement>('a');
          for (let i = 0; i < candidateLinks.length; i++) {
            const a = candidateLinks[i];
            if (a.closest?.('linguabridge-widget-host')) continue;
            if (a.closest?.(LinguaBridgeWidget.CONTAINER_SELECTOR)) continue;
            const hasInline = Array.from(a.children).some((child) =>
              LinguaBridgeWidget.INLINE_TAGS.has((child.tagName || '').toUpperCase())
            );
            if (hasInline && !translatedContainers.has(a)) {
              this.prepareCompositeContainer(a);
              const inlineElements: HTMLElement[] = [];
              const maskedText = this.buildMaskedSentence(a, inlineElements);
              const wsMatch = maskedText.match(/^(\s*)([\s\S]*?)(\s*)$/);
              const leading = wsMatch ? wsMatch[1] : '';
              const trimmed = wsMatch ? wsMatch[2] : '';
              const trailing = wsMatch ? wsMatch[3] : '';
              if (trimmed) {
                compositeItems.push({ container: a, inlineElements, text: trimmed, leading, trailing });
                translatedContainers.add(a);
              }
            }
          }
        }

        // TreeWalker for standalone text nodes
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const pTag = parent.tagName.toLowerCase();
            if (['script', 'style', 'code', 'pre', 'noscript', 'linguabridge-widget-host'].includes(pTag)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest('linguabridge-widget-host')) return NodeFilter.FILTER_REJECT;
            for (const tc of translatedContainers) {
              if (tc.contains(node)) return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        });

        let currentNode = walker.nextNode();
        while (currentNode) {
          if (!this.originalDomMap.has(currentNode)) {
            this.originalDomMap.set(currentNode, currentNode.textContent || '');
          }
          const originalText = this.originalDomMap.get(currentNode) || currentNode.textContent || '';
          const match = originalText.match(/^(\s*)([\s\S]*?)(\s*)$/);
          const leading = match ? match[1] : '';
          const trimmed = match ? match[2] : '';
          const trailing = match ? match[3] : '';
          if (trimmed) {
            textNodeItems.push({ node: currentNode, leading, text: trimmed, trailing });
          }
          currentNode = walker.nextNode();
        }
      }
    };

    collectFromRoot(document.body);

    const allRequests: { text: string }[] = [
      ...compositeItems.map((c) => ({ text: c.text })),
      ...attrItems.map((a) => ({ text: a.text })),
      ...textNodeItems.map((t) => ({ text: t.text })),
    ];

    if (allRequests.length === 0) return;

    try {
      const items = allRequests.map((item) => ({
        text: item.text,
        sourceLang: this.currentSourceLang,
        targetLang: this.currentTargetLang,
        domain: 'financial',
      }));

      const results = await this.client.translateBatch(items);
      let cursor = 0;

      // 1. Unpack composite containers
      for (let i = 0; i < compositeItems.length; i++) {
        const item = compositeItems[i];
        const res = results[cursor++];
        if (res?.translatedText) {
          const fullTranslated = (item.leading || '') + res.translatedText + (item.trailing || '');
          const newFragment = this.reassembleTranslatedSentence(fullTranslated, item.inlineElements);
          while (item.container.firstChild) item.container.removeChild(item.container.firstChild);
          item.container.appendChild(newFragment);
        }
      }

      // 2. Unpack attributes
      for (let i = 0; i < attrItems.length; i++) {
        const item = attrItems[i];
        const res = results[cursor++];
        if (res?.translatedText) {
          const val = res.translatedText;
          if (item.type === 'placeholder') (item.el as any).placeholder = val;
          else if (item.type === 'value') (item.el as any).value = val;
          else if (item.type === 'title') item.el.setAttribute('title', val);
          else if (item.type === 'ariaLabel') item.el.setAttribute('aria-label', val);
          else if (item.type === 'alt') item.el.setAttribute('alt', val);
        }
      }

      // 3. Unpack text nodes
      for (let i = 0; i < textNodeItems.length; i++) {
        const item = textNodeItems[i];
        const res = results[cursor++];
        if (res?.translatedText) {
          item.node.textContent = item.leading + res.translatedText + item.trailing;
        }
      }

      this.isPageTranslated = true;
      this.render();
    } catch (err) {
      console.error('[LinguaBridge] Page translation error:', err);
    }
  }

  public restoreOriginalPage(): void {
    // 1. Restore composite containers
    for (const [container, origNodes] of this.originalChildNodesMap.entries()) {
      if (container.isConnected) {
        while (container.firstChild) container.removeChild(container.firstChild);
        for (const n of origNodes) {
          container.appendChild(n);
        }
      }
    }
    this.originalChildNodesMap.clear();

    // 2. Restore text nodes
    for (const [node, originalText] of this.originalDomMap.entries()) {
      if (node.isConnected) {
        node.textContent = originalText;
      }
    }

    // 3. Restore attributes
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
        if (orig.title !== undefined) el.setAttribute('title', orig.title);
        if (orig.ariaLabel !== undefined) el.setAttribute('aria-label', orig.ariaLabel);
        if (orig.alt !== undefined && tag === 'img') el.setAttribute('alt', orig.alt);
      }
    }

    this.isPageTranslated = false;
    this.render();
  }

  private setupSelectionListener(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('mouseup', async () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text || text.length < 2) return;

      const selectionBox = this.shadow?.getElementById('selection-box');
      if (selectionBox) {
        selectionBox.style.display = 'block';
        selectionBox.innerHTML = `<strong>Selected:</strong> "${text}"<br/><em>Translating...</em>`;

        try {
          const res = await this.client.translate({
            text,
            sourceLang: this.currentSourceLang,
            targetLang: this.currentTargetLang,
            domain: 'financial',
          });
          selectionBox.innerHTML = `
            <div style="margin-bottom:4px;"><strong>Selected:</strong> "${text}"</div>
            <div style="color:#047857;font-weight:600;">"${res.translatedText}"</div>
            ${res.warnings.length > 0 ? `<div style="color:#b45309;font-size:11px;margin-top:4px;">⚠️ ${res.warnings[0]}</div>` : ''}
          `;
        } catch (err: any) {
          selectionBox.innerHTML = `<span style="color:#dc2626;">Translation error: ${err.message}</span>`;
        }
      }
    });
  }

  private render(): void {
    if (!this.shadow) return;

    const primaryColor = '#16a34a';
    const primaryHover = '#15803d';
    const visibleLanguages = filterVisibleLanguages(this.availableLanguages);

    this.shadow.innerHTML = `
      <style>
        :host {
          all: initial;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 13px;
          line-height: 1.4;
          box-sizing: border-box;
        }
        *, *::before, *::after {
          box-sizing: inherit;
        }
        .widget-button {
          background: ${primaryColor};
          color: #ffffff;
          border: 1px solid #15803d;
          border-radius: 9999px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .widget-button:hover {
          transform: scale(1.04);
          background: ${primaryHover};
        }
        .widget-card {
          display: ${this.isOpen ? 'flex' : 'none'};
          flex-direction: column;
          position: absolute;
          bottom: 58px;
          right: 0;
          width: 380px;
          max-height: 580px;
          background: #ffffff;
          color: #111827;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
          overflow: hidden;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .header-title-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .header-title {
          font-weight: 700;
          font-size: 14px;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #047857;
          background: #ecfdf5;
          padding: 2px 6px;
          border-radius: 9999px;
          border: 1px solid #a7f3d0;
          width: fit-content;
        }
        .close-btn {
          background: transparent;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #64748b;
          padding: 4px;
          border-radius: 4px;
        }
        .close-btn:hover {
          color: #0f172a;
          background: #e2e8f0;
        }
        .lang-bar {
          padding: 10px 16px;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .lang-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
        }
        select#lang-select {
          width: 100%;
          padding: 7px 10px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 13px;
          font-weight: 500;
          background: #ffffff;
          color: #1e293b;
          cursor: pointer;
          outline: none;
        }
        select#lang-select:focus {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
        }
        .chat-body {
          flex: 1;
          overflow-y: auto;
          max-height: 300px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #f8fafc;
        }
        .message-bubble {
          max-width: 85%;
          padding: 9px 12px;
          border-radius: 12px;
          font-size: 12.5px;
          line-height: 1.45;
          word-break: break-word;
          position: relative;
        }
        .message-bubble.user {
          align-self: flex-end;
          background: ${primaryColor};
          color: #ffffff;
          border-bottom-right-radius: 2px;
        }
        .message-bubble.assistant {
          align-self: flex-start;
          background: #ffffff;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-bottom-left-radius: 2px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .message-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
          gap: 6px;
          font-size: 11px;
        }
        .speak-btn {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: background 0.15s ease;
        }
        .speak-btn:hover {
          background: #d1fae5;
        }
        .drift-badge {
          font-size: 10px;
          color: #047857;
          font-weight: 600;
        }
        .quick-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 8px 16px;
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
        }
        .quick-chip {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .quick-chip:hover {
          background: #e2e8f0;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .input-bar {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
        }
        .chat-input {
          flex: 1;
          padding: 9px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 13px;
          outline: none;
        }
        .chat-input:focus {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
        }
        .send-btn {
          background: ${primaryColor};
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 0 16px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .send-btn:hover {
          background: ${primaryHover};
        }
        .page-translate-footer {
          padding: 8px 16px 12px;
          background: #f8fafc;
          border-top: 1px dashed #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .page-btn {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 5px 10px;
          font-size: 11.5px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
        }
        .page-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .page-btn.primary {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
          font-weight: 600;
        }
        .page-btn.primary:hover {
          background: #d1fae5;
        }
        .selection-box {
          display: none;
          margin: 8px 16px;
          padding: 8px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          font-size: 11.5px;
        }
      </style>

      <div class="widget-card">
        <div class="header">
          <div class="header-title-box">
            <span class="header-title">💬 LinguaBridge IA Bancaire 🇨🇲</span>
            <span class="header-badge">🛡️ AST Guard : Zéro Dérive</span>
          </div>
          <button class="close-btn" id="close-widget" aria-label="Fermer">✕</button>
        </div>

        <div class="lang-bar">
          <label class="lang-label" for="lang-select">Langue maternelle africaine</label>
          <select id="lang-select">
            ${visibleLanguages
              .map(
                (l) =>
                  `<option value="${l.code}" ${l.code === this.currentTargetLang ? 'selected' : ''}>
                    ${l.name} (${l.nativeName || l.code})
                  </option>`
              )
              .join('')}
          </select>
        </div>

        <div class="chat-body" id="chat-messages">
          ${this.chatMessages
            .map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return `
              <div class="message-bubble ${msg.sender}">
                <div class="message-text">${msg.text}</div>
                ${
                  isAssistant
                    ? `
                  <div class="message-footer">
                    <button class="speak-btn" data-msg-id="${msg.id}" data-text="${encodeURIComponent(
                        msg.text
                      )}" data-phonetic="${encodeURIComponent(msg.phonetic || msg.text)}" data-lang="${msg.lang}">
                      🔊 Écouter
                    </button>
                    ${msg.zeroDriftVerified ? `<span class="drift-badge">✓ Zéro Dérive</span>` : ''}
                  </div>
                `
                    : ''
                }
              </div>
            `;
            })
            .join('')}
        </div>

        <div class="quick-chips">
          <button class="quick-chip" data-prompt="Comment envoyer de l'argent ?">💸 Comment envoyer ?</button>
          <button class="quick-chip" data-prompt="Quel est mon solde ?">💳 Quel est mon solde ?</button>
          <button class="quick-chip" data-prompt="Frais de retrait au distributeur">📊 Frais de retrait</button>
          <button class="quick-chip" data-prompt="Sécurité de mon compte et code PIN">🔒 Sécurité du compte</button>
        </div>

        <div class="input-bar">
          <input
            id="chat-input"
            class="chat-input"
            type="text"
            placeholder="Posez votre question bancaire en langue..."
            aria-label="Question bancaire"
          />
          <button id="chat-send" class="send-btn">Envoyer</button>
        </div>

        <div class="page-translate-footer">
          <span style="font-size: 11px; color: #64748b;">Accessibilité du site</span>
          ${
            this.isPageTranslated
              ? `<button class="page-btn action-btn" id="restore-page">Restaurer original</button>`
              : `<button class="page-btn primary action-btn" id="translate-page">Traduire la page</button>`
          }
        </div>

        <div id="selection-box" class="selection-box"></div>
      </div>

      <button class="widget-button" id="toggle-widget">
        <span>💬</span>
        <span>${this.isPageTranslated ? 'Restaurer / Switch' : 'IA Bancaire (LinguaBridge)'}</span>
      </button>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.shadow) return;

    // Toggle widget card
    this.shadow.getElementById('toggle-widget')?.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.render();
      if (this.isOpen) {
        setTimeout(() => {
          this.shadow?.getElementById('chat-input')?.focus();
        }, 50);
      }
    });

    // Close button
    this.shadow.getElementById('close-widget')?.addEventListener('click', () => {
      this.isOpen = false;
      this.render();
    });

    // Language selection change
    this.shadow.getElementById('lang-select')?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.setLanguage(target.value);
      if (this.isPageTranslated) {
        this.translatePage();
      }
    });

    // Chat send button
    const chatInput = this.shadow.getElementById('chat-input') as HTMLInputElement | null;
    const sendBtn = this.shadow.getElementById('chat-send');

    const handleSend = () => {
      if (!chatInput) return;
      const text = chatInput.value;
      if (text.trim()) {
        chatInput.value = '';
        this.sendChatMessage(text);
      }
    };

    sendBtn?.addEventListener('click', handleSend);
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSend();
      }
    });

    // Quick chips
    this.shadow.querySelectorAll('.quick-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        const prompt = (e.currentTarget as HTMLElement).getAttribute('data-prompt');
        if (prompt) {
          this.sendChatMessage(prompt);
        }
      });
    });

    // Audio speech buttons
    this.shadow.querySelectorAll('.speak-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const el = e.currentTarget as HTMLElement;
        const text = decodeURIComponent(el.getAttribute('data-text') || '');
        const phonetic = decodeURIComponent(el.getAttribute('data-phonetic') || '');
        const lang = el.getAttribute('data-lang') || this.currentTargetLang;
        this.speak(text, phonetic, lang);
      });
    });

    // Page translation actions
    this.shadow.getElementById('translate-page')?.addEventListener('click', () => {
      this.translatePage();
    });

    this.shadow.getElementById('restore-page')?.addEventListener('click', () => {
      this.restoreOriginalPage();
    });
  }

  public destroy(): void {
    if (this.isPageTranslated) {
      this.restoreOriginalPage();
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
      this.shadow = null;
    }
    LinguaBridgeWidget.instance = null;
  }
}
