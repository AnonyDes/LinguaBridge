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

// 1. Copy extension icons into dist/icons/
const srcIconsDir = path.resolve(extensionRoot, 'icons');
const distIconsDir = path.resolve(distDir, 'icons');
if (fs.existsSync(srcIconsDir)) {
  if (!fs.existsSync(distIconsDir)) {
    fs.mkdirSync(distIconsDir, { recursive: true });
  }
  for (const file of fs.readdirSync(srcIconsDir)) {
    fs.copyFileSync(path.resolve(srcIconsDir, file), path.resolve(distIconsDir, file));
  }
  console.log('[postbuild] Copied icons to dist/icons/');
}

// 2. Create dist/manifest.json with relative paths for unpacked loading directly from dist/
const rootManifestPath = path.resolve(extensionRoot, 'manifest.json');
if (fs.existsSync(rootManifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(rootManifestPath, 'utf8'));

  manifest.icons = {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  };
  manifest.background = {
    service_worker: 'background.js',
  };
  manifest.content_scripts = [
    {
      matches: ['<all_urls>'],
      js: ['content.js'],
      run_at: 'document_idle',
    },
  ];
  manifest.action = {
    default_popup: 'popup.html',
    default_title: 'LinguaBridge Assistant',
    default_icon: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
  };
  manifest.web_accessible_resources = [
    {
      resources: ['*.js', '*.css', 'icons/*'],
      matches: ['<all_urls>'],
    },
  ];

  fs.writeFileSync(path.resolve(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('[postbuild] Created dist/manifest.json');
}

// 3. Create dist/popup.html pointing to popup.js (in dist)
const rootPopupPath = path.resolve(extensionRoot, 'popup.html');
if (fs.existsSync(rootPopupPath)) {
  let popupHtml = fs.readFileSync(rootPopupPath, 'utf8');
  popupHtml = popupHtml.replace('src="dist/popup.js"', 'src="popup.js"').replace('type="module"', '');
  fs.writeFileSync(path.resolve(distDir, 'popup.html'), popupHtml, 'utf8');
  console.log('[postbuild] Created dist/popup.html');
}
