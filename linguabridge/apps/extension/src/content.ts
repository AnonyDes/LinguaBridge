import type { TranslationResult } from '@linguabridge/shared-types';

class ExtensionAssistant {
  private container: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private originalTextMap = new Map<Node, string>();
  private isPageTranslated = false;
  private currentTargetLang = 'en';
  private currentSourceLang = 'fr';
  private isOpen = false;
  private onMouseUpHandler: (() => void) | null = null;
  private onRuntimeMessageHandler: ((msg: any) => void) | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (document.getElementById('linguabridge-extension-root')) return;

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
  }

  private setupListeners() {
    // Listen for text selection
    this.onMouseUpHandler = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text || text.length < 2) return;

      this.translateSelectedText(text);
    };
    document.addEventListener('mouseup', this.onMouseUpHandler);

    // Listen for background messages
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      this.onRuntimeMessageHandler = (msg: any) => {
        if (msg.type === 'CONTEXT_MENU_TRANSLATE' && msg.text) {
          this.isOpen = true;
          this.render();
          this.translateSelectedText(msg.text);
        }
      };
      chrome.runtime.onMessage.addListener(this.onRuntimeMessageHandler);
    }
  }

  public async translateSelectedText(text: string): Promise<void> {
    const box = this.shadow?.getElementById('selection-preview');
    if (!box) return;

    box.style.display = 'block';
    box.innerHTML = `<div style="color: #6b7280; font-size: 11px;">Translating selection...</div>`;

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
            const res: TranslationResult = response.result;
            box.innerHTML = `
              <div style="font-weight: 600; margin-bottom: 2px;">Selected: "${text}"</div>
              <div style="color: #047857; font-weight: 600;">"${res.translatedText}"</div>
              ${
                res.warnings.length > 0
                  ? `<div style="margin-top: 4px; padding: 4px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; color: #b45309; font-size: 11px;">
                      ⚠️ Financial Guard: ${res.warnings.join(', ')}
                    </div>`
                  : ''
              }
            `;
          } else {
            box.innerHTML = `<div style="color: #ef4444; font-size: 11px;">Translation failed: ${response?.error || 'Unknown error'}</div>`;
          }
        }
      );
    }
  }

  public translateFullPage(): void {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'code', 'pre', 'noscript'].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (parent.closest('#linguabridge-extension-root')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: { node: Node; text: string }[] = [];
    let curr = walker.nextNode();
    while (curr) {
      if (!this.originalTextMap.has(curr)) {
        this.originalTextMap.set(curr, curr.textContent || '');
      }
      const sourceText = this.originalTextMap.get(curr) || curr.textContent || '';
      const trimmed = sourceText.trim();
      if (trimmed) {
        textNodes.push({ node: curr, text: trimmed });
      }
      curr = walker.nextNode();
    }

    if (textNodes.length === 0) return;

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      const items = textNodes.map((item) => ({
        text: item.text,
        sourceLang: this.currentSourceLang,
        targetLang: this.currentTargetLang,
        domain: 'financial',
      }));

      chrome.runtime.sendMessage({ type: 'TRANSLATE_BATCH', items }, (res) => {
        if (res?.success && res.results) {
          res.results.forEach((r: TranslationResult, idx: number) => {
            if (textNodes[idx] && r.translatedText) {
              textNodes[idx].node.textContent = r.translatedText;
            }
          });
          this.isPageTranslated = true;
          this.render();
        }
      });
    }
  }

  public restorePage(): void {
    for (const [node, original] of this.originalTextMap.entries()) {
      node.textContent = original;
    }
    this.isPageTranslated = false;
    this.render();
  }

  private render() {
    if (!this.shadow) return;

    this.shadow.innerHTML = `
      <style>
        .assistant-btn {
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: transform 0.15s ease;
        }
        .assistant-btn:hover {
          transform: scale(1.08);
        }
        .card {
          display: ${this.isOpen ? 'block' : 'none'};
          position: absolute;
          bottom: 56px;
          right: 0;
          width: 310px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          border: 1px solid #e5e7eb;
          padding: 14px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          color: #1f2937;
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
        .btn-action {
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          margin-top: 8px;
        }
        .btn-action.primary {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }
        .preview-box {
          display: none;
          margin-top: 10px;
          padding: 8px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 12px;
        }
      </style>

      <div class="card">
        <div class="header">
          <span>LinguaBridge Assistant</span>
          <button id="close-card" style="background:none;border:none;cursor:pointer;color:#9ca3af;">✕</button>
        </div>

        <div style="margin-bottom: 8px;">
          <label style="font-weight: 600; font-size: 12px; color: #4b5563;">Target Language</label>
          <select id="target-lang" style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #d1d5db; margin-top: 4px;">
            <option value="en" ${this.currentTargetLang === 'en' ? 'selected' : ''}>English (en)</option>
            <option value="fr" ${this.currentTargetLang === 'fr' ? 'selected' : ''}>Français (fr)</option>
            <option value="ewo-CM" disabled>Ewondo (ewo-CM) [Pending Linguist Review]</option>
            <option value="dua-CM" disabled>Duala (dua-CM) [Pending Linguist Review]</option>
          </select>
        </div>

        <div style="margin-top: 10px;">
          ${
            this.isPageTranslated
              ? `<button class="btn-action" id="btn-restore">Restore Original Page</button>`
              : `<button class="btn-action primary" id="btn-translate-page">Translate Entire Page</button>`
          }
        </div>

        <div id="selection-preview" class="preview-box"></div>
      </div>

      <button class="assistant-btn" id="btn-toggle" title="LinguaBridge Accessibility">
        🌐
      </button>
    `;

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

    this.shadow.getElementById('target-lang')?.addEventListener('change', (e) => {
      this.currentTargetLang = (e.target as HTMLSelectElement).value;
      if (this.isPageTranslated) {
        this.translateFullPage();
      }
    });
  }

  public destroy(): void {
    if (this.isPageTranslated) {
      this.restorePage();
    }
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
  }
}

// Instantiate assistant if in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  new ExtensionAssistant();
}

export { ExtensionAssistant };
