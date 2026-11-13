// Builds img/<id>-{512,1024,2048}.webp (and the demo video) from the originals on the old Framer site,
// then switches js/media.js from remote (Framer CDN) to local image mode.
import sharp from 'sharp';
import { mkdir, readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = join(ROOT, 'img');
const MEDIA = join(ROOT, 'js', 'media.js');
const SIZES = [512, 1024, 2048];
const VIDEO = 'https://framerusercontent.com/assets/yA6xufaCqM8ovn3GxM5yrJbenkI.mp4';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const exists = async p => { try { return (await stat(p)).size > 512; } catch { return false; } };

// every image id referenced anywhere in the site source
const sources = [join(ROOT, 'index.html'), ...(await readdir(join(ROOT, 'js'))).map(f => join(ROOT, 'js', f))];
const ids = new Set();
for (const f of sources) for (const m of (await readFile(f, 'utf8')).matchAll(/['"]([A-Za-z0-9]{20,32}\.(?:png|jpg))['"]/g)) ids.add(m[1]);
if (ids.size < 40) throw new Error(`expected 40+ image ids, found ${ids.size}`);
await mkdir(IMG, { recursive: true });

async function get(url, min) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'neha-portfolio-build' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < min) throw new Error(`too small (${buf.length} bytes)`);
      return buf;
    } catch (e) { if (attempt === 4) throw new Error(`${url}: ${e.message}`); await sleep(1500 * attempt); }
  }
}

let made = 0;
for (const id of ids) {
  const base = id.replace(/\.\w+$/, '');
  const missing = [];
  for (const w of SIZES) if (!(await exists(join(IMG, `${base}-${w}.webp`)))) missing.push(w);
  if (!missing.length) continue;
  const master = await get(`https://framerusercontent.com/images/${id}?scale-down-to=4096`, 500);
  for (const w of missing) {
    await sharp(master).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 86 }).toFile(join(IMG, `${base}-${w}.webp`));
    made++;
  }
  console.log(`${id}: built ${missing.join('/')}`);
}
if (!(await exists(join(IMG, 'returns-demo.mp4')))) { await writeFile(join(IMG, 'returns-demo.mp4'), await get(VIDEO, 100_000)); console.log('video saved'); }

for (const id of ids) for (const w of SIZES) {
  const f = join(IMG, `${id.replace(/\.\w+$/, '')}-${w}.webp`);
  const meta = await sharp(f).metadata();
  if (meta.format !== 'webp' || !meta.width) throw new Error(`bad file ${f}`);
}
console.log(`${ids.size} images ok, ${made} files built`);

const js = await readFile(MEDIA, 'utf8');
const REMOTE = "const IMG_MODE = 'remote';", LOCAL = "const IMG_MODE = 'local';";
if (js.includes(REMOTE)) { await writeFile(MEDIA, js.replace(REMOTE, LOCAL)); console.log('media.js switched to local image mode'); }
else if (!js.includes(LOCAL)) throw new Error('IMG_MODE line not found in js/media.js');
