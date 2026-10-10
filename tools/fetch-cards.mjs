// Finds the real label of the game card or cartridge for every Nintendo handheld, Switch and SNES game in data/games.json
// that has none yet, so it shows its own sticker (the logo strip, the art, the code with the region) instead of the box art.
//
//   cd tools && npm install && node fetch-cards.mjs           (games without a label)
//   node fetch-cards.mjs --only ds-mario-kart-ds              (one game, even if it has one)
//   node fetch-cards.mjs --dry                                (report matches, download nothing)
//
// Sources, region by region:
//   the LaunchBox Games Database's "Cart - Front" photos. Its whole database comes as one download (Metadata.zip,
//     about 100 MB, kept in tools/.cache/launchbox): this reads the games and their card photos from it.
//   VGCollect's card scans ("cart-art"), each release listed by its region ([EU], [AU], [NA]…): searched when
//     LaunchBox has no card printed for the copy's own region. The scan nearest the copy's region wins.
// A game can steer the match with "launchboxId": 15183 (the number in its gamesdb.launchbox-app.com/games/details/
// address) or "vgcollectId": 155785 (the number in its vgcollect.com/item/ address), when its title there is another
// one, and "cardPhoto": false leaves the label alone: drawn from the box art (say the only photo is of a card in another
// language), or cut by hand from a photo of the copy itself, when no scan of its print exists.
// The photo is trimmed to the card and only the sticker is cut out of it (STICKER below), to lie in the drawn card's
// label recess (js/cases.js): the plastic round it stays the drawn one.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA = path.join(ROOT, 'data/games.json');
const CACHE = path.join(process.env.COVER_CACHE || path.join(ROOT, 'tools/.cache'), 'launchbox');
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const HEIGHT = 400;

// each console's name on LaunchBox and on VGCollect (a Game Boy Color shelf also holds the Game Boy games that play on it)
const PLATFORM = {
  ds: ['Nintendo DS'], '3ds': ['Nintendo 3DS'], switch: ['Nintendo Switch'], switch2: ['Nintendo Switch 2'],
  gb: ['Nintendo Game Boy'], gbc: ['Nintendo Game Boy Color', 'Nintendo Game Boy'], gba: ['Nintendo Game Boy Advance'],
  snes: ['Super Nintendo Entertainment System'],
};
const VGC_PLATFORM = {
  ds: ['DS'], '3ds': ['3DS'], switch: ['Switch'], switch2: ['Switch 2'],
  gb: ['GB'], gbc: ['GBC', 'GB'], gba: ['GBA'], snes: ['SNES', 'SFC'],
};
const VGC_REGION = { EU: 'Europe', UK: 'United Kingdom', AU: 'Australia', NA: 'North America', JP: 'Japan', KR: 'Korea', TW: 'Asia', CN: 'China' };
// what the photo is flattened on, round the card's corners
const BODY = { ds: '#38383c', '3ds': '#d9dadd', switch: '#48484b', switch2: '#de3a3d' };
// where the sticker lies on the card, in mm: left, top, right, bottom, then the card's width and height
// (the same as the label recess drawn in js/cases.js), and how far in to cut past its edge so no plastic shows
const STICKER = {
  ds: [2.6, 2.2, 30.4, 32, 33, 35], '3ds': [3, 2.2, 30, 32.4, 34.8, 35],
  switch: [1.4, 2.5, 19.6, 26.9, 21, 31], switch2: [1.4, 2.5, 19.6, 26.9, 21, 31],
  gb: [7.6, 18.9, 48.1, 54.4, 57, 65], gbc: [7.6, 18.9, 48.1, 54.4, 57, 65], gba: [5.8, 7.3, 51.2, 32.3, 57, 35],
  snes: [24.7, 1.2, 107.2, 39, 132, 86],
  // a PAL or Japanese SNES cartridge: the Super Famicom's shell, its label across the front (CART.sfc)
  sfc: [8.9, 4.4, 120.1, 41.6, 129, 87],
};
const stickerOf = g => STICKER[g.console === 'snes' && !['USA', 'NTSC-U'].includes(g.region) ? 'sfc' : g.console];
const INSET = 0.012;

