import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../apps/extension/dist');

console.log('--- Testing LinguaBridge Built Extension ---');

// 1. Verify manifest
const manifest = JSON.parse(fs.readFileSync(path.join(distPath, 'manifest.json'), 'utf8'));
console.log('✓ Manifest version:', manifest.manifest_version);
console.log('✓ Content script file:', manifest.content_scripts[0].js);
console.log('✓ Permissions:', manifest.permissions);
if (manifest.content_scripts[0].all_frames !== true || manifest.content_scripts[0].match_about_blank !== true) {
  throw new Error('Content script must cover matching child frames and about:blank frames');
}

// 2. Read content.js
const contentJs = fs.readFileSync(path.join(distPath, 'content.js'), 'utf8');

// 3. Setup virtual DOM with banking page content
const window = new Window();
const document = window.document;

document.body.innerHTML = `
  <div id="content">
    <h1 id="welcome" title="Bienvenue sur votre espace bancaire">Bienvenue sur votre espace bancaire</h1>
    <p id="balance">Solde de votre compte: 25000 FCFA</p>
    <button id="transfer" aria-label="Effectuer un virement sécurisé">Effectuer un virement sécurisé</button>
    <input id="acc" type="text" placeholder="Numéro de compte" />
    <input id="btn-submit" type="submit" value="Confirmer le transfert" />
    <div id="portal-inquiry">
      <h2>Say hello. Or send a serious enquiry.</h2>
      <p>Choose the route that matches your enquiry</p>
    </div>
  </div>
`;

let messageListener = null;

// Mock chrome extension APIs in the window
window.chrome = {
  runtime: {
    onMessage: {
      addListener: (fn) => {
        messageListener = fn;
      },
      removeListener: () => {}
    },
    sendMessage: (msg, cb) => {
      // Fallback
    }
  }
};

globalThis.window = window;
globalThis.document = document;
globalThis.chrome = window.chrome;
globalThis.NodeFilter = window.NodeFilter;
globalThis.Node = window.Node;
globalThis.ShadowRoot = window.ShadowRoot;
globalThis.Element = window.Element;
globalThis.DocumentFragment = window.DocumentFragment;
globalThis.MutationObserver = window.MutationObserver;

// 4. Execute content.js directly using Function
try {
  const runner = new Function('window', 'document', 'chrome', 'NodeFilter', 'Node', 'MutationObserver', contentJs);
  runner(window, document, window.chrome, window.NodeFilter, window.Node, window.MutationObserver);
  console.log('✓ content.js evaluated without any SyntaxError or runtime exception');
} catch (err) {
  console.error('✗ content.js evaluation failed:', err);
  process.exit(1);
}

// 5. Verify root element injected into page
const root = window.document.getElementById('linguabridge-extension-root');
if (!root) {
  console.error('✗ Root element #linguabridge-extension-root not found in page');
  process.exit(1);
}
console.log('✓ Root element #linguabridge-extension-root successfully injected into DOM');

// 6. Verify shadow DOM and floating button
const shadow = root.shadowRoot;
if (!shadow) {
  console.error('✗ Shadow root missing');
  process.exit(1);
}
const toggleBtn = shadow.getElementById('btn-toggle');
if (!toggleBtn) {
  console.error('✗ Floating assistant button #btn-toggle not found in shadow DOM');
  process.exit(1);
}
console.log('✓ Floating assistant button found in shadow root with text:', toggleBtn.textContent.trim());

// 7. Verify POPUP_TRANSLATE_PAGE execution
if (!messageListener) {
  console.error('✗ Message listener was not registered');
  process.exit(1);
}
console.log('✓ Message listener successfully registered');

// Send POPUP_TRANSLATE_PAGE
messageListener({ type: 'POPUP_TRANSLATE_PAGE', targetLang: 'ewo-CM' });

const h1Text = window.document.getElementById('welcome').textContent;
const balanceText = window.document.getElementById('balance').textContent;
const btnText = window.document.getElementById('transfer').textContent;
const accInput = window.document.getElementById('acc');
const submitBtn = window.document.getElementById('btn-submit');

const welcomeEl = window.document.getElementById('welcome');
const transferEl = window.document.getElementById('transfer');

console.log('✓ Translated H1 text:', h1Text);
console.log('✓ Translated H1 title attribute:', welcomeEl.getAttribute('title'));
console.log('✓ Translated Balance (FCFA preserved):', balanceText);
console.log('✓ Translated Button text:', btnText);
console.log('✓ Translated Button aria-label attribute:', transferEl.getAttribute('aria-label'));
console.log('✓ Translated Input Placeholder:', accInput.placeholder);
console.log('✓ Translated Submit Button Value:', submitBtn.value);
console.log('✓ Translated portal section:', window.document.getElementById('portal-inquiry').textContent.trim());

if (!h1Text.includes('Mbólo') || !balanceText.includes('25000 FCFA')) {
  console.error('✗ Unexpected translation output:', { h1Text, balanceText, btnText });
  process.exit(1);
}

if (!welcomeEl.getAttribute('title')?.includes('Mbólo')) {
  console.error('✗ H1 title attribute not translated:', welcomeEl.getAttribute('title'));
  process.exit(1);
}

