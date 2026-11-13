import { Window } from 'happy-dom';
import { translateLocalText } from '../packages/translation-engine/dist/index.mjs';

const urls = process.argv.slice(2);
if (urls.length === 0) {
  console.error('Usage: node scripts/audit-extension-coverage.mjs https://public.example/page [...]');
  process.exitCode = 2;
} else {
  for (const url of urls) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('Only public HTTP pages are supported');
    const response = await fetch(parsed, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`${parsed.origin}: HTTP ${response.status}`);
    const html = await response.text();
    const page = new Window({ url, settings: { disableJavaScriptEvaluation: true, disableCSSFileLoading: true } });
    page.document.write(html);
    const sourceLang = page.document.documentElement.lang.toLowerCase().startsWith('fr') ? 'fr' : 'en';
    const selector = 'h1,h2,h3,p,li,button,a,label,td,th';
    const segments = [...page.document.querySelectorAll(selector)]
      .filter((el) => !el.closest('script,style,[hidden],[inert],[translate="no"]') && !el.querySelector(selector))
      .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
      .filter((text) => text.length >= 3 && text.length <= 300);
    const languages = ['ewo-CM', 'fuv-CM', 'hau-CM', 'knc-CM', 'pcm-CM'];
    const coverage = Object.fromEntries(languages.map((lang) => {
      const unchanged = segments.filter((text) => translateLocalText(text, sourceLang, lang).translatedText === text);
      return [lang, { unchanged: unchanged.length, changed: segments.length - unchanged.length,
        unchangedExamples: unchanged.slice(0, 5) }];
    }));
    console.log(JSON.stringify({ url, sourceLang, staticSegments: segments.length,
      characters: segments.reduce((total, text) => total + text.length, 0), coverage }, null, 2));
    page.close();
  }
}
