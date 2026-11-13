import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { lookupEwondoFromEnglish, lookupEwondoWord } from './providers/ewondo-lexicon';
import { detectFrenchOrEnglish } from './stages/language-detector';

const extractor = new FinancialEntityExtractor();
const excluded = [
  'script', 'style', 'noscript', 'template', 'code', 'pre', 'svg', 'canvas', 'iframe',
  'form', 'input', 'textarea', 'select', 'option', '[contenteditable]', '[role="textbox"]',
  '[hidden]', '[inert]', '[aria-hidden="true"]', '[translate="no"]', '.notranslate',
  '#linguabridge-extension-root',
].join(',');
const protectedPage = [
  'input[type="password"]', '[autocomplete="one-time-code"]',
  '[autocomplete^="cc-"]', '[data-linguabridge-private]',
].join(',');
const protectedRoute = /(?:^|[^a-z])(?:log[-_ ]?in|sign[-_ ]?in|sign[-_ ]?up|auth|oauth|connexion|account|compte|checkout|payment|paiement|transfer|virement|wallet|otp|dashboard)(?:[^a-z]|$)/i;

export interface PageTranslationSettings {
  enabled: boolean;
  source: 'auto' | 'fr' | 'en';
}
export type PageTranslationStatus = 'original' | 'translating' | 'translated' | 'partial' | 'unavailable' | 'protected';

type Slot = { node: Text; original: string; applied: string };
type AttributeSlot = { element: Element; attribute: string; original: string; applied: string };
const labels = ['aria-label', 'alt', 'title'] as const;
const batchSize = 60;

export function translateEwondoSegment(text: string, source: 'fr' | 'en'): string | null {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  if (!match?.[2] || !/\p{L}/u.test(match[2]) || /\p{N}/u.test(match[2]) || match[2].length > 420) return null;
  const [, before, content, after] = match;
  const lookup = source === 'en' ? lookupEwondoFromEnglish : lookupEwondoWord;
  const normalized = content.normalize('NFC').replace(/\s+/g, ' ');
  const plain = normalized.replace(/\s*[.!?…]+$/, '');
  const exact = lookup(normalized);
  const translated = exact ?? lookup(plain);
  if (!translated || translated === content ||
    !extractor.compare(extractor.extract(content), extractor.extract(translated)).safe) return null;
  return before + translated + (exact ? '' : normalized.slice(plain.length)) + after;
}