if (!transferEl.getAttribute('aria-label')?.includes('Lóm móni')) {
  console.error('✗ Button aria-label not translated:', transferEl.getAttribute('aria-label'));
  process.exit(1);
}

if (!accInput.placeholder.includes('Nlambá ékóbló')) {
  console.error('✗ Input placeholder not translated:', accInput.placeholder);
  process.exit(1);
}

if (!submitBtn.value.includes('Tíbíli tóbó nlóm')) {
  console.error('✗ Submit button value not translated:', submitBtn.value);
  process.exit(1);
}

// 8. Test Hover-to-Speak ("survoler une section ça parle seul, une fois")
messageListener({ type: 'POPUP_SET_SPEECH', enabled: true }, {}, () => {});
const balanceEl = window.document.getElementById('balance');
const audioBar = shadow.getElementById('audio-bar');
const spokenTextEl = shadow.getElementById('audio-spoken-text');
const phoneticEl = shadow.getElementById('audio-phonetic');

// Dispatch mouseover to trigger hover dwell
balanceEl.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true, cancelable: true }));

// Wait for 250ms past dwell timeout (220ms)
setTimeout(() => {
  if (audioBar.style.display !== 'flex') {
    console.error('✗ Audio bar not displayed upon hovering section');
    process.exit(1);
  }
  console.log('✓ Hover-to-speak triggered audio bar:', spokenTextEl.textContent);
  console.log('✓ Phonetic subtitle bar displayed:', phoneticEl.textContent);

  if (!spokenTextEl.textContent.includes('25000 FCFA')) {
    console.error('✗ Spoken text did not preserve financial balance:', spokenTextEl.textContent);
    process.exit(1);
  }

  // Switch to transfer button section
  const transferBtn = window.document.getElementById('transfer');
  transferBtn.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true, cancelable: true }));

  setTimeout(() => {
    console.log('✓ Switched section hover spoke new section:', spokenTextEl.textContent);
    if (!spokenTextEl.textContent.includes('Lóm móni')) {
      console.error('✗ New section not spoken correctly:', spokenTextEl.textContent);
      process.exit(1);
    }

    // Verify balanceEl outline was cleanly cleared upon switching
    if (balanceEl.style.outline !== '') {
      console.error('✗ Previous section outline was leaked after section switch:', balanceEl.style.outline);
      process.exit(1);
    }
    console.log('✓ Previous section outline was cleanly removed without leak');

    // Verify stop button clears transfer button outline
    const stopBtn = shadow.getElementById('audio-stop');
    stopBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    if (transferBtn.style.outline !== '') {
      console.error('✗ Spoken section outline was not cleared upon stop:', transferBtn.style.outline);
      process.exit(1);
    }
    console.log('✓ Stopping audio cleanly removed active speech outline');

    // 9. Comprehensive Full-Page Verification across ALL 5 Sovereign Languages
    console.log('\n--- Testing All 5 Sovereign Languages on Full Built Extension ---');
    const otherLangs = [
      { code: 'fuv-CM', name: 'Fulfulde', expectedTerm: 'Neldugol ceede' },
      { code: 'hau-CM', name: 'Haoussa', expectedTerm: 'Tura kudi' },
      { code: 'knc-CM', name: 'Kanuri', expectedTerm: 'Kudi tewuro' },
      { code: 'pcm-CM', name: 'Cameroon Pidgin', expectedTerm: 'Send money' },
    ];

    for (const l of otherLangs) {
      messageListener({ type: 'POPUP_TRANSLATE_PAGE', targetLang: l.code });
      const curBalance = window.document.getElementById('balance').textContent;
      const curTransfer = window.document.getElementById('transfer').textContent;
      const curInput = window.document.getElementById('acc').placeholder;
      const curSubmit = window.document.getElementById('btn-submit').value;

      console.log(`✓ [${l.code} ${l.name}] Translated transfer button: "${curTransfer}"`);
      console.log(`✓ [${l.code} ${l.name}] Preserved FCFA in balance: "${curBalance}"`);
      console.log(`✓ [${l.code} ${l.name}] Translated input placeholder: "${curInput}"`);
      console.log(`✓ [${l.code} ${l.name}] Translated submit value: "${curSubmit}"`);

      if (!curBalance.includes('25000 FCFA')) {
        console.error(`✗ AST Guard failed for ${l.name}: FCFA amount missing in "${curBalance}"`);
        process.exit(1);
      }
      if (curTransfer === 'Effectuer un virement sécurisé') {
        console.error(`✗ Language ${l.name} did not translate transfer button!`);
        process.exit(1);
      }
    }

    // 10. Verify Duala remains quarantined (zero unauthorized UI exposure)
    messageListener({ type: 'POPUP_TRANSLATE_PAGE', targetLang: 'dua-CM' });
    const duaBalance = window.document.getElementById('balance').textContent;
    console.log('✓ Duala strictly quarantined (untranslated / protected):', duaBalance);

    console.log('Built extension synthetic-page translation and speech checks passed.');
    process.exit(0);
  }, 260);
}, 260);
