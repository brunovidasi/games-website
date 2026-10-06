/* cases.js — draws a game the way it sits on the shelf.
   Case.front / spine / back give flat faces; Case.box puts them together into a
   3D case that can be turned around and opened; Case.cart draws a cartridge or
   game card. Sizes are the real ones in millimetres times a scale (px per mm). */

(function () {
  const C = () => window.CONSOLE_BY_ID;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // "2001-07-19" → "19 Jul 2001" (or "19 July 2001"), "2014-10" → "Oct 2014", "2007" → "2007"
  function date(r, long) {
    if (!r) return 'Unknown';
    const [y, m, d] = r.split('-');
    const mon = m ? (long ? MONTHS[m - 1] : MONTHS[m - 1].slice(0, 3)) : '';
    return [d && +d, mon, y].filter(Boolean).join(' ');
  }
  const year = g => (g.released || '').slice(0, 4) || '—';
  const styleOf = g => g.caseStyle || g.console;

  /* ---------- the case's shape ----------
     A case keeps its console's real height and is built around its cover scan,
     so the scan fills the front exactly: nothing cut, no gaps. A plastic case
     keeps a thin rim and its hinge round the scan; a cardboard box simply is its
     scan. Without a scan the case has its real width, and so has a case whose
     picture is only the game's key art (cover.plain): the console's band is
     printed across its top and the art fills the rest. */
  function layout(g, s) {
    const c = C()[styleOf(g)];
    const m = g.big ? window.BIGBOX : c;
    const kind = g.big ? 'box' : c.kind;
    const h = m.h * s, d = m.d * s;
    const r = g.cover && g.cover.ratio;
    let rim = [0, 0, 0, 0]; // top, right, bottom, left
    if (kind === 'keep') { const t = m.w * s * 0.018; rim = [t, t, t, m.w * s * 0.045]; }
    // a PlayStation jewel case shows its black tray down a wide hinge on the left
    if (kind === 'jewel') { const t = m.w * s * 0.012; rim = [t, t, t, m.w * s * (styleOf(g) === 'ps1' ? 0.1 : 0.07)]; }
    const ih = h - rim[0] - rim[2];
    const iw = r && !g.cover.plain ? ih * r : m.w * s - rim[1] - rim[3];
    return { w: iw + rim[1] + rim[3], h, d, kind, c, ix: rim[3], iy: rim[0], iw, ih };
  }
  const dims = layout;

  // light or dark text for a background colour
  function ink(hex) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, gr = (n >> 8) & 255, b = n & 255;
    return (0.2126 * r + 0.7152 * gr + 0.0722 * b) / 255 > 0.6 ? '#141414' : '#ffffff';
  }

  /* ---------- console logos, drawn in type (for title cards and spines) ---------- */
  const rainbow = t => [...t].map((ch, i) => ch === ' ' ? ' ' : `<span style="color:${['#e8262b', '#f28b1d', '#f7d117', '#47b549', '#2a8fd6', '#7a4bc0'][i % 6]}">${ch}</span>`).join('');
  const LOGO = {
    ps1: '<i class="psd"><b></b><b></b><b></b><b></b></i><em>PlayStation</em>',
    ps2: '<em>PlayStation<sup>®</sup><b>2</b></em>',
    ps3: '<em>PS3</em>', ps4: '<em>PS4</em>', ps5: '<em>PS5</em>',
    xbox: '<em>XBOX</em>', x360: '<em>XBOX 360</em>', xone: '<em>XBOX ONE</em>',
    snes: '<em><b>SUPER NINTENDO</b><small>ENTERTAINMENT SYSTEM</small></em>',
    gb: '<em><b>GAME BOY</b><small>NINTENDO</small></em>',
    gbc: `<em>${rainbow('GAME BOY COLOR')}</em>`,
    gba: '<em>GAME BOY ADVANCE</em>',
    ds: '<em>NINTENDO<b>DS</b></em>', '3ds': '<em>NINTENDO<b>3DS</b></em>',
    wii: '<em>Wii</em>', wiiu: '<em>Wii U</em>',
    switch: '<i class="joy"><b></b><b></b></i><em>NINTENDO SWITCH</em>',
    switch2: '<i class="joy"><b></b><b></b></i><em>NINTENDO SWITCH <b>2</b></em>',
    pc: '<em>PC</em>',
  };
  const SPINE_LOGO = {
    ps1: '<i class="psd"><b></b><b></b><b></b><b></b></i>', ps2: 'PS2', ps3: 'PS3', ps4: 'PS4', ps5: 'PS5',
    xbox: 'XBOX', x360: '360', xone: 'ONE', snes: 'SNES', gb: 'GB', gbc: rainbow('GBC'), gba: 'GBA',
    ds: 'DS', '3ds': '3DS', wii: 'Wii', wiiu: 'Wii U',
    switch: '<i class="joy"><b></b><b></b></i>', switch2: '<i class="joy"><b></b><b></b></i>2', pc: 'PC',
  };

  const px = v => v.toFixed(1) + 'px';
  function vars(g, L) {
    let v = `--w:${px(L.w)};--h:${px(L.h)};--d:${px(L.d)};--ix:${px(L.ix)};--iy:${px(L.iy)};--iw:${px(L.iw)};--ih:${px(L.ih)}`;
    // a case that came in another colour than its console's usual one (a red Wii case, a white Wii U one)
    if (/^#[0-9a-f]{6}$/i.test(g.caseColor || '')) {
      const c = g.caseColor, f = ink(c);
      return v + `;--pl:${c};--sb:${c};--sf:${f};--st:${c};--stf:${f}`;
    }
    // spines that carry the game's own colours take them from the cover (Kinect games keep their purple)
    if (L.c.spineArt && g.colors && !g.kinect) {
      const [a, b] = g.colors;
      v += L.kind === 'box' ? `;--sb:linear-gradient(${a},${b || a});--sf:${ink(a)}` : `;--sb:${a};--sf:${ink(a)}`;
    }
    return v;
  }
  const cls = (g, L) => `k-${styleOf(g)}${g.big ? ' big' : ''}${g.kinect ? ' kinect' : ''}${g.platinum ? ' platinum' : ''}${g.caseColor ? ' tinted' : ''} kind-${L.kind}`;
  const img = (g, c = '', lazy = true) => g.cover ? `<img class="${c}" src="${esc(g.cover.file)}" alt="" ${lazy ? 'loading="lazy"' : ''} decoding="async" draggable="false">` : '';
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // where a PC copy activates: a strip across the bottom of the title card
  function launcherStrip(g) {
    const L = g.launcher && window.LAUNCHERS[g.launcher];
    return L ? `<div class="lch" style="--lb:${L.bg};--lf:${L.fg}"><i>${L.glyph}</i><span>${g.launcher === 'none' ? 'No activation needed' : 'Requires ' + esc(L.name)}</span></div>` : '';
  }

  /* ---------- front ---------- */
  // a Platinum copy's silver band across the top of the cover, over the black one on the scan
  const PLAT = '<div class="plat"><em>PlayStation<sup>®</sup><b>2</b></em><span>Platinum</span></div>';
  function frontHTML(g, L, lazy) {
    const inner = g.cover
      ? `<div class="ins${g.cover.plain ? ' plain' : ''}">${g.cover.plain ? `<div class="band">${LOGO[styleOf(g)]}</div>` : ''}${img(g, 'scan', lazy)}${g.platinum ? PLAT : ''}</div>`
      : `<div class="ins ph">
          <div class="band">${LOGO[styleOf(g)]}</div>
          <div class="phc"><b class="pht">${esc(g.title)}</b><i class="phr"></i><span class="phs">${year(g)}${g.publisher ? ' · ' + esc(g.publisher) : ''}</span></div>
          <i class="phn">Cover to come</i>${launcherStrip(g)}
        </div>`;
    return `<div class="cv ${cls(g, L)}" style="${vars(g, L)}">${inner}<div class="gl"></div></div>`;
  }
  const front = (g, s, lazy = true) => el(frontHTML(g, layout(g, s), lazy));

  /* ---------- spine ---------- */
  function spineHTML(g, L) {
    const Ln = g.launcher && window.LAUNCHERS[g.launcher];
    return `<div class="sp ${cls(g, L)}${g.format === 'digital' ? ' ghost' : ''}" style="${vars(g, L)}">
      <div class="stop"><span>${SPINE_LOGO[styleOf(g)]}</span></div>
      <div class="sttl">${esc(g.title)}</div>
      ${Ln ? `<i class="slch" style="--lb:${Ln.bg};--lf:${Ln.fg}">${Ln.glyph}</i>` : `<div class="sbot">${g.format === 'digital' ? 'DIGITAL' : year(g)}</div>`}
    </div>`;
  }
  const spine = (g, s) => el(spineHTML(g, layout(g, s)));

  /* ---------- back ---------- */
  function backHTML(g, L) {
    const R = window.REGIONS[g.region] || { name: g.region };
    return `<div class="bk ${cls(g, L)}" style="${vars(g, L)}">
      <div class="ins${g.cover ? '' : ' ph'}">${img(g, 'blur')}
        <div class="band">${LOGO[styleOf(g)]}</div>
        <div class="bkin">
          <div class="bkt">${esc(g.title)}</div>
          <div class="bkm"><b>Released</b> ${date(g.released, true)}<br>${[g.publisher, g.developer].filter(Boolean).map(esc).join(' · ')}<br>${esc(g.genre || '')}</div>
          <div class="thumb">${img(g)}</div>
          <div class="bkf"><span class="rg">${esc(R.name)}</span><span class="bar"></span></div>
        </div>
      </div>
    </div>`;
  }

  /* ---------- cartridges and game cards ----------
     Drawn from the real ones, in millimetres: the outline, the grip ridges, the
     raised logo, the recess the label sits in. The label is the cover art, or the
     title. The SNES, Game Boy, GBA and Switch shapes are traced from photos of real
     cartridges; the ones they replaced are kept in legacy/cases.js. */
  // a groove: a dark line with the light catching its lower lip
  const groove = (x1, x2, y, dark, w = .7) => `<path d="M${x1} ${y}H${x2}" stroke="#000" stroke-opacity="${dark ? 0.45 : 0.2}" stroke-width="${w}"/><path d="M${x1} ${y + w * .75}H${x2}" stroke="#fff" stroke-opacity="${dark ? 0.08 : 0.4}" stroke-width="${w * .6}"/>`;
  // lettering moulded into the plastic: a shadow above, the light below
  const emboss = (x, y, size, text, dark, extra = '') => `
    <text x="${x}" y="${y + size * .05}" font-size="${size}" ${extra} fill="#fff" fill-opacity="${dark ? 0.1 : 0.45}">${text}</text>
    <text x="${x}" y="${y}" font-size="${size}" ${extra} fill="#000" fill-opacity="${dark ? 0.5 : 0.22}">${text}</text>`;
  const SANS = `font-family="Arial, Helvetica, sans-serif" font-weight="700"`;
  // the Game Boy cartridge: the notch in its top right corner, the raised "Nintendo GAME BOY" between
  // two sets of grip ridges, the label down its lower part between grey strips, the arrow under it
  const gbBody = (f, dark, name, long = name.length > 8) => `
    <path d="M2 0H50.4Q50.8 0 50.8 .4V4.1Q50.8 4.5 51.2 4.5H57V63Q57 65 55 65H2Q0 65 0 63V2Q0 0 2 0Z" fill="${f}"/>
    <path d="M1.4 27V63.6M55.6 27V63.6M.3 27H1.4M55.6 27H56.7" stroke="#000" stroke-opacity="${dark ? 0.45 : 0.16}" stroke-width=".35" fill="none"/>
    <path d="M1.75 27.3V63.4M55.95 27.3V63.4" stroke="#fff" stroke-opacity="${dark ? 0.07 : 0.3}" stroke-width=".25"/>
    <path d="M2 .45H50.3M51.2 4.95H56.6" stroke="#fff" stroke-opacity="${dark ? 0.14 : 0.5}" stroke-width=".6"/>
    ${[5.6, 7.7, 9.7, 11.7].map(y => groove(.8, 5.4, y, dark) + groove(46.6, 56.4, y, dark)).join('')}
    <rect x="6.1" y="2.2" width="39.7" height="11.6" rx="5.8" fill="#000" fill-opacity="${dark ? 0.25 : 0.07}"/>
    <path d="M8 2.75H44" stroke="#000" stroke-opacity="${dark ? 0.35 : 0.16}" stroke-width=".6"/>
    <path d="M8.4 13.3H43.6" stroke="#fff" stroke-opacity="${dark ? 0.1 : 0.45}" stroke-width=".55"/>
    ${long ? emboss(8.2, 9.6, 1.9, 'Nintendo', dark, `${SANS} font-style="italic" textLength="8.2" lengthAdjust="spacingAndGlyphs"`) + emboss(17.4, 9.7, 3.4, name, dark, `${SANS} textLength="26.4" lengthAdjust="spacingAndGlyphs"`)
      : emboss(9.2, 9.9, 2.4, 'Nintendo', dark, `${SANS} font-style="italic" textLength="10" lengthAdjust="spacingAndGlyphs"`) + emboss(21.3, 9.9, 4.4, name, dark, `${SANS} textLength="21.5" lengthAdjust="spacingAndGlyphs"`)}
    <rect x="6.1" y="17.2" width="44.4" height="38" rx="1.4" fill="#000" fill-opacity="${dark ? 0.3 : 0.08}"/>
    <path d="M7.4 17.6H49.2" stroke="#000" stroke-opacity="${dark ? 0.4 : 0.18}" stroke-width=".5"/>
    <rect x="7.6" y="18.9" width="40.5" height="35.5" rx=".7" fill="#d2d2ce"/>
    <rect x="8.2" y="22.5" width=".5" height="27" fill="#000" fill-opacity=".22"/><rect x="46.9" y="31" width=".5" height="14" fill="#000" fill-opacity=".22"/>
    <path d="M24.8 56.8H33.3L29 60.6Z" fill="#000" fill-opacity="${dark ? 0.35 : 0.1}"/>
    <path d="M33.3 56.8L29 60.6L24.8 56.8" stroke="#fff" stroke-opacity="${dark ? 0.08 : 0.35}" stroke-width=".45" fill="none" transform="translate(0 .35)"/>
    <rect y="62" width="57" height="3" rx="1.5" fill="#000" fill-opacity=".08"/>`;
  // a DS or 3DS game card: a touch taller than wide, the bottom left corner cut off, the label in a
  // frame round its edge: white, with the console's logo across the top and a white strip at the
  // bottom. A 3DS card is light grey and has the little tab on its top edge that stops it going into a DS
  const dsBody = (f, tab, dark) => `${tab ? `<path d="M24.5 1.4V.4Q24.5 0 24.9 0H29.6Q30 0 30 .4V1.4Z" fill="${f}"/><path d="M24.9 .3H29.6" stroke="#fff" stroke-opacity=".7" stroke-width=".3"/>` : ''}<g${tab ? ' transform="translate(0 1.2)"' : ''}>
    <path d="M1.6 0H31.4Q33 0 33 1.6V33.4Q33 35 31.4 35H3.2L0 31.8V1.6Q0 0 1.6 0Z" fill="${f}"/>
    <path d="M1.6 .35H31.4" stroke="#fff" stroke-opacity="${dark ? 0.16 : 0.7}" stroke-width=".35"/>
    <path d="M2.8 1.6H30.2Q31.4 1.6 31.4 2.8V32.2Q31.4 33.4 30.2 33.4H5.5L1.6 29.5V2.8Q1.6 1.6 2.8 1.6Z" fill="#000" fill-opacity="${dark ? 0.35 : 0.1}"/>
    <path d="M31.1 2.4V32.6M5.6 33.1H30.4" stroke="#fff" stroke-opacity="${dark ? 0.12 : 0.6}" stroke-width=".3" fill="none"/>
    <path d="M3.3 2.2H29.7Q30.4 2.2 30.4 2.9V31.3Q30.4 32 29.7 32H5.6L2.6 29V2.9Q2.6 2.2 3.3 2.2Z" fill="#f6f7f8"/>
    <text x="16.6" y="6.15" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#2a2a2e"><tspan font-size="1.25" letter-spacing=".12">NINTENDO</tspan><tspan font-size="3.2" font-weight="900" dx=".2">${tab ? '<tspan fill="#d0021b">3</tspan>DS' : 'DS'}</tspan></text>
    <path d="M2.6 7.3H30.4M2.6 28.8H30.4" stroke="#000" stroke-opacity=".12" stroke-width=".2"/>
    <rect x="21.5" y="30" width="7" height=".5" fill="#000" fill-opacity=".18"/></g>`;
  // the region at the end of the code printed under a Switch card's label
  const cardRegion = g => ({ AUS: 'AUS', USA: 'USA', 'NTSC-U': 'USA', JPN: 'JPN', 'NTSC-J': 'JPN' }[g.region] || 'EUR');
  // a Switch game card: rounded all round, the little tab at the top, the label with the console's red
  // band over the art and its code on a black strip, the arrow under it
  const cardBody = (f, band, two) => g => `
    <path d="M1.7 0H19.3Q21 0 21 1.7V29.3Q21 31 19.3 31H1.7Q0 31 0 29.3V1.7Q0 0 1.7 0Z" fill="${f}"/>
    <path d="M1.7 .3H19.3" stroke="#fff" stroke-opacity=".2" stroke-width=".3"/>
    <rect x=".9" y="2.2" width="19.2" height="25.8" rx="1.3" fill="#000" fill-opacity=".12" stroke="#000" stroke-opacity=".25" stroke-width=".25"/>
    <rect x="7.2" y="1.1" width="6.6" height="1.5" rx=".45" fill="#000" fill-opacity=".3"/>
    <rect x="1.4" y="2.5" width="18.2" height="24.4" rx=".9" fill="#141414"/>
    <path d="M2.3 2.5H18.7Q19.6 2.5 19.6 3.4V8.5H1.4V3.4Q1.4 2.5 2.3 2.5Z" fill="${band}"/>
    ${two ? `
      <rect x="7.6" y="3.4" width="1.2" height="2.9" rx=".45" fill="#fff"/><circle cx="8.2" cy="4.2" r=".28" fill="${band}"/>
      <rect x="9.05" y="3.55" width="1" height="2.6" rx=".4" fill="none" stroke="#fff" stroke-width=".28"/><circle cx="9.55" cy="5.4" r=".25" fill="#fff"/>
      <text x="10.5" y="6.25" ${SANS} font-size="3.6" fill="#fff">2</text>
      <text x="10.5" y="7.25" ${SANS} font-size=".72" letter-spacing=".08" text-anchor="middle" fill="#fff">NINTENDO</text>
      <text x="10.5" y="8.15" ${SANS} font-size=".9" text-anchor="middle" fill="#fff">SWITCH</text>` : `
      <rect x="3.4" y="3.7" width="1.4" height="3.4" rx=".55" fill="#fff"/><circle cx="4.1" cy="4.6" r=".32" fill="${band}"/>
      <rect x="5.05" y="3.85" width="1.15" height="3.1" rx=".45" fill="none" stroke="#fff" stroke-width=".3"/><circle cx="5.62" cy="6.1" r=".3" fill="#fff"/>
      <text x="7" y="5.25" ${SANS} font-size="1.45" letter-spacing=".22" fill="#fff" textLength="10.6" lengthAdjust="spacingAndGlyphs">NINTENDO</text>
      <text x="6.9" y="7.55" ${SANS} font-size="2.4" fill="#fff" textLength="10.9" lengthAdjust="spacingAndGlyphs">SWITCH</text>`}
    <text x="10.5" y="26.1" font-family="'DejaVu Sans Mono', Menlo, Consolas, monospace" font-size="1.05" letter-spacing=".12" text-anchor="middle" fill="#e8e8e8">${two ? 'LB-XXXXX-XXX' : 'LA-H-XXXXX'}-${cardRegion(g)}</text>
    <path d="M9.2 28.4H11.8L10.5 29.8Z" fill="#000" fill-opacity=".35"/>`;
  const GB_PTS = [[0, 1], [1, 0], [50.8, 0], [50.8, 4.5], [57, 4.5], [57, 64], [56, 65], [1, 65], [0, 64]];
  const CARD_PTS = [[0, 1.2], [.4, .4], [1.2, 0], [19.8, 0], [20.6, .4], [21, 1.2], [21, 29.8], [20.6, 30.6], [19.8, 31], [1.2, 31], [.4, 30.6], [0, 29.8]];
  const CART = {
    // the American SNES cartridge: the label housing standing up in the middle, the ridged sides,
    // the grip hollowed out under the label, the two screws, and its label with the Nintendo seal
    // and the rating down the left and the SNES logo down the right
    snes: { w: 132, h: 86, label: [37.8, 2.8, 43.9, 35.4], pos: 'center top', crop: [0, 0, 0, 0.12], c: '#bab9c1', dp: 20,
      pts: [[21, 0], [111, 0], [111, 2.9], [132, 2.9], [132, 86], [0, 86], [0, 2.9], [21, 2.9]], back: [[21, 10, 90, 60]], body: () => `
      <path d="M22 0H110Q111 0 111 1V2.9H130Q132 2.9 132 4.9V84Q132 86 130 86H2Q0 86 0 84V4.9Q0 2.9 2 2.9H21V1Q21 0 22 0Z" fill="#bab9c1"/>
      <path d="M22 .4H110M2 3.3H21M111 3.3H130" stroke="#fff" stroke-opacity=".55" stroke-width=".7"/>
      <path d="M21 3V86M111 3V86" stroke="#000" stroke-opacity=".13" stroke-width=".7"/>
      <path d="M21.6 3V86M111.6 3V86" stroke="#fff" stroke-opacity=".3" stroke-width=".4"/>
      ${[16.7, 30.6, 44.4, 58.2, 72.1].map(y => groove(.6, 20.6, y, false, 1) + groove(111.4, 131.4, y, false, 1)).join('')}
      ${[12, 120].map(x => `<circle cx="${x}" cy="78.4" r="2.7" fill="#6e6440"/><circle cx="${x}" cy="78.4" r="2.1" fill="#c8b06a"/><path d="M${x - .9} 77.9 L${x} 77.4 L${x + .9} 77.9 V78.9 L${x} 79.4 L${x - .9} 78.9Z" fill="#4c4428"/>`).join('')}
      <path d="M25.5 86V54.7Q25.5 51.7 28.5 51.7H104.2Q107.2 51.7 107.2 54.7V86Z" fill="#000" fill-opacity=".07"/>
      <path d="M25.5 85V54.7Q25.5 51.7 28.5 51.7H104.2Q107.2 51.7 107.2 54.7V85" stroke="#000" stroke-opacity=".2" stroke-width=".7" fill="none"/>
      <path d="M54 52.4Q51.4 68 53.4 85.6M78 52.4Q75.4 68 77.4 85.6" stroke="#000" stroke-opacity=".1" stroke-width=".6" fill="none"/>
      <path d="M54.6 52.4Q52 68 54 85.6M78.6 52.4Q76 68 78 85.6" stroke="#fff" stroke-opacity=".3" stroke-width=".4" fill="none"/>
      <rect x="24.7" y="1.2" width="82.5" height="37.8" rx="1.6" fill="#121214"/>
      <text x="31.2" y="3.9" ${SANS} font-size="1.1" letter-spacing=".1" text-anchor="middle" fill="#ddd">LICENSED BY</text>
      <rect x="27.4" y="4.9" width="7.6" height="2.5" rx="1.25" fill="#fff"/><rect x="27.8" y="5.25" width="6.8" height="1.8" rx=".9" fill="none" stroke="#e60012" stroke-width=".25"/>
      <text x="31.2" y="6.7" ${SANS} font-size="1.35" text-anchor="middle" fill="#e60012">Nintendo</text>
      <path d="M27.6 9H29.6L28.6 10.2Z" fill="#7b5cc8"/>
      <rect x="28.3" y="11.4" width="5.8" height="7.6" fill="#fff"/><rect x="28.8" y="12.6" width="4.8" height="5" fill="none" stroke="#111" stroke-width=".35"/>
      <text x="31.2" y="16.3" ${SANS} font-size="2.6" text-anchor="middle" fill="#111">K-A</text>
      <circle cx="31.2" cy="23.4" r="3" fill="#d9c98f"/><circle cx="31.2" cy="23.4" r="2.2" fill="#f2ead0"/><rect x="29.4" y="22.8" width="3.6" height="1.2" rx=".6" fill="none" stroke="#8a7a48" stroke-width=".2"/>
      <text x="31.2" y="29" ${SANS} font-size="1.25" text-anchor="middle" fill="#ddd">SNS-USA</text>
      <text x="31.2" y="30.8" font-family="Arial, Helvetica, sans-serif" font-size="1.1" text-anchor="middle" fill="#ddd">MADE IN JAPAN</text>
      <rect x="83" y="2.4" width="22.5" height="1.4" fill="#e8583b"/>
      <rect x="93" y="12.4" width="11.6" height="13.6" fill="#fff" fill-opacity=".08"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="93" y="${(12.8 + i * 1.12).toFixed(2)}" width="11.6" height=".5" fill="#9a9aa0"/>`).join('')}
      <ellipse cx="97.6" cy="17.3" rx="3.1" ry="2.2" transform="rotate(-38 97.6 17.3)" fill="none" stroke="#121214" stroke-width="1.1"/>
      <ellipse cx="100.2" cy="21.2" rx="3.1" ry="2.2" transform="rotate(-38 100.2 21.2)" fill="none" stroke="#121214" stroke-width="1.1"/>
      <text x="84" y="33.4" font-family="Impact, 'Arial Narrow', Arial, sans-serif" font-style="italic" font-size="3.6" fill="#e8583b" textLength="21.6" lengthAdjust="spacingAndGlyphs">SUPER NINTENDO</text>
      <rect x="84" y="34.6" width="21.6" height="1.6" fill="#e8583b"/>
      <text x="94.8" y="35.85" ${SANS} font-size="1.1" letter-spacing=".15" text-anchor="middle" fill="#121214" textLength="20" lengthAdjust="spacingAndGlyphs">ENTERTAINMENT SYSTEM</text>` },
    // crop: the share of the box art, left, right, top and bottom, taken by the console's name strip, which a cartridge label leaves out
    gb:      { w: 57, h: 65, label: [9.5, 19.1, 35.8, 35.1], pos: 'center 25%', crop: [0.18, 0], c: '#acaca8', dp: 8, pts: GB_PTS, pins: [7, 58.5, 43, 5.4, 26], screw: [28.5, 40], body: () => gbBody('#acaca8', false, 'GAME BOY') },
    gbc:     { w: 57, h: 65, label: [9.5, 19.1, 35.8, 35.1], pos: 'center 25%', crop: [0.18, 0], c: '#2b2b2e', dp: 8, pts: GB_PTS, pins: [7, 58.5, 43, 5.4, 26], screw: [28.5, 40], body: () => gbBody('#2b2b2e', true, 'GAME BOY COLOR') },
    // GBA: wider than tall, a full-width ledge along the top with the raised arch moulded across it,
    // the sides stepped in under it, the corners stepped in again at the bottom by the arrow. The label
    // is printed like a real one: the box art small in the middle, over a soft wash of its own colours,
    // with the Nintendo seal on the left and the code on the right
    gba: { w: 57, h: 35, label: [7, 8.3, 43, 23.2], pos: 'center', crop: [0.19, 0], small: true, c: '#3c3d41', dp: 8,
      pts: [[0, 2], [1, .5], [3, 0], [54, 0], [56, .5], [57, 2], [57, 6.6], [55.6, 6.6], [55.6, 33], [54, 33], [54, 35], [3, 35], [3, 33], [1.4, 33], [1.4, 6.6], [0, 6.6]],
      pins: [6, 29.6, 45, 4.4, 26], screw: [28.5, 12], body: () => `
      <path d="M3.5 0H53.5Q57 0 57 3.5V6.6H55.6V33H54V35H3V33H1.4V6.6H0V3.5Q0 0 3.5 0Z" fill="#3c3d41"/>
      <path d="M3.5 .4H53.5" stroke="#fff" stroke-opacity=".2" stroke-width=".5"/>
      <path d="M1.2 1.2Q28.5 .4 55.8 1.2" stroke="#000" stroke-opacity=".35" stroke-width=".3" fill="none"/>
      <path d="M8.8 5Q28.5 -2 48.2 5Q28.5 1.2 8.8 5Z" fill="#fff" fill-opacity=".08"/>
      <path d="M8.8 5Q28.5 -2 48.2 5" stroke="#fff" stroke-opacity=".32" stroke-width=".3" fill="none"/>
      <path d="M9.6 4.9Q28.5 1.4 47.4 4.9" stroke="#000" stroke-opacity=".45" stroke-width=".3" fill="none"/>
      <path d="M10.4 5Q28.5 1.9 46.6 5" stroke="#fff" stroke-opacity=".18" stroke-width=".22" fill="none"/>
      <path d="M1.4 6.85H55.6" stroke="#000" stroke-opacity=".35" stroke-width=".4"/>
      <rect x="5.8" y="7.3" width="45.4" height="25" rx="1.2" fill="#000" fill-opacity=".3"/>
      <path d="M5 32.3H52" stroke="#fff" stroke-opacity=".1" stroke-width=".35"/>
      <path d="M26.6 33L28.5 34.2L30.4 33" stroke="#000" stroke-opacity=".5" stroke-width=".4" fill="none"/>
      <rect x="3" y="33.6" width="51" height="1.4" fill="#000" fill-opacity=".1"/>` },
    ds:      { w: 33,   h: 35, label: [2.6, 7.4, 27.8, 21.4], pos: 'center 30%', crop: [0.13, 0], c: '#38383c', dp: 3.8,
      pts: [[0, 1], [1, 0], [32, 0], [33, 1], [33, 34], [32, 35], [3.2, 35], [0, 31.8]], pins: [3.5, 1.4, 26, 4.2, 17], body: () => dsBody('#38383c', false, true) },
    // 3DS cards have the little tab on top that stops them going into a DS
    '3ds':   { w: 33,   h: 36.2, label: [2.6, 8.6, 27.8, 21.4], pos: 'center 30%', crop: [0, 0.11], c: '#d9dadd', dp: 3.8,
      pts: [[0, 2.2], [1, 1.2], [24.5, 1.2], [24.5, 0], [30, 0], [30, 1.2], [32, 1.2], [33, 2.2], [33, 35.2], [32, 36.2], [3.2, 36.2], [0, 33]], pins: [3.5, 2.6, 26, 4.2, 17], body: () => dsBody('#d9dadd', true, false) },
    // the art shows in the white part of the label, under the red band (the box's own band is cut off)
    switch:  { w: 21, h: 31, label: [1.4, 8.5, 18.2, 16], pos: 'center 25%', c: '#48484b', dp: 3.3, pts: CARD_PTS, pins: [3, 1.6, 15, 4, 15], body: cardBody('#48484b', '#e4262e', false) },
    // Switch 2 game cards are red
    switch2: { w: 21, h: 31, label: [1.4, 8.5, 18.2, 16], pos: 'center 25%', c: '#de3a3d', dp: 3.3, pts: CARD_PTS, pins: [3, 1.6, 15, 4, 15], body: cardBody('#de3a3d', '#c8262b', true) },
  };
  const pct = (v, of) => (v / of * 100).toFixed(2) + '%';

  // a colour lighter (t > 0) or darker (t < 0)
  function shade(hex, t) {
    const n = parseInt(hex.slice(1), 16), to = t > 0 ? 255 : 0, k = Math.abs(t);
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (to - v) * k).toString(16).padStart(2, '0')).join('');
  }
  // the back, seen from behind: the outline mirrored, the contacts showing through, the screw
  function backSVG(T) {
    const [px0, py, pw, ph, n] = T.pins || [];
    return `<svg viewBox="0 0 ${T.w} ${T.h}" preserveAspectRatio="none" aria-hidden="true"><g transform="translate(${T.w} 0) scale(-1 1)">
      <polygon points="${T.pts.join(' ')}" fill="${shade(T.c, -0.12)}"/>
      ${(T.back || []).map(([x, y, w, h]) => `<rect x="${x + 3}" y="${y}" width="${w - 6}" height="${h}" rx="3" fill="#000" fill-opacity=".07"/>`).join('')}
      ${T.pins ? `<rect x="${px0}" y="${py}" width="${pw}" height="${ph}" rx=".6" fill="#141416"/>` + Array.from({ length: n }, (_, k) => `<rect x="${(px0 + .5 + k * (pw - 1) / n).toFixed(2)}" y="${py + .5}" width="${((pw - 1) / n * .6).toFixed(2)}" height="${ph - 1}" fill="#c9a24a"/>`).join('') : ''}
      ${T.screw ? `<circle cx="${T.screw[0]}" cy="${T.screw[1]}" r="1.7" fill="#000" fill-opacity=".25"/><circle cx="${T.screw[0]}" cy="${T.screw[1]}" r="1.15" fill="#8d8e93"/><path d="M${T.screw[0]} ${T.screw[1]}v-.9M${T.screw[0]} ${T.screw[1]}l.8 .5M${T.screw[0]} ${T.screw[1]}l-.8 .5" stroke="#3a3b40" stroke-width=".35"/>` : ''}
    </g></svg>`;
  }
  // the edges all round, following the outline, each lit by which way it faces (the light is above, on the left)
  function edgesHTML(T, s) {
    const D = T.dp * s;
    return T.pts.map((p, i) => {
      const q = T.pts[(i + 1) % T.pts.length], dx = (q[0] - p[0]) * s, dy = (q[1] - p[1]) * s, len = Math.hypot(dx, dy);
      const lit = (dy * -0.45 + -dx * -0.89) / len;
      return `<i class="ce" style="left:${px(p[0] * s)};top:${px(p[1] * s - D / 2)};width:${px(len + .6)};height:${px(D)};transform:rotate(${(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(2)}deg) rotateX(90deg);background:${shade(T.c, lit > 0 ? lit * 0.2 : lit * 0.45)}"></i>`;
    }).join('');
  }
  // a GBA label: the box art small in the middle over a wash of its colours, the seal and the code
  function smallLabel(g, keep) {
    const r = (g.cover.ratio || 1) * keep;
    return `<img class="wash" src="${esc(g.cover.file)}" alt="" loading="lazy" decoding="async" draggable="false">
      <div class="art" style="aspect-ratio:${r.toFixed(3)}">${img(g)}</div>
      <i class="seal"></i><b class="code">AGB-XXXX-${cardRegion(g)}</b>`;
  }

  function cartHTML(g, s, type) {
    const T = CART[type];
    const [x, y, lw, lh] = T.label;
    // Japanese box art has no name strip down the side
    const [cl, cr, ct = 0, cb = 0] = T.crop && window.REGIONS[g.region]?.std !== 'NTSC-J' ? T.crop : [0, 0], keep = 1 - cl - cr, keepY = 1 - ct - cb;
    const label = !g.cover ? `<span>${esc(g.title)}</span>` : T.small ? smallLabel(g, keep) : img(g);
    return `<div class="cart c-${type} k-${styleOf(g)}" style="--cw:${px(T.w * s)};--ch:${px(T.h * s)};--cd:${px(T.dp * s)}">
      <div class="cf">
        <svg viewBox="0 0 ${T.w} ${T.h}" preserveAspectRatio="none" aria-hidden="true">${T.body(g)}</svg>
        <div class="clab${T.small && g.cover ? ' small' : ''}" style="left:${pct(x, T.w)};top:${pct(y, T.h)};width:${pct(lw, T.w)};height:${pct(lh, T.h)};--lp:${T.pos};--liw:${pct(1, keep)};--lix:${pct(-cl, keep)};--lih:${pct(1, keepY)};--liy:${pct(-ct, keepY)}">${label}</div>
      </div>
      <div class="cb">${backSVG(T)}</div>
      ${edgesHTML(T, s)}
    </div>`;
  }


  /* ---------- what is inside ---------- */
  const mediaType = g => g.big ? 'cd' : C()[styleOf(g)].media;
  const isCart = g => !!CART[mediaType(g)];
  function mediaHTML(g, s) {
    const type = mediaType(g);
    if (!CART[type]) return discHTML(g, s, type);
    // in a plastic case the card sits in the moulded holder at the top of the inside, as it does in a real
    // DS, 3DS or Switch case; out of a cardboard box it stands on its own
    if (C()[styleOf(g)].kind !== 'keep') return cartHTML(g, s, type);
    const T = CART[type];
    return `<div class="holder" style="--hw:${px((T.w + 5) * s)};--hh:${px((T.h + 5) * s)}">${cartHTML(g, s, type)}</div>`;
  }
  function discHTML(g, s, type) {
    const D = 120 * s;
    const mark = { dvd: 'DVD', bd: 'BD', cd: '', wii: 'Wii', wiiu: 'Wii U' }[type] || '';
    return `<div class="disc m-${type} k-${styleOf(g)}" style="--dd:${D}px">
      <div class="dlab">${img(g)}${g.cover ? '' : `<span>${esc(g.title)}</span>`}</div>${mark ? `<i class="mark">${mark}</i>` : ''}<i class="hub"></i></div>`;
  }
  const cart = (g, s) => el(cartHTML(g, s, mediaType(g)));

  /* ---------- 3D case ---------- */
  // stands each face of a 3D case in its place round the middle of the case
  function assemble(b, L) {
    const W = L.w, H = L.h, D = L.d;
    const set = (sel, w, h, l, t, tr) => { const f = b.querySelector(sel); if (f) Object.assign(f.style, { width: w + 'px', height: h + 'px', left: l + 'px', top: t + 'px', transform: tr }); };
    set('.f-front', W, H, 0, 0, `translateZ(${D / 2}px)`);
    set('.f-tray', W, H, 0, 0, `translateZ(${D / 2 - 1}px)`);
    set('.f-back', W, H, 0, 0, `rotateY(180deg) translateZ(${D / 2}px)`);
    set('.f-left', D, H, (W - D) / 2, 0, `rotateY(-90deg) translateZ(${W / 2}px)`);
    set('.f-right', D, H, (W - D) / 2, 0, `rotateY(90deg) translateZ(${W / 2}px)`);
    set('.f-top', W, D, 0, (H - D) / 2, `rotateX(90deg) translateZ(${H / 2}px)`);
    set('.f-bot', W, D, 0, (H - D) / 2, `rotateX(-90deg) translateZ(${H / 2}px)`);
    b.style.width = W + 'px';
    b.style.height = H + 'px';
    return b;
  }

  // just the front and the spine: a case turning as it goes between the shelf and the grid
  function slab(g, s) {
    const L = layout(g, s);
    return assemble(el(`<div class="bx slab ${cls(g, L)}" style="${vars(g, L)}">
      <div class="fc f-front">${frontHTML(g, L, false)}</div>
      <div class="fc f-left">${spineHTML(g, L)}</div>
    </div>`), L);
  }

  function box(g, s) {
    const L = layout(g, s);
    const H = L.h;
    const b = el(`<div class="bx ${cls(g, L)}" style="${vars(g, L)}">
      <div class="fc f-tray"><div class="tray">${mediaHTML(g, s)}</div></div>
      <div class="fc f-front"><div class="leaf">${frontHTML(g, L, false)}<div class="inner"><div class="manual"><div class="mt">${esc(g.title)}</div><div class="ml"><i></i><i></i><i></i><i style="width:60%"></i></div><div class="mthumb">${img(g)}</div></div></div></div></div>
      <div class="fc f-back">${backHTML(g, L)}</div>
      <div class="fc f-left">${spineHTML(g, L)}</div>
      <div class="fc f-right"><div class="edge"></div></div>
      <div class="fc f-top"><div class="edge"></div></div>
      <div class="fc f-bot"><div class="edge"></div></div>
    </div>`);
    assemble(b, L);
    if (isCart(g) && L.kind === 'keep') b.querySelector('.f-tray').style.transform = `translateZ(${-L.d / 2 + 1}px)`;
    // taking it out of a cardboard box: the box shrinks to the bottom of its outline and the
    // cartridge rises three quarters out of the top, so the open box needs no more room than the closed one
    if (L.kind === 'box') {
      const T = CART[mediaType(g)], mh = T ? T.h * s : 120 * s;
      const os = Math.min(0.85, H / (H + 0.75 * mh));
      b.style.setProperty('--os', os.toFixed(3));
      b.style.setProperty('--oy', px(H * (1 - os) / 2));
      b.style.setProperty('--ty', px(H / 2 + 0.25 * mh));
    }
    return b;
  }

  // a cartridge's size in px at scale s, for laying one out
  const cartSize = (g, s) => { const T = CART[mediaType(g)]; return T ? [T.w * s, T.h * s] : [0, 0]; };

  window.Case = { dims, layout, front, spine, box, slab, cart, cartSize, isCart, date, year, esc, styleOf };
})();