// the card printed for the copy's region first (its code ends -AUS, -EUR, -USA), then the nearest English one
const REGION_ORDER = {
  AUS: ['Australia', 'Oceania', 'Europe', 'United Kingdom', 'World', 'North America'],
  USA: ['North America', 'United States', 'Canada', 'World', 'Europe', 'Australia'],
  JPN: ['Japan', 'Asia'],
};
const PAL = ['Europe', 'United Kingdom', 'Australia', 'Oceania', 'World', 'North America'];
const rank = (game, region) => {
  const order = REGION_ORDER[game.region] || PAL;
  const i = order.indexOf(region);
  return i < 0 ? order.length + (region === 'Japan' || region === 'Korea' || region === 'China' ? 2 : 1) : i;
};

const norm = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const unxml = s => s.replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/* ---------- the LaunchBox database ---------- */

function metadata() {
  const xml = path.join(CACHE, 'Metadata.xml');
  if (!fs.existsSync(xml)) {
    fs.mkdirSync(CACHE, { recursive: true });
    const zip = path.join(CACHE, 'Metadata.zip');
    console.log('Downloading the LaunchBox database…');
    execFileSync('curl', ['-sSL', '-f', '-o', zip, 'https://gamesdb.launchbox-app.com/Metadata.zip'], { stdio: 'inherit' });
    execFileSync('unzip', ['-o', '-q', zip, 'Metadata.xml', '-d', CACHE], { stdio: 'inherit' });
    fs.rmSync(zip);
  }
  return xml;
}

// the games on those consoles (id, name, platform) and every card photo, by game id
async function readDatabase() {
  const games = new Map(), carts = new Map();
  const want = new Set(Object.values(PLATFORM).flat());
  let rec = null;
  const field = (line, tag) => { const m = line.match(new RegExp(`^\\s*<${tag}>(.*)</${tag}>\\s*$`)); return m ? unxml(m[1]) : null; };
  const rl = readline.createInterface({ input: fs.createReadStream(metadata()), crlfDelay: Infinity });
  for await (const line of rl) {
    if (line === '  <Game>' || line === '  <GameImage>') { rec = { kind: line.trim() }; continue; }
    if (!rec) continue;
    if (line === '  </Game>') {
      if (want.has(rec.Platform)) games.set(rec.DatabaseID, { id: rec.DatabaseID, name: rec.Name, platform: rec.Platform });
      rec = null; continue;
    }
    if (line === '  </GameImage>') {
      if (rec.Type === 'Cart - Front') (carts.get(rec.DatabaseID) || carts.set(rec.DatabaseID, []).get(rec.DatabaseID)).push({ file: rec.FileName, region: rec.Region || '' });
      rec = null; continue;
    }
    for (const tag of ['Name', 'DatabaseID', 'Platform', 'FileName', 'Type', 'Region']) {
      if (rec[tag] === undefined) { const v = field(line, tag); if (v !== null) { rec[tag] = v; break; } }
    }
  }
  return { games, carts };
}