export function createPageTranslator(report: (status: PageTranslationStatus) => void) {
  const written = new Map<Text, Slot>();
  const attributes = new Map<Element, Map<string, AttributeSlot>>();
  let settings: PageTranslationSettings = { enabled: false, source: 'auto' };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let needsRescan = false;
  let pageUrl = location.href;
  let generation = 0;
  let status: PageTranslationStatus | undefined;

  function setStatus(next: PageTranslationStatus) {
    if (status === next) return;
    status = next;
    report(next);
  }

  function pageIsProtected() {
    const { pathname, hash } = location;
    return protectedRoute.test(pathname) || (hash.startsWith('#/') && protectedRoute.test(hash)) ||
      Boolean(document.querySelector(protectedPage));
  }

  function restore() {
    for (const { node, original, applied } of written.values()) {
      if (node.isConnected && node.data === applied) node.data = original;
    }
    for (const slots of attributes.values()) {
      for (const { element, attribute, original, applied } of slots.values()) {
        if (element.isConnected && element.getAttribute(attribute) === applied) {
          element.setAttribute(attribute, original);
        }
      }
    }
    written.clear();
    attributes.clear();
  }

  function eligible(element: Element): boolean {
    if (element.closest(excluded)) return false;
    const rect = element.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth ||
      !rect.width || !rect.height) return false;
    for (let parent: Element | null = element; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden' ||
        style.visibility === 'collapse' || style.opacity === '0') return false;
    }
    return true;
  }

  function language(value: string | null | undefined): 'fr' | 'en' | null {
    const primary = value?.trim().toLowerCase().split('-')[0];
    return primary === 'fr' || primary === 'en' ? primary : null;
  }

  function scan() {
    timer = undefined;
    const current = ++generation;
    if (!settings.enabled || !document.body) return;
    if (pageIsProtected()) {
      restore();
      setStatus('protected');
      return;
    }
    for (const [node, slot] of written) {
      if (!node.isConnected || node.data !== slot.applied) written.delete(node);
      else if (node.parentElement?.closest(excluded)) {
        node.data = slot.original;
        written.delete(node);
      }
    }
    for (const [element, slots] of attributes) {
      for (const [name, slot] of slots) {
        if (!element.isConnected || element.getAttribute(name) !== slot.applied) slots.delete(name);
        else if (element.closest(excluded)) {
          element.setAttribute(name, slot.original);
          slots.delete(name);
        }
      }
      if (!slots.size) attributes.delete(element);
    }

    const declared = document.documentElement.lang.trim();
    const source = settings.source === 'auto'
      ? language(declared) ?? (declared ? null : detectFrenchOrEnglish(document.body.innerText.slice(0, 4500)))
      : settings.source;
    let applied = 0;
    let untranslated = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node instanceof Element) {
          if (node.matches(excluded)) return NodeFilter.FILTER_REJECT;
          return labels.some((name) => node.hasAttribute(name)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
        return /\p{L}/u.test((node as Text).data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
    const pending: Array<Slot | AttributeSlot> = [];

    function sourceFor(element: Element) {
      if (settings.source !== 'auto') return source;
      const declaredLanguage = element.closest('[lang]')?.getAttribute('lang');
      return declaredLanguage ? language(declaredLanguage) : source;
    }

    function collect(node: Node) {
      if (node instanceof Text) {
        const element = node.parentElement;
        if (!element || !eligible(element)) return;
        if (written.has(node)) { applied++; return; }
        const localSource = sourceFor(element);
        const translated = localSource && translateEwondoSegment(node.data, localSource);
        if (translated) pending.push({ node, original: node.data, applied: translated });
        else if (!/\p{N}/u.test(node.data)) untranslated++;
      } else if (node instanceof Element && eligible(node)) {
        const localSource = sourceFor(node);
        for (const attribute of labels) {
          const original = node.getAttribute(attribute);
          if (!original || !/\p{L}/u.test(original)) continue;
          if (attributes.get(node)?.has(attribute)) { applied++; continue; }
          const translated = localSource && translateEwondoSegment(original, localSource);
          if (translated) pending.push({ element: node, attribute, original, applied: translated });
          else untranslated++;
        }
      }
    }

    function step() {
      if (current !== generation || !settings.enabled || pageUrl !== location.href) return;
      let node: Node | null = null;
      for (let i = 0; i < batchSize && (node = walker.nextNode()); i++) collect(node);
      if (pageIsProtected()) {
        restore();
        setStatus('protected');
        return;
      }
      for (const slot of pending) {
        if ('node' in slot) {
          if (!slot.node.isConnected || slot.node.data !== slot.original || slot.node.parentElement?.closest(excluded)) continue;
          slot.node.data = slot.applied;
          written.set(slot.node, slot);
        } else {
          if (!slot.element.isConnected || slot.element.getAttribute(slot.attribute) !== slot.original || slot.element.closest(excluded)) continue;
          slot.element.setAttribute(slot.attribute, slot.applied);
          let slots = attributes.get(slot.element);
          if (!slots) attributes.set(slot.element, slots = new Map());
          slots.set(slot.attribute, slot);
        }
        applied++;
      }
      pending.length = 0;
      if (node) {
        timer = setTimeout(step, 0);
      } else {
        timer = undefined;
        setStatus(applied ? (untranslated ? 'partial' : 'translated') : 'unavailable');
        if (needsRescan) {
          needsRescan = false;
          schedule();
        }
      }
    }

    step();
  }

  function schedule() {
    if (!settings.enabled) return;
    if (timer !== undefined) {
      needsRescan = true;
      return;
    }
    timer = setTimeout(scan, 90);
  }

  function reset() {
    generation++;
    clearTimeout(timer);
    timer = undefined;
    needsRescan = false;
    restore();
  }

  function checkRoute() {
    if (pageUrl === location.href) return;
    pageUrl = location.href;
    reset();
    if (settings.enabled) { setStatus('translating'); schedule(); }
  }

  const observer = new MutationObserver((records) => {
    checkRoute();
    if (records.some((record) => {
      if (record.type === 'characterData') {
        const node = record.target as Text;
        return written.get(node)?.applied !== node.data;
      }
      if (record.type === 'attributes') {
        const element = record.target as Element;
        const name = record.attributeName!;
        const slot = attributes.get(element)?.get(name);
        return !slot || slot.applied !== element.getAttribute(name);
      }
      return true;
    })) schedule();
  });
  observer.observe(document.documentElement, {
    subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: [...labels, 'lang', 'hidden', 'aria-hidden', 'translate', 'contenteditable', 'class',
      'style', 'type', 'autocomplete', 'inert', 'data-linguabridge-private'],
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('popstate', checkRoute);
  window.addEventListener('hashchange', checkRoute);
  const routeTimer = window.setInterval(checkRoute, 350);

  return {
    configure(next: PageTranslationSettings) {
      if (next.enabled === settings.enabled && next.source === settings.source && status) {
        report(status);
        return;
      }
      reset();
      settings = next;
      setStatus(next.enabled ? 'translating' : 'original');
      schedule();
    },
    destroy() {
      observer.disconnect();
      window.clearInterval(routeTimer);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
      reset();
    },
  };
}
