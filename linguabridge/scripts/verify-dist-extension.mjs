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

// 2. Read content.js
const contentJs = fs.readFileSync(path.join(distPath, 'content.js'), 'utf8');

// 3. Setup virtual DOM with banking page content
const window = new Window();
const document = window.document;

document.body.innerHTML = `
  <div id="content">
    <h1 id="welcome">Bienvenue sur votre espace bancaire</h1>
    <p id="balance">Solde de votre compte: 25000 FCFA</p>
    <button id="transfer">Effectuer un virement sécurisé</button>
    <div id="nayokan">
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

// 4. Execute content.js directly using Function
try {
  const runner = new Function('window', 'document', 'chrome', 'NodeFilter', contentJs);
  runner(window, document, window.chrome, window.NodeFilter);
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

console.log('✓ Translated H1:', h1Text);
console.log('✓ Translated Balance (FCFA preserved):', balanceText);
console.log('✓ Translated Button:', btnText);
console.log('✓ Translated Nayokan section:', window.document.getElementById('nayokan').textContent.trim());

if (h1Text.includes('Mbólo') && balanceText.includes('25000 FCFA')) {
  console.log('🎉 ALL LIVE IN-PAGE TRANSLATION CHECKS PASSED PERFECTLY!');
} else {
  console.error('✗ Unexpected translation output:', { h1Text, balanceText, btnText });
  process.exit(1);
}
