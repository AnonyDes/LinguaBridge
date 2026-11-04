import fs from 'node:fs';
import path from 'node:path';

const sourcePath = 'C:/Users/LENOVO/.gemini/antigravity/brain/4c1266e9-e62b-440e-ac5c-17efe69c94ef/.system_generated/steps/55/content.md';
const content = fs.readFileSync(sourcePath, 'utf8');

const mainStart = content.indexOf('<section id="main"');
const mainEnd = content.indexOf('</section>');
const mainContent = content.substring(mainStart, mainEnd);

const regex = /<e>([\s\S]*?)<\/e>/g;
let m;
const entries = [];
const seen = new Set();

function resolveEwondoNoun(rawLemma, par) {
  const stem = rawLemma.replace(/<[^>]+>/g, '').trim();
  if (!par) return stem;

  // Class 1/2 (humans, agents)
  if (par === 'n_1/2_sg/pl' || par === 'n_1a/2_sg/pl' || par === 'pos_1_m/f') {
    if (stem === 'ot') return 'môt';
    if (stem === 'ininga') return 'minga';
    if (stem === 'odo') return 'módo';
    if (/^[aeiouáàéèóòúù]/i.test(stem)) return 'm' + stem;
    if (/^[bpfvm]/i.test(stem)) return 'm' + stem;
    return 'n' + stem;
  }

  // Class 3/4 (trees, instruments, non-human entities)
  if (par === 'n_3/4_sg/pl' || par === 'n_3/3_sg/sg') {
    if (stem === 'ba') return 'mba';
    if (stem === 'bè') return 'mbè';
    if (stem === 'bu') return 'mbu';
    if (stem === 'bòn') return 'mbòn';
    if (/^[aeiouáàéèóòúù]/i.test(stem)) return 'mw' + stem;
    if (/^[bpfvm]/i.test(stem)) return 'm' + stem;
    return 'n' + stem;
  }

  // Class 7/8 (tools, customs, objects)
  if (par === 'n_7/8_sg/pl') {
    if (stem === 'aǹ') return 'byaǹ';
    if (/^[aeiouáàéèóòúù]/i.test(stem)) return 'by' + stem;
    return 'é' + stem;
  }

  // Class 5/6 (paired items, body parts, places)
  if (par.startsWith('n_5') && (par.includes('/6') || par.includes('_sg/pl'))) {
    if (stem === 'al') return 'dzal';
    if (stem === 'as') return 'dzas';
    if (/^[aeiouáàéèóòúù]/i.test(stem)) return 'dz' + stem;
    return 'a' + stem;
  }

  // Class 9/10
  if (par === 'n_9/10_sg/pl' || par === 'n_9/6_sg/pl' || par === 'n_9/2_sg/pl') {
    if (/^[bpfvm]/i.test(stem)) return 'm' + stem;
    if (/^[aeiouáàéèóòúù]/i.test(stem)) return 'ny' + stem;
    return 'n' + stem;
  }

  return stem;
}

while ((m = regex.exec(mainContent)) !== null) {
  const eStr = m[1];
  const lMatch = eStr.match(/<l>(.*?)<\/l>/);
  const rMatch = eStr.match(/<r>(.*?)<\/r>/);
  const parMatch = eStr.match(/<par n="([^"]+)"\/>/);
  if (lMatch && rMatch) {
    const rawL = lMatch[1];
    const rawR = rMatch[1];
    const par = parMatch ? parMatch[1] : '';

    const fra = rawR.replace(/<[^>]+>/g, '').trim();
    const ewo = resolveEwondoNoun(rawL, par);
    const posM = rawL.match(/<s n="([^"]+)"\/>/);
    const pos = posM ? posM[1] : '';

    if (fra && ewo) {
      const key = `${fra.toLowerCase()}||${ewo.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        entries.push({ ewo, fra, pos, par });
      }
    }
  }
}

console.log('Total extracted Apertium entries with resolved morphology:', entries.length);

const targetDir = path.resolve('language-packs/ewondo/dictionaries');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(
  path.join(targetDir, 'apertium-lexicon.json'),
  JSON.stringify({
    source: 'https://github.com/Ngue-Um/apertium-ewo-fra',
    license: 'GPL-3.0',
    description: 'Apertium Ewondo-French bilingual dictionary compiled by Dr. Emmanuel Ngue-Um (with Bantu noun class morphology resolved)',
    count: entries.length,
    entries
  }, null, 2),
  'utf8'
);

console.log('Successfully updated language-packs/ewondo/dictionaries/apertium-lexicon.json');
