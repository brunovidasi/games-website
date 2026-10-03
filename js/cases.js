/* cases.js — draws a game the way it sits on the shelf.
   Case.front / spine / back give flat faces; Case.box puts them together into a
   3D case that can be turned around and opened. Sizes are the console's real case
   size in millimetres times a scale (px per mm). */

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
  function dims(g, s) {
    const c = C()[styleOf(g)];
    const m = g.big ? window.BIGBOX : c;
    return { w: m.w * s, h: m.h * s, d: m.d * s, kind: g.big ? 'box' : c.kind, c };
  }

  // light or dark text for a background colour
  function ink(hex) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, gr = (n >> 8) & 255, b = n & 255;
    const L = (0.2126 * r + 0.7152 * gr + 0.0722 * b) / 255;
    return L > 0.6 ? '#141414' : '#ffffff';
  }

  /* ---------- console logos, drawn in type ---------- */
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

  function vars(g, d) {
    let v = `--w:${d.w.toFixed(1)}px;--h:${d.h.toFixed(1)}px;--d:${d.d.toFixed(1)}px`;
    // spines that carry the game's own colours take them from the cover
    if (d.c.spineArt && g.colors) {
      const [a, b] = g.colors;
      v += d.kind === 'box' ? `;--sb:linear-gradient(${a},${b || a});--sf:${ink(a)}` : `;--sb:${a};--sf:${ink(a)}`;
    }
    return v;
  }
  const cls = (g, d) => `k-${styleOf(g)}${g.big ? ' big' : ''} kind-${d.kind}`;
  const img = (g, c = '', lazy = true) => g.cover ? `<img class="${c}" src="${esc(g.cover.file)}" alt="" ${lazy ? 'loading="lazy"' : ''} decoding="async">` : '';
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // where a PC copy activates: a strip across the bottom of the cover
  function launcherStrip(g) {
    const L = g.launcher && window.LAUNCHERS[g.launcher];
    return L ? `<div class="lch" style="--lb:${L.bg};--lf:${L.fg}"><i>${L.glyph}</i><span>${g.launcher === 'none' ? 'No activation needed' : 'Requires ' + esc(L.name)}</span></div>` : '';
  }

  /* ---------- front ---------- */
  function frontHTML(g, d, lazy) {
    const inner = g.cover
      ? `<div class="ins">${img(g, 'scan', lazy)}</div>`
      : `<div class="ins ph">
          <div class="band">${LOGO[styleOf(g)]}</div>
          <div class="phc"><b class="pht">${esc(g.title)}</b><i class="phr"></i><span class="phs">${year(g)}${g.publisher ? ' · ' + esc(g.publisher) : ''}</span></div>
          <i class="phn">Cover to come</i>${launcherStrip(g)}
        </div>`;
    return `<div class="cv ${cls(g, d)}" style="${vars(g, d)}">${inner}<div class="gl"></div></div>`;
  }
  const front = (g, s, lazy = true) => el(frontHTML(g, dims(g, s), lazy));

  /* ---------- spine ---------- */
  function spineHTML(g, d) {
    return `<div class="sp ${cls(g, d)}${g.format === 'digital' ? ' ghost' : ''}" style="${vars(g, d)}">
      <div class="stop"><span>${SPINE_LOGO[styleOf(g)]}</span></div>
      <div class="sttl">${esc(g.title)}</div>
      ${g.launcher ? `<i class="slch" style="--lb:${window.LAUNCHERS[g.launcher].bg};--lf:${window.LAUNCHERS[g.launcher].fg}">${window.LAUNCHERS[g.launcher].glyph}</i>` : `<div class="sbot">${g.format === 'digital' ? 'DIGITAL' : year(g)}</div>`}
    </div>`;
  }
  const spine = (g, s) => el(spineHTML(g, dims(g, s)));

  /* ---------- back ---------- */
  function backHTML(g, d) {
    const R = window.REGIONS[g.region] || { name: g.region };
    return `<div class="bk ${cls(g, d)}" style="${vars(g, d)}">
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

  /* ---------- what is inside ---------- */
  const CARTS = { switch: [21, 31], ds: [35, 33], '3ds': [35, 33], snes: [120, 86], gb: [57, 65], gbc: [57, 65], gba: [57, 35] };
  function mediaHTML(g, s) {
    const c = C()[styleOf(g)];
    const type = g.big ? 'cd' : c.media;
    if (!CARTS[type]) {
      const D = 120 * s;
      const mark = { dvd: 'DVD', bd: 'BD', cd: '', wii: 'Wii', wiiu: 'Wii U' }[type] || '';
      return `<div class="disc m-${type} k-${styleOf(g)}" style="--dd:${D}px">
        <div class="dlab">${img(g)}${g.cover ? '' : `<span>${esc(g.title)}</span>`}</div>${mark ? `<i class="mark">${mark}</i>` : ''}<i class="hub"></i></div>`;
    }
    const [w, h] = CARTS[type];
    return `<div class="cart c-${type} k-${styleOf(g)}" style="--cw:${w * s}px;--ch:${h * s}px">
      <div class="clab">${img(g)}<span>${esc(g.title)}</span></div></div>`;
  }
  const cart = (g, s) => el(mediaHTML(g, s));

  /* ---------- 3D case ---------- */
  function box(g, s) {
    const d = dims(g, s);
    const W = d.w, H = d.h, D = d.d;
    const b = el(`<div class="bx ${cls(g, d)}" style="${vars(g, d)}">
      <div class="fc f-tray"><div class="tray">${mediaHTML(g, s)}</div></div>
      <div class="fc f-front"><div class="leaf">${frontHTML(g, d, false)}<div class="inner"><div class="manual"><div class="mt">${esc(g.title)}</div><div class="ml"><i></i><i></i><i></i><i style="width:60%"></i></div><div class="mthumb">${img(g)}</div></div></div></div></div>
      <div class="fc f-back">${backHTML(g, d)}</div>
      <div class="fc f-left">${spineHTML(g, d)}</div>
      <div class="fc f-right"><div class="edge"></div></div>
      <div class="fc f-top"><div class="edge"></div></div>
      <div class="fc f-bot"><div class="edge"></div></div>
    </div>`);
    const set = (sel, w, h, l, t, tr) => Object.assign(b.querySelector(sel).style, { width: w + 'px', height: h + 'px', left: l + 'px', top: t + 'px', transform: tr });
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

  window.Case = { dims, front, spine, box, cart, date, year, esc, styleOf };
})();
