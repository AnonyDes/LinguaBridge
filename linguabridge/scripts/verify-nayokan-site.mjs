import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../apps/extension/dist');

console.log('================================================================');
console.log('🧪 Testing Universal Web Portal with Built Chrome Extension');
console.log('================================================================\n');

const contentJs = fs.readFileSync(path.join(distPath, 'content.js'), 'utf8');

const window = new Window();
const document = window.document;

const INITIAL_HTML = `
<header>
  <nav>
    <a id="nav-home" href="/">Home</a>
    <a id="nav-services" href="/services">Services</a>
    <a id="nav-contact" href="/contact">Contact</a>
  </nav>
</header>
<main>
  <h1 id="hero-title">Helping people turn <em>skills</em> into jobs and businesses in <span class="green">Cameroon.</span></h1>
  <p id="hero-sub">Our platform offers training and helps people develop ideas. We welcome employers and investors who want to support that work.</p>
  <div class="actions">
    <button id="btn-train">Find training →</button>
    <button id="btn-startup">Get startup funding</button>
  </div>
  <div id="badge-lab">Computer lab · Yaoundé</div>
  <div id="badge-finance">Frais de transfert: 150 FCFA sur +237 699 000 111</div>
</main>
`;

document.body.innerHTML = INITIAL_HTML;

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
  { code: 'knc-CM', name: 'Kanuri (Extrême-Nord)', skillWord: 'Nəmngəla' },
  { code: 'pcm-CM', name: 'Cameroon Pidgin', skillWord: 'Sabi work' },
  { code: 'fuv-CM', name: 'Fulfulde', skillWord: 'Gandal' },
  { code: 'hau-CM', name: 'Haoussa', skillWord: 'Dabaru' },
  { code: 'ewo-CM', name: 'Ewondo', skillWord: 'Akóbó' },
];

for (const lang of langs) {
  console.log(`\n--- Testing ${lang.name} [${lang.code}] on Universal Portal ---`);
  messageListener({ type: 'POPUP_TRANSLATE_PAGE', targetLang: lang.code, sourceLang: 'en' });

  const home = document.getElementById('nav-home')?.textContent?.trim();
  const services = document.getElementById('nav-services')?.textContent?.trim();
  const contact = document.getElementById('nav-contact')?.textContent?.trim();
  const heroTitleEl = document.getElementById('hero-title');
  const heroTitle = heroTitleEl?.textContent?.trim();
  const heroSub = document.getElementById('hero-sub')?.textContent?.trim();
  const btnTrain = document.getElementById('btn-train')?.textContent?.trim();
  const btnStartup = document.getElementById('btn-startup')?.textContent?.trim();
  const labBadge = document.getElementById('badge-lab')?.textContent?.trim();
  const badgeFinance = document.getElementById('badge-finance')?.textContent?.trim();

  console.log(`  "Home"            -> "${home}"`);
  console.log(`  "Services"        -> "${services}"`);
  console.log(`  "Contact"         -> "${contact}"`);
  console.log(`  Headline          -> "${heroTitle}"`);
  console.log(`  Paragraph         -> "${heroSub}"`);
  console.log(`  "Find training"   -> "${btnTrain}"`);
  console.log(`  "Get startup..."  -> "${btnStartup}"`);
  console.log(`  "Computer lab"    -> "${labBadge}"`);
  console.log(`  Finance Badge     -> "${badgeFinance}"`);

  // Assertions:
  // 1. Tag preservation: <em> for skills must be present and translated
  const emEl = heroTitleEl.querySelector('em');
  if (!emEl) {
    console.error(`❌ Failed: <em> tag was lost during translation for ${lang.name}!`);
    process.exit(1);
  }
  const emText = emEl.textContent?.trim().toLowerCase();
  if (!emText || emText === 'skills') {
    console.error(`❌ Failed: <em> token 'skills' was not translated for ${lang.name}!`);
    process.exit(1);
  }

  // 2. Class preservation: <span class="green">
  const spanGreen = heroTitleEl.querySelector('span.green');
  if (!spanGreen) {
    console.error(`❌ Failed: <span class="green"> was lost during translation for ${lang.name}!`);
    process.exit(1);
  }

  // 3. No raw English fragments remain
  if (heroTitle?.includes('Helping people') || heroTitle?.includes('turn skills') || heroTitle?.includes('into jobs')) {
    console.error(`❌ Failed: Raw English fragments found in headline for ${lang.name}!`);
    process.exit(1);
  }

  // 4. Button arrow preserved
  if (!btnTrain?.endsWith('→')) {
    console.error(`❌ Failed: Trailing UI arrow '→' was lost on button for ${lang.name}!`);
    process.exit(1);
  }
  if (btnTrain === 'Find training →') {
    console.error(`❌ Failed: "Find training →" was not translated for ${lang.name}!`);
    process.exit(1);
  }

  // 5. Zero-Drift Financial AST Guard
  if (!badgeFinance?.includes('150 FCFA') || !badgeFinance?.includes('+237 699 000 111')) {
    console.error(`❌ Failed: Financial AST Guard corrupted amount or phone for ${lang.name}!`);
    process.exit(1);
  }

  // 6. 100% Reversible Restoration
  messageListener({ type: 'POPUP_RESTORE_PAGE' });
  const restoredHeadline = document.getElementById('hero-title')?.innerHTML?.trim();
  const restoredBtn = document.getElementById('btn-train')?.textContent?.trim();
  const restoredFinance = document.getElementById('badge-finance')?.textContent?.trim();

  if (!restoredHeadline?.includes('<em>skills</em>') || !restoredHeadline?.includes('<span class="green">Cameroon.</span>')) {
    console.error(`❌ Failed: DOM not restored to original structure for ${lang.name}! Got: ${restoredHeadline}`);
    process.exit(1);
  }
  if (restoredBtn !== 'Find training →') {
    console.error(`❌ Failed: Button not restored to 'Find training →' for ${lang.name}! Got: ${restoredBtn}`);
    process.exit(1);
  }
  if (restoredFinance !== 'Frais de transfert: 150 FCFA sur +237 699 000 111') {
    console.error(`❌ Failed: Finance badge not restored to original for ${lang.name}! Got: ${restoredFinance}`);
    process.exit(1);
  }

  console.log(`  ✅ ${lang.name}: 100% SUCCESS ON OPEN-DOMAIN PORTAL (TAGS + TOKENS + RESTORE)!`);
}

console.log('\n================================================================');
console.log('🎉 ALL 5 SOVEREIGN LANGUAGES SUCCESSFULLY TRANSLATE UNIVERSAL PORTAL!');
console.log('================================================================\n');

process.exit(0);
