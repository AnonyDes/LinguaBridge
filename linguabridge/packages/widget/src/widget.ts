import { LinguaBridgeClient } from '@linguabridge/sdk-js';
import type { Language, TranslationResult } from '@linguabridge/shared-types';

export interface WidgetOptions {
  apiUrl?: string;
  apiKey?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultSourceLang?: string;
  defaultTargetLang?: string;
  theme?: 'light' | 'dark' | 'auto';
  autoTranslate?: boolean;
}

export class LinguaBridgeWidget {
  private static instance: LinguaBridgeWidget | null = null;
  private client: LinguaBridgeClient;
  private options: WidgetOptions;
  private container: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private isOpen = false;
  private currentTargetLang = 'en';
  private currentSourceLang = 'fr';
  private originalDomMap = new Map<Node, string>();
  private isPageTranslated = false;
  private availableLanguages: Language[] = [];

  constructor(options: WidgetOptions = {}) {
    this.options = {
      apiUrl: options.apiUrl || 'http://localhost:3001',
      position: options.position || 'bottom-right',
      defaultSourceLang: options.defaultSourceLang || 'fr',
      defaultTargetLang: options.defaultTargetLang || 'en',
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
  }

  public static init(options: WidgetOptions = {}): LinguaBridgeWidget {
    if (!LinguaBridgeWidget.instance) {
      LinguaBridgeWidget.instance = new LinguaBridgeWidget(options);
      LinguaBridgeWidget.instance.mount();
    }
    return LinguaBridgeWidget.instance;
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
      this.availableLanguages = await this.client.getLanguages();
      this.render();
    } catch {
      this.availableLanguages = [
        { code: 'fr', name: 'French', nativeName: 'Français', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
        { code: 'en', name: 'English', nativeName: 'English', speechAvailable: true, packStatus: 'production_approved', isAvailable: true },
      ];
      this.render();
    }
  }

  public async translatePage(): Promise<void> {
    if (typeof document === 'undefined') return;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();
          if (['script', 'style', 'code', 'pre', 'noscript', 'linguabridge-widget-host'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest('linguabridge-widget-host')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const nodesToTranslate: { node: Node; text: string }[] = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      if (!this.originalDomMap.has(currentNode)) {
        this.originalDomMap.set(currentNode, currentNode.textContent || '');
      }
      const originalText = this.originalDomMap.get(currentNode) || currentNode.textContent || '';
      const trimmed = originalText.trim();
      if (trimmed) {
        nodesToTranslate.push({ node: currentNode, text: trimmed });
      }
      currentNode = walker.nextNode();
    }

    if (nodesToTranslate.length === 0) return;

    // Batch translate
    try {
      const items = nodesToTranslate.map((item) => ({
        text: item.text,
        sourceLang: this.currentSourceLang,
        targetLang: this.currentTargetLang,
        domain: 'financial',
      }));

      const results = await this.client.translateBatch(items);
      results.forEach((res, index) => {
        if (nodesToTranslate[index] && res.translatedText) {
          nodesToTranslate[index].node.textContent = res.translatedText;
        }
      });

      this.isPageTranslated = true;
      this.render();
    } catch (err) {
      console.error('[LinguaBridge] Page translation error:', err);
    }
  }

  public restoreOriginalPage(): void {
    for (const [node, originalText] of this.originalDomMap.entries()) {
      node.textContent = originalText;
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

      // Quick tooltip translate if popover is open
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

    const primaryColor = '#2563eb';
    const bgColor = '#ffffff';
    const textColor = '#1f2937';

    this.shadow.innerHTML = `
      <style>
        :host {
          all: initial;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .widget-button {
          background: ${primaryColor};
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .widget-button:hover {
          transform: scale(1.04);
          background: #1d4ed8;
        }
        .widget-card {
          display: ${this.isOpen ? 'block' : 'none'};
          position: absolute;
          bottom: 56px;
          right: 0;
          width: 320px;
          background: ${bgColor};
          color: ${textColor};
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
          padding: 16px;
          font-size: 13px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 15px;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .close-btn {
          background: transparent;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #6b7280;
        }
        .row {
          margin-bottom: 12px;
        }
        .label {
          font-weight: 600;
          margin-bottom: 4px;
          display: block;
          color: #4b5563;
        }
        select, button.action-btn {
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          font-size: 13px;
          box-sizing: border-box;
        }
        button.action-btn {
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #d1d5db;
          cursor: pointer;
          font-weight: 600;
          margin-top: 6px;
          transition: background 0.1s ease;
        }
        button.action-btn:hover {
          background: #e5e7eb;
        }
        button.action-btn.primary {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }
        button.action-btn.primary:hover {
          background: #1d4ed8;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          background: #ecfdf5;
          color: #047857;
          font-weight: 600;
        }
        .selection-box {
          display: none;
          margin-top: 10px;
          padding: 8px;
          background: #f9fafb;
          border: 1px dashed #d1d5db;
          border-radius: 6px;
          font-size: 12px;
        }
      </style>

      <div class="widget-card">
        <div class="header">
          <span>LinguaBridge Accessibility</span>
          <button class="close-btn" id="close-widget">✕</button>
        </div>

        <div class="row">
          <label class="label">Translate to Language</label>
          <select id="lang-select">
            ${this.availableLanguages
              .map(
                (l) =>
                  `<option value="${l.code}" ${l.code === this.currentTargetLang ? 'selected' : ''}>${l.name} (${l.code})</option>`
              )
              .join('')}
          </select>
        </div>

        <div class="row">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="label" style="margin: 0;">Fintech Guard</span>
            <span class="badge">Active & Protected</span>
          </div>
          <small style="color: #6b7280; font-size: 11px; display: block;">
            All amounts (FCFA), transactions, and financial identifiers are preserved with zero-drift guarantee.
          </small>
        </div>

        <div class="row">
          ${
            this.isPageTranslated
              ? `<button class="action-btn" id="restore-page">Restore Original Text</button>`
              : `<button class="action-btn primary" id="translate-page">Translate Entire Page</button>`
          }
        </div>

        <div id="selection-box" class="selection-box"></div>
      </div>

      <button class="widget-button" id="toggle-widget">
        <span>🌐</span>
        <span>${this.isPageTranslated ? 'Restaurer / Switch' : 'Translate (LinguaBridge)'}</span>
      </button>
    `;

    // Bind event listeners
    this.shadow.getElementById('toggle-widget')?.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.render();
    });

    this.shadow.getElementById('close-widget')?.addEventListener('click', () => {
      this.isOpen = false;
      this.render();
    });

    this.shadow.getElementById('lang-select')?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.currentTargetLang = target.value;
      if (this.isPageTranslated) {
        this.translatePage();
      }
    });

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
