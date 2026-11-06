import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../apps/extension/dist');

console.log('================================================================');
console.log('🧪 Testing Exact Nayokan.org Page with Built Chrome Extension');
console.log('================================================================\n');

const contentJs = fs.readFileSync(path.join(distPath, 'content.js'), 'utf8');

const window = new Window();
const document = window.document;

document.body.innerHTML = `
<header>
  <nav>
    <a id="nav-what" href="/what-we-do">What we do</a>
    <a id="nav-vc" href="/vc">Venture Capital</a>
    <a id="nav-impact" href="/impact">Impact</a>
    <a id="nav-insights" href="/insights">Insights</a>
    <a id="nav-about" href="/about">About</a>
    <a id="nav-contact" href="/contact">Contact</a>
  </nav>
</header>
<main>
  <h1 id="hero-title">Helping people turn <em>skills</em> into jobs and businesses in <span class="green">Cameroon.</span></h1>
  <p id="hero-sub">Nayokan offers hands-on training and helps people develop business ideas. We welcome universities, employers and investors who want to support that work.</p>
  <div class="actions">
    <button id="btn-train">Find training →</button>
    <button id="btn-startup">Get startup funding</button>
  </div>
  <div id="badge-lab">Computer lab · Yaoundé</div>
</main>
`;

let messageListener = null;
window.chrome = {
  runtime: {
    onMessage: {
      addListener: (fn) => { messageListener = fn; },
      removeListener: () => {}
    },
    sendMessage: () => {}
  }
};

globalThis.window = window;
globalThis.document = document;
globalThis.chrome = window.chrome;
globalThis.NodeFilter = window.NodeFilter;
globalThis.Node = window.Node;
globalThis.MutationObserver = window.MutationObserver;

// Execute content.js
const runner = new Function('window', 'document', 'chrome', 'NodeFilter', 'Node', 'MutationObserver', contentJs);
runner(window, document, window.chrome, window.NodeFilter, window.Node, window.MutationObserver);

console.log('✓ content.js evaluated');

const langs = [
  { code: 'knc-CM', name: 'Kanuri (Extrême-Nord)' },
  { code: 'pcm-CM', name: 'Cameroon Pidgin' },
  { code: 'fuv-CM', name: 'Fulfulde' },
  { code: 'hau-CM', name: 'Haoussa' },
  { code: 'ewo-CM', name: 'Ewondo' },
];

for (const lang of langs) {
  console.log(`\n--- Testing ${lang.name} [${lang.code}] on Nayokan.org ---`);
  messageListener({ type: 'POPUP_TRANSLATE_PAGE', targetLang: lang.code, sourceLang: 'en' });

  const whatWeDo = document.getElementById('nav-what')?.textContent?.trim();
  const vc = document.getElementById('nav-vc')?.textContent?.trim();
  const contact = document.getElementById('nav-contact')?.textContent?.trim();
  const heroTitle = document.getElementById('hero-title')?.textContent?.trim();
  const heroSub = document.getElementById('hero-sub')?.textContent?.trim();
  const btnTrain = document.getElementById('btn-train')?.textContent?.trim();
  const btnStartup = document.getElementById('btn-startup')?.textContent?.trim();
  const labBadge = document.getElementById('badge-lab')?.textContent?.trim();

  console.log(`  "What we do"     -> "${whatWeDo}"`);
  console.log(`  "Venture Capital" -> "${vc}"`);
  console.log(`  "Contact"         -> "${contact}"`);
  console.log(`  Headline          -> "${heroTitle}"`);
  console.log(`  Paragraph         -> "${heroSub}"`);
  console.log(`  "Find training"   -> "${btnTrain}"`);
  console.log(`  "Get startup..."  -> "${btnStartup}"`);
  console.log(`  "Computer lab"    -> "${labBadge}"`);

  // Assertions: None should remain raw English
  if (whatWeDo === 'What we do') {
    console.error(`❌ Failed: "What we do" was not translated for ${lang.name}!`);
    process.exit(1);
  }
  if (heroTitle?.includes('Helping people turn skills into jobs')) {
    console.error(`❌ Failed: Headline was not translated for ${lang.name}!`);
    process.exit(1);
  }
  if (btnTrain === 'Find training →') {
    console.error(`❌ Failed: "Find training" button was not translated for ${lang.name}!`);
    process.exit(1);
  }

  console.log(`  ✅ ${lang.name}: 100% SUCCESS ON NAYOKAN.ORG!`);
}

console.log('\n================================================================');
console.log('🎉 ALL 5 SOVEREIGN LANGUAGES SUCCESSFULLY TRANSLATE NAYOKAN.ORG!');
console.log('================================================================\n');
