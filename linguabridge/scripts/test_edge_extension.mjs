import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXT_DIST = path.resolve('linguabridge/apps/extension/dist');

const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>LinguaBridge Real Browser Test</title></head>
<body>
  <h1>Portail Bancaire Camerounais</h1>
  <p id="phrase-1" style="font-size: 24px; padding: 20px; border: 2px solid green; cursor: pointer;">
    Solde disponible: 50000 FCFA
  </p>
  <button id="btn-action">Transférer de l'argent</button>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(htmlContent);
});

await new Promise((resolve) => server.listen(8766, '127.0.0.1', resolve));
console.log('HTTP server listening on http://127.0.0.1:8766');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge_browser_test_'));

const edgeProc = spawn(EDGE_PATH, [
  `--user-data-dir=${tempDir}`,
  '--remote-debugging-port=9224',
  '--remote-debugging-address=127.0.0.1',
  `--load-extension=${EXT_DIST}`,
  '--autoplay-policy=no-user-gesture-required',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
]);

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  await sleep(2500);

  // Poll for targets until service worker is available
  let swTarget = null;
  for (let i = 0; i < 20; i++) {
    try {
      const targetsRes = await fetch('http://127.0.0.1:9224/json');
      if (targetsRes.ok) {
        const targets = await targetsRes.json();
        swTarget = targets.find(t => t.type === 'service_worker' && t.url.includes('background.js'));
        if (swTarget) break;
      }
    } catch {}
    await sleep(500);
  }

  if (swTarget && swTarget.webSocketDebuggerUrl) {
    console.log('[SW] Connecting to Service Worker CDP...');
    const swWs = new WebSocket(swTarget.webSocketDebuggerUrl);
    swWs.onopen = () => {
      swWs.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    };
    swWs.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        console.log(`[SW LOG ${msg.params.type.toUpperCase()}] ${text}`);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log(`[SW ERROR] ${JSON.stringify(msg.params.exceptionDetails)}`);
      }
    };
  } else {
    console.warn('[SW] Service worker target not found!');
  }

  // Find page target
  const targetsRes = await fetch('http://127.0.0.1:9224/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page');

  const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => { pageWs.onopen = r; });

  pageWs.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  pageWs.send(JSON.stringify({ id: 2, method: 'Log.enable' }));

  pageWs.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      console.log(`[PAGE LOG ${msg.params.type.toUpperCase()}] ${text}`);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.log(`[PAGE ERROR] ${JSON.stringify(msg.params.exceptionDetails)}`);
    }
  };

  console.log('\n--- Navigating to http://127.0.0.1:8766 ---');
  pageWs.send(JSON.stringify({
    id: 10,
    method: 'Page.navigate',
    params: { url: 'http://127.0.0.1:8766' }
  }));
  await sleep(2500);

  // Check injection
  const checkEval = await new Promise(res => {
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === 20) {
        pageWs.removeEventListener('message', handler);
        res(data.result?.result?.value);
      }
    };
    pageWs.addEventListener('message', handler);
    pageWs.send(JSON.stringify({
      id: 20,
      method: 'Runtime.evaluate',
      params: {
        expression: `({
          hasRoot: !!document.getElementById('linguabridge-extension-root'),
          shadow: !!document.getElementById('linguabridge-extension-root')?.shadowRoot
        })`,
        returnByValue: true
      }
    }));
  });
  console.log('DOM Injection Status:', checkEval);

  // 1. Open panel and activate Touch/Click Speak Mode in UI
  console.log('\n--- Activating Touch/Click Speak Mode in UI ---');
  await new Promise(res => {
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === 35) {
        pageWs.removeEventListener('message', handler);
        res(data.result);
      }
    };
    pageWs.addEventListener('message', handler);
    pageWs.send(JSON.stringify({
      id: 35,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          const root = document.getElementById('linguabridge-extension-root');
          const btnToggle = root?.shadowRoot?.getElementById('btn-toggle');
          if (btnToggle) btnToggle.click();
          const btnSpeak = root?.shadowRoot?.getElementById('btn-toggle-speak');
          if (btnSpeak) btnSpeak.click();
          return 'Activated voice mode';
        })()`,
        returnByValue: true
      }
    }));
  });
  await sleep(1000);

  console.log('\n--- Clicking on #phrase-1 to trigger text-to-speech ---');
  const clickRes = await new Promise(res => {
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === 40) {
        pageWs.removeEventListener('message', handler);
        res(data.result?.result?.value);
      }
    };
    pageWs.addEventListener('message', handler);
    pageWs.send(JSON.stringify({
      id: 40,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          const p = document.getElementById('phrase-1');
          if (!p) return { error: 'phrase-1 not found' };
          
          p.click();
          
          const root = document.getElementById('linguabridge-extension-root');
          const audioBar = root?.shadowRoot?.getElementById('audio-bar');
          return {
            clicked: true,
            audioBarDisplay: audioBar ? audioBar.style.display : null,
            audioSpokenText: root?.shadowRoot?.getElementById('audio-spoken-text')?.textContent,
            audioPhonetic: root?.shadowRoot?.getElementById('audio-phonetic')?.textContent
          };
        })()`,
        returnByValue: true
      }
    }));
  });
  console.log('Click on phrase-1 result:', clickRes);

  console.log('\nWaiting 7 seconds to observe speech synthesis & audio playback...');
  await sleep(7000);

  console.log('\n--- Clicking a SECOND time on #phrase-1 to test 0ms instant cached replay ---');
  pageWs.send(JSON.stringify({
    id: 60,
    method: 'Runtime.evaluate',
    params: {
      expression: `(() => {
        const p = document.getElementById('phrase-1');
        p.click();
        return 'Second click dispatched';
      })()`,
      returnByValue: true
    }
  }));

  await sleep(3000);

  // Inspect audio state
  const audioState = await new Promise(res => {
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === 50) {
        pageWs.removeEventListener('message', handler);
        res(data.result?.result?.value);
      }
    };
    pageWs.addEventListener('message', handler);
    pageWs.send(JSON.stringify({
      id: 50,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          const root = document.getElementById('linguabridge-extension-root');
          return {
            audioBarDisplay: root?.shadowRoot?.getElementById('audio-bar')?.style.display,
            activeUtterance: !!window.__linguaActiveUtterance,
            audioElements: Array.from(document.querySelectorAll('audio')).map(a => ({ src: a.src, paused: a.paused }))
          };
        })()`,
        returnByValue: true
      }
    }));
  });
  console.log('Final Audio State:', audioState);
}

run().catch(console.error).finally(() => {
  console.log('\nTest complete. Cleaning up...');
  edgeProc.kill();
  server.close();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  process.exit(0);
});