/* ---------- VGCollect ---------- */

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const JAR = path.join(CACHE, 'vgcollect.cookies');
const curl = (...a) => { try { return execFileSync('curl', ['-s', '-m', '40', '-A', UA, '-c', JAR, '-b', JAR, ...a], { encoding: 'utf8', maxBuffer: 1 << 26 }); } catch { return ''; } };
const unhtml = s => s.replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// the releases of a title on VGCollect: { id, name, platform, region }. Its search runs through a post that
// remembers the query, then pages of results
function vgcSearch(q) {
  fs.mkdirSync(CACHE, { recursive: true });
  curl('-L', '-o', '/dev/null', '-d', 'search-query=' + q, 'https://vgcollect.com/search/process');
  const out = [];
  for (let p = 1; p <= 3; p++) {
    const h = curl('https://vgcollect.com/search/' + encodeURIComponent(q) + (p > 1 ? '/' + p : ''));
    const items = [...h.matchAll(/<div class="item-platform">\s*<a href="[^"]*"><i[^>]*><\/i>\s*([^<]*?)\s*\[([A-Z]+)\]<\/a>[\s\S]*?<div class="item-name">\s*<a href = "https:\/\/vgcollect\.com\/item\/(\d+)">([^<]*)<\/a>/g)];
    if (!items.length) break;
    out.push(...items.map(m => ({ platform: m[1].trim(), region: VGC_REGION[m[2]] || m[2], id: m[3], name: unhtml(m[4]) })));
  }
  return out;
}
const vgcArt = id => `https://vgcollect.com/images/cart-art/${id}.jpg`;
// a release with no scan serves a tiny placeholder, or nothing
function vgcHasArt(id) {
  const r = curl('-o', '/dev/null', '-w', '%{http_code} %{size_download}', vgcArt(id)).split(' ');
  return r[0] === '200' && +r[1] > 3000;
}
function vgcPhotos(g) {
  const plats = VGC_PLATFORM[g.console];
  const hits = g.vgcollectId ? [{ id: String(g.vgcollectId), name: g.title, region: '', platform: '' }]
    : [...new Map([g.title, g.listedAs].filter(Boolean).flatMap(t => vgcSearch(t))
      .filter(x => [g.title, g.listedAs].some(t => norm(t) === norm(x.name)) && plats.includes(x.platform))
      .map(x => [x.id, x])).values()];
  return hits.filter(x => vgcHasArt(x.id)).map(x => ({ url: vgcArt(x.id), region: x.region,
    ref: `${x.name}${x.platform ? ' · ' + x.platform : ''} ${x.region ? '[' + x.region + ']' : ''} · VGCollect #${x.id}`.replace(/\s+·/g, ' ·') }));
}

/* ---------- main ---------- */

const db = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const todo = db.games.filter(g => PLATFORM[g.console] && !['digital', 'code-in-box'].includes(g.format) && g.cardPhoto !== false && (ONLY ? g.id === ONLY : !(g.cover && g.cover.label)));
if (!todo.length) { console.log('Nothing to do.'); process.exit(0); }

const { games, carts } = await readDatabase();
const byName = new Map();
for (const g of games.values()) {
  const k = g.platform + '|' + norm(g.name);
  (byName.get(k) || byName.set(k, []).get(k)).push(g);
}
const host = f => (f.startsWith('r2_') ? 'https://gamesdb-images.launchbox.gg/' : 'https://images.launchbox-app.com/') + f;

const report = { found: [], missing: [] };
for (const g of todo) {
  const hits = g.launchboxId ? [games.get(String(g.launchboxId))].filter(Boolean)
    : PLATFORM[g.console].flatMap(plat => [g.title, g.listedAs].flatMap(t => byName.get(plat + '|' + norm(t)) || []));
  let photos = [...new Map(hits.map(h => [h.id, h])).values()].flatMap(h => (carts.get(h.id) || []).map(c => ({
    url: host(c.file), region: c.region, ref: `${h.name} · ${c.region || 'region not set'} · LaunchBox Games Database #${h.id}` })));
  // LaunchBox has no card printed for this copy's region: look on VGCollect too (LaunchBox's photos are larger, so on a tie they win)
  if (!photos.some(p => rank(g, p.region) === 0)) photos = photos.concat(vgcPhotos(g));
  // a Japanese, Korean or Chinese card has its label in that language: only for a copy from there
  if (g.region !== 'JPN') photos = photos.filter(p => !['Japan', 'Korea', 'China', 'Asia', 'Taiwan'].includes(p.region));
  if (!photos.length) { report.missing.push(`${g.id}  (${g.title})`); continue; }
  const best = photos.map((p, i) => ({ ...p, i })).sort((a, b) => rank(g, a.region) - rank(g, b.region) || a.i - b.i)[0];
  const ref = best.ref;
  report.found.push(`${g.id}  ←  ${ref}`);
  if (DRY) continue;
  const res = await fetch(best.url, { headers: { 'User-Agent': UA } });
  if (!res.ok) { report.missing.push(`${g.id}  (download failed: ${res.status} ${best.url})`); report.found.pop(); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  const rel = `covers/${g.console}/${g.id.slice(g.console.length + 1)}-label.jpg`;
  const card = await sharp(buf).trim({ threshold: 10 }).flatten({ background: BODY[g.console] || '#ffffff' }).toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = card.info, [x1, y1, x2, y2, W, H] = stickerOf(g);
  const left = Math.round(w * (x1 / W + INSET)), top = Math.round(h * (y1 / H + INSET));
  const right = Math.round(w * (x2 / W - INSET)), bottom = Math.round(h * (y2 / H - INSET));
  await sharp(card.data)
    .extract({ left, top, width: right - left, height: bottom - top })
    .resize({ height: HEIGHT, withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(ROOT, rel));
  g.cover = { ...(g.cover || {}), label: rel, labelRef: ref };
}

if (!DRY) fs.writeFileSync(DATA, JSON.stringify(db, null, 2) + '\n');
console.log(`\nFound ${report.found.length}, missing ${report.missing.length}\n`);
if (report.found.length) console.log('Labels:\n  ' + report.found.join('\n  '));
if (report.missing.length) console.log('\nNo card photo:\n  ' + report.missing.join('\n  '));
