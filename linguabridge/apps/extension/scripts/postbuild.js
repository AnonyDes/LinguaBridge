import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(extensionRoot, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Create dist/manifest.json with relative paths for unpacked loading directly from dist/
const rootManifestPath = path.resolve(extensionRoot, 'manifest.json');
if (fs.existsSync(rootManifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(rootManifestPath, 'utf8'));
  
  // Adjust paths to be relative to dist/
  manifest.background = {
    service_worker: 'background.js',
    type: 'module'
  };
  manifest.content_scripts = [
    {
      matches: ['<all_urls>'],
      js: ['content.js'],
      run_at: 'document_idle'
    }
  ];
  manifest.action = {
    default_popup: 'popup.html',
    default_title: 'LinguaBridge Assistant'
  };
  manifest.web_accessible_resources = [
    {
      resources: ['*.js', '*.css'],
      matches: ['<all_urls>']
    }
  ];

  fs.writeFileSync(path.resolve(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('[postbuild] Created dist/manifest.json');
}

// 2. Create dist/popup.html pointing to popup.js (in dist)
const rootPopupPath = path.resolve(extensionRoot, 'popup.html');
if (fs.existsSync(rootPopupPath)) {
  let popupHtml = fs.readFileSync(rootPopupPath, 'utf8');
  // In dist/, popup.js is at root, not dist/popup.js
  popupHtml = popupHtml.replace('src="dist/popup.js"', 'src="popup.js"');
  fs.writeFileSync(path.resolve(distDir, 'popup.html'), popupHtml, 'utf8');
  console.log('[postbuild] Created dist/popup.html');
}
