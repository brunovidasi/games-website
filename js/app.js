/* app.js — the game shelf. Loads data/games.json, draws the bookcase, and opens
   any game in a 3D view that can be turned round and opened. */

(function () {
  const esc = Case.esc;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const ORDER = Object.fromEntries(CONSOLES.map((c, i) => [c.id, i]));

  const state = { sel: new Set(), region: '', q: '', sort: 'console', covers: '', mode: 'mixed' };
  try { state.mode = localStorage.getItem('shelf-mode') || 'mixed'; } catch (e) { /* storage blocked */ }
  let ALL = [], games = [];

  const miniVars = id => {
    const c = CONSOLE_BY_ID[id];
    return `--mw:${(c.w * .14).toFixed(1)};--mh:${(c.h * .14).toFixed(1)};--mp:${c.mini[0]};--mb:${c.mini[1]}`;
  };

  /* ---------- filtering ---------- */
  const SORTS = {
    console: (a, b) => ORDER[a.console] - ORDER[b.console] || a.title.localeCompare(b.title),
    title:   (a, b) => a.title.localeCompare(b.title) || ORDER[a.console] - ORDER[b.console],
    newest:  (a, b) => (b.released || '').localeCompare(a.released || '') || a.title.localeCompare(b.title),
    oldest:  (a, b) => (a.released || '9999').localeCompare(b.released || '9999') || a.title.localeCompare(b.title),
  };
  function base() {
    const q = state.q.trim().toLowerCase();
    return ALL.filter(g =>
      (!state.region || g.region === state.region) &&
      (!state.covers || (state.covers === 'with') === !!g.cover) &&
      (!q || [g.title, g.listedAs, g.publisher, g.developer, g.genre, g.released, CONSOLE_BY_ID[g.console].name, g.note].join(' ').toLowerCase().includes(q)));
  }
  const list = () => base().filter(g => !state.sel.size || state.sel.has(g.console)).sort(SORTS[state.sort]);

  /* ---------- shell ---------- */
  function shell() {
    const consoles = CONSOLES.filter(c => !c.hidden && ALL.some(g => g.console === c.id));
    const years = ALL.map(g => g.released).filter(Boolean).map(r => +r.slice(0, 4));
    const regions = Object.keys(REGIONS).filter(r => ALL.some(g => g.region === r));
    $('#shell').innerHTML = `
      <header class="hero">
        <div>
          <div class="eyebrow">Bruno's Games</div>
          <h1>The Game Shelf</h1>
          <p>Every game on my shelf, from the Super Nintendo to the Switch 2. Pick up any case to turn it round and open it.</p>
        </div>
        <div class="stats">
          <div><b>${ALL.length}</b><span>Games</span></div>
          <div><b>${consoles.length}</b><span>Consoles</span></div>
          <div><b>${Math.min(...years)}</b><span>Oldest</span></div>
          <div><b>${Math.max(...years)}</b><span>Newest</span></div>
        </div>
      </header>
      <div class="filters"><div class="filters-in">
        <div class="consoles" role="toolbar" aria-label="Filter by console">
          <button class="chip all" data-all><span class="lab"><b>All</b><i data-n="all"></i></span></button>
          ${FAMILIES.filter(f => consoles.some(c => c.fam === f.id)).map(f => `<div class="fam" style="--fc:${f.color}">
            <button class="famname" data-fam="${f.id}">${f.name}</button>
            <div class="row">${consoles.filter(c => c.fam === f.id).map(c => `
              <button class="chip" data-c="${c.id}" title="${c.name}" aria-pressed="false">
                <span class="mini" style="${miniVars(c.id)}"></span>
                <span class="lab"><b>${c.short}</b><i data-n="${c.id}"></i></span>
              </button>`).join('')}</div></div>`).join('')}
        </div>
        <div class="subbar">
          <label class="search"><span aria-hidden="true">⌕</span><input id="q" type="search" placeholder="Search title, publisher, year…" aria-label="Search games"></label>
          ${regions.length > 1 ? `<div class="pills" role="group" aria-label="Region"><button data-r="">All regions</button>${regions.map(r => `<button data-r="${r}">${REGIONS[r].name} <em data-rn="${r}"></em></button>`).join('')}</div>` : ''}
          <select class="sort" id="sort" aria-label="Sort">
            <option value="console">By console</option><option value="title">Title A–Z</option>
            <option value="newest">Newest release first</option><option value="oldest">Oldest release first</option>
          </select>
          <span class="count" id="count"></span>
        </div>
      </div></div>`;

    $$('.chip[data-c]').forEach(b => b.addEventListener('click', e => {
      const id = b.dataset.c;
      if (e.shiftKey || e.metaKey || e.ctrlKey) state.sel.has(id) ? state.sel.delete(id) : state.sel.add(id);
      else state.sel = (state.sel.size === 1 && state.sel.has(id)) ? new Set() : new Set([id]);
      changed();
    }));
    $$('.famname').forEach(b => b.addEventListener('click', () => {
      const ids = consoles.filter(c => c.fam === b.dataset.fam).map(c => c.id);
      const same = ids.length === state.sel.size && ids.every(i => state.sel.has(i));
      state.sel = same ? new Set() : new Set(ids);
      changed();
    }));
    $('[data-all]').addEventListener('click', () => { state.sel = new Set(); changed(); });
    $$('[data-r]').forEach(b => b.addEventListener('click', () => { state.region = b.dataset.r; changed(); }));
    let t;
    $('#q').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; changed(); }, 120); });
    $('#sort').addEventListener('change', e => { state.sort = e.target.value; changed(); });

    $$('#mode button').forEach(b => b.addEventListener('click', () => {
      state.mode = b.dataset.m;
      try { localStorage.setItem('shelf-mode', state.mode); } catch (e) { /* storage blocked */ }
      changed();
    }));
    $$('#covers button').forEach(b => b.addEventListener('click', () => { state.covers = b.dataset.cv; changed(); }));
  }

  function sync() {
    const b = base();
    const counts = {};
    b.forEach(g => counts[g.console] = (counts[g.console] || 0) + 1);
    $$('[data-n]').forEach(i => {
      const k = i.dataset.n, n = k === 'all' ? b.length : (counts[k] || 0);
      i.textContent = n + (n === 1 ? ' game' : ' games');
      if (k !== 'all') i.closest('.chip').classList.toggle('empty', !n);
    });
    $$('.chip[data-c]').forEach(c => { const on = state.sel.has(c.dataset.c); c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
    $('[data-all]').classList.toggle('on', !state.sel.size);
    $$('.famname').forEach(f => {
      const ids = $$('.chip[data-c]', f.parentElement).map(c => c.dataset.c);
      f.classList.toggle('on', ids.length === state.sel.size && ids.every(i => state.sel.has(i)));
    });
    $$('[data-r]').forEach(x => x.classList.toggle('on', x.dataset.r === state.region));
    $$('[data-rn]').forEach(x => x.textContent = ALL.filter(g => g.region === x.dataset.rn).length);
    $$('#mode button').forEach(x => x.classList.toggle('on', x.dataset.m === state.mode));
    $$('#covers button').forEach(x => x.classList.toggle('on', x.dataset.cv === state.covers));
    $('#cv-with').textContent = ALL.filter(g => g.cover).length;
    $('#cv-without').textContent = ALL.filter(g => !g.cover).length;
    $('#count').textContent = `${games.length} of ${ALL.length} games`;
  }

  function changed() {
    games = list();
    sync();
    render(true);
    // a single console shows in the address as #ps2, so it can be linked to
    try {
      const h = state.sel.size === 1 ? '#' + [...state.sel][0] : '';
      if (location.hash !== h) history.replaceState(null, '', h || location.pathname + location.search);
    } catch (e) { /* some viewers refuse it */ }
  }

  /* ---------- tooltip ---------- */
  const tipEl = document.createElement('div');
  tipEl.id = 'tip';
  document.body.append(tipEl);
  function tip(target, g) {
    target.addEventListener('pointerenter', e => {
      if (e.pointerType === 'touch') return;
      tipEl.innerHTML = `<b>${esc(g.title)}</b><span>${CONSOLE_BY_ID[g.console].short} · ${Case.year(g)} · ${esc(REGIONS[g.region]?.name || g.region)}${g.format !== 'boxed' ? ' · ' + FORMATS[g.format] : ''}</span>`;
      tipEl.classList.add('vis');
    });
    target.addEventListener('pointermove', e => {
      const x = Math.min(e.clientX + 14, innerWidth - tipEl.offsetWidth - 8);
      const y = e.clientY + 18 + tipEl.offsetHeight > innerHeight ? e.clientY - tipEl.offsetHeight - 12 : e.clientY + 18;
      tipEl.style.transform = `translate(${x}px,${y}px)`;
    });
    target.addEventListener('pointerleave', () => tipEl.classList.remove('vis'));
  }

  /* ---------- the bookcase ---------- */
  const host = $('#case');
  const scale = () => innerWidth < 640 ? 0.78 : innerWidth < 1000 ? 0.95 : 1.12;

  // In "mixed", one game per console faces out: a favourite if marked, else the newest with a cover.
  function leaders() {
    const out = new Set();
    const by = {};
    games.forEach(g => (by[g.console] = by[g.console] || []).push(g));
    for (const gs of Object.values(by)) {
      const pool = gs.filter(g => g.format === 'boxed');
      const favs = pool.filter(g => g.fav);
      if (favs.length) { favs.forEach(g => out.add(g.id)); continue; }
      const pick = [...pool].sort((a, b) => (!!b.cover - !!a.cover) || (b.released || '').localeCompare(a.released || ''))[0];
      if (pick) out.add(pick.id);
    }
    return out;
  }

  function render(animate) {
    host.innerHTML = '';
    tipEl.classList.remove('vis');
    if (!games.length) {
      host.innerHTML = `<div class="empty-msg"><b>Nothing on this shelf</b>No games match those filters. Try another console or clear the search.</div>`;
      return;
    }
    const s = scale();
    const inner = host.clientWidth - (innerWidth < 820 ? 20 + 12 : 44 + 28);
    const lead = state.mode === 'mixed' ? leaders() : new Set();
    const kindOf = g => g.format === 'cartridge-only' ? 'loose' : g.format === 'digital' ? 'spine' : (state.mode === 'covers' || lead.has(g.id)) ? 'face' : 'spine';
    const tallest = Math.max(...games.map(g => kindOf(g) === 'loose' ? 0 : Case.dims(g, s).h));
    host.style.setProperty('--bay', (tallest + 34) + 'px');

    // left to right, a new shelf when one is full
    const rows = [[]];
    let x = 0, last = null;
    const grouped = state.sort === 'console';
    games.forEach(g => {
      const kind = kindOf(g), d = Case.dims(g, s);
      const newGroup = grouped && g.console !== last;
      const w = (kind === 'face' ? d.w + 12 : kind === 'loose' ? 64 * s : d.d) + 2 + (newGroup && last ? 30 : 0);
      if (x + w > inner && rows[rows.length - 1].length) { rows.push([]); x = 0; }
      const row = rows[rows.length - 1];
      if (newGroup && last && row.length) row.push({ end: true });
      row.push({ g, kind, label: grouped && (newGroup || !row.some(r => r.g)) });
      x += w;
      last = g.console;
    });

    let n = 0;
    const labels = [];
    rows.forEach(row => {
      const shelf = document.createElement('div');
      const bay = document.createElement('div');
      bay.className = 'bay';
      const board = document.createElement('div');
      board.className = 'board';
      const plates = document.createElement('div');
      plates.className = 'plates';
      board.append(plates);
      row.forEach(it => {
        if (it.end) { const b = document.createElement('div'); b.className = 'bookend'; bay.append(b); return; }
        const { g, kind } = it;
        const btn = document.createElement('button');
        btn.className = `item ${kind}` + (animate ? ' enter' : '');
        btn.style.animationDelay = Math.min(n++ * 6, 900) + 'ms';
        btn.setAttribute('aria-label', `${g.title}, ${CONSOLE_BY_ID[g.console].name}, ${Case.year(g)}`);
        const face = kind === 'face' ? Case.front(g, s) : kind === 'loose' ? Case.cart(g, s * 1.6) : Case.spine(g, s);
        btn.append(face);
        btn.addEventListener('click', () => open(g, face, kind));
        tip(btn, g);
        bay.append(btn);
        if (it.label) labels.push([btn, g, plates]);
      });
      shelf.append(bay, board);
      host.append(shelf);
    });

    // a brass label under where each console starts, nudged so none overlap
    let lastPlates = null, edge = 0;
    labels.forEach(([btn, g, plates]) => {
      if (plates !== lastPlates) { edge = -Infinity; lastPlates = plates; }
      const p = document.createElement('div');
      p.className = 'plate';
      p.textContent = CONSOLE_BY_ID[g.console].short;
      p.title = CONSOLE_BY_ID[g.console].name;
      plates.append(p);
      const left = Math.max(btn.offsetLeft - 14, edge + 4);
      p.style.left = left + 'px';
      edge = left + p.offsetWidth;
    });
  }

  /* ---------- detail view ---------- */
  let dv, cur, curList, from, fromKind, rx = -6, ry = -28, isOpen = false;
  const FROM = { spine: 'rotateY(90deg)', face: 'none', loose: 'none' };
  const mode = g => g.format === 'cartridge-only' ? 'cart' : g.format === 'digital' ? 'digital' : 'box';

  function buildDV() {
    dv = document.createElement('div');
    dv.className = 'dv';
    dv.setAttribute('role', 'dialog');
    dv.setAttribute('aria-modal', 'true');
    dv.setAttribute('aria-label', 'Game details');
    dv.innerHTML = `<div class="dv-bg"></div>
      <button class="dv-close" aria-label="Close">✕</button>
      <div class="stage"><span class="hint">Drag to turn</span><div class="mover"></div>
        <div class="views">
          <button data-v="front">Front</button><button data-v="spine">Spine</button><button data-v="back">Back</button>
          <button class="open-btn" data-v="open">Open case</button>
        </div></div>
      <div class="info"></div>`;
    document.body.append(dv);
    $('.dv-bg', dv).addEventListener('click', close);
    $('.dv-close', dv).addEventListener('click', close);
    $$('[data-v]', dv).forEach(b => b.addEventListener('click', () => view(b.dataset.v)));

    const stage = $('.stage', dv);
    let drag = null;
    stage.addEventListener('pointerdown', e => {
      if (e.target.closest('.views')) return;
      drag = { x: e.clientX, y: e.clientY, rx, ry, moved: false };
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      ry = drag.ry + dx * 0.5;
      rx = Math.max(-60, Math.min(60, drag.rx - dy * 0.35));
      turn(false);
    });
    stage.addEventListener('pointerup', () => {
      if (drag && !drag.moved && mode(cur) === 'box') view(isOpen ? 'close' : 'open');
      drag = null;
    });
    document.addEventListener('keydown', e => {
      if (!dv.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === ' ' && mode(cur) === 'box') { e.preventDefault(); view(isOpen ? 'close' : 'open'); }
    });
  }

  function turn(anim) {
    const bx = $('.mover > *', dv);
    if (!bx) return;
    bx.style.transition = anim ? 'transform .8s cubic-bezier(.2,.8,.2,1), translate .8s cubic-bezier(.2,.8,.2,1), scale .8s' : 'translate .8s, scale .8s';
    bx.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    $$('[data-v]', dv).forEach(b => b.classList.remove('on'));
    const n = ((ry % 360) + 360) % 360;
    const v = n > 45 && n < 135 ? 'spine' : n >= 135 && n < 225 ? 'back' : (n < 45 || n > 315) ? 'front' : '';
    if (v && mode(cur) === 'box') $(`[data-v="${v}"]`, dv).classList.add('on');
  }

  function view(v) {
    const bx = $('.bx', dv);
    if (!bx) return;
    const isBox = Case.dims(cur, 1).kind === 'box';
    if (v === 'open' || v === 'close') {
      isOpen = v === 'open';
      bx.classList.toggle('open', isOpen);
      if (isOpen) { rx = -8; ry = isBox ? -18 : 18; }
      $('.open-btn', dv).textContent = isOpen ? (isBox ? 'Put it back' : 'Close case') : (isBox ? 'Take it out' : 'Open case');
    } else {
      if (isOpen) view('close');
      rx = v === 'front' ? -4 : -6;
      ry = { front: -12, spine: 90, back: 180 }[v] + Math.round((dv._ry || 0) / 360) * 360;
    }
    dv._ry = ry;
    turn(true);
  }

  function scaleFor(g) {
    const d = Case.dims(g, 1);
    const r = $('.stage', dv).getBoundingClientRect();
    if (mode(g) === 'cart') return Math.min(r.height * 0.5 / 31, r.width * 0.5 / 57, 7);
    return Math.min(Math.min(r.height * 0.72, 470) / d.h, Math.min(r.width * 0.62, 460) / d.w);
  }

  function info(g) {
    const c = CONSOLE_BY_ID[g.console], st = CONSOLE_BY_ID[Case.styleOf(g)];
    const i = curList.indexOf(g);
    const R = REGIONS[g.region] || { name: g.region, long: g.region };
    const coverLine = g.cover
      ? `Cover scan: ${esc(g.cover.source)} (${esc(g.cover.ref)})`
      : 'No cover scan yet. Drop one into covers/ and point the game at it in data/games.json.';
    return `
      <div class="eyebrow"><span class="mini" style="${miniVars(Case.styleOf(g))}"></span>${c.name}${st !== c ? ` · ${st.name} case` : ''}</div>
      <h2>${esc(g.title)}</h2>
      <div class="sub">${Case.date(g.released, true)}${g.publisher ? ' · ' + esc(g.publisher) : ''}</div>
      <div class="badges">
        <span class="badge gold">${esc(R.name)}</span>
        ${g.format !== 'boxed' ? `<span class="badge">${FORMATS[g.format]}</span>` : ''}
        ${g.edition ? `<span class="badge">${esc(g.edition)}</span>` : ''}
        ${g.launcher ? `<span class="badge" style="border-color:${LAUNCHERS[g.launcher].bg}">${g.launcher === 'none' ? 'No activation needed' : 'Activates on ' + esc(LAUNCHERS[g.launcher].name)}</span>` : ''}
        ${g.genre ? `<span class="badge">${esc(g.genre)}</span>` : ''}
      </div>
      <dl class="facts">
        <div><dt>Released</dt><dd>${Case.date(g.released, true)}</dd></div>
        <div><dt>Region</dt><dd>${esc(R.long)}</dd></div>
        <div><dt>Publisher</dt><dd>${esc(g.publisher || '—')}</dd></div>
        <div><dt>Developer</dt><dd>${esc(g.developer || '—')}</dd></div>
        <div><dt>Console</dt><dd>${esc(c.name)}</dd></div>
        <div><dt>Copy</dt><dd>${FORMATS[g.format]}</dd></div>
      </dl>
      ${g.note ? `<p class="note">${esc(g.note)}</p>` : ''}
      <p class="credit">${coverLine}${g.listedAs ? `<br>On your list as “${esc(g.listedAs)}”.` : ''}</p>
      <div class="navbtns">
        <button data-step="-1" ${i <= 0 ? 'disabled' : ''}>← Prev</button>
        <button data-step="1" ${i >= curList.length - 1 ? 'disabled' : ''}>Next →</button>
        <span>${i + 1} / ${curList.length} · ← → keys${mode(g) === 'box' ? ' · space opens' : ''}</span>
      </div>`;
  }

  function mount(g, fromEl, kind) {
    cur = g;
    isOpen = false;
    const s = scaleFor(g);
    const mover = $('.mover', dv);
    mover.innerHTML = '';
    let obj;
    if (mode(g) === 'box') obj = Case.box(g, s);
    else {
      obj = document.createElement('div');
      obj.className = 'flat';
      obj.append(mode(g) === 'cart' ? Case.cart(g, s) : Case.front(g, s, false));
      if (mode(g) === 'digital') obj.insertAdjacentHTML('beforeend', '<span class="stamp">Digital copy</span>');
    }
    mover.append(obj);
    $('.views', dv).style.display = mode(g) === 'box' ? '' : 'none';
    $('.info', dv).innerHTML = info(g);
    $$('[data-step]', dv).forEach(b => b.addEventListener('click', () => step(+b.dataset.step)));
    if (mode(g) === 'box') $('.open-btn', dv).textContent = Case.dims(g, 1).kind === 'box' ? 'Take it out' : 'Open case';

    rx = -6; ry = mode(g) === 'box' ? -28 : -14;
    if (fromEl) {
      const r = fromEl.getBoundingClientRect();
      const m = mover.getBoundingClientRect();
      const ob = obj.getBoundingClientRect();
      const k = kind === 'spine' ? r.height / ob.height : Math.min(r.width / ob.width, r.height / ob.height);
      mover.style.transition = 'none';
      mover.style.transform = `translate(${r.left + r.width / 2 - (m.left + m.width / 2)}px,${r.top + r.height / 2 - (m.top + m.height / 2)}px) scale(${k})`;
      obj.style.transition = 'none';
      obj.style.transform = mode(g) === 'box' ? FROM[kind] : 'none';
      fromEl.style.visibility = 'hidden';
      from = fromEl; fromKind = kind;
      mover.getBoundingClientRect();
      requestAnimationFrame(() => {
        mover.style.transition = 'transform .75s cubic-bezier(.2,.85,.25,1)';
        mover.style.transform = 'none';
        dv._ry = ry;
        turn(true);
      });
    } else {
      mover.style.transform = 'none';
      dv._ry = ry;
      turn(true);
    }
  }

  function open(g, fromEl, kind) {
    if (!dv) buildDV();
    curList = games;
    tipEl.classList.remove('vis');
    dv.classList.add('open');
    document.body.style.overflow = 'hidden';
    mount(g, fromEl, kind);
    $('.dv-close', dv).focus({ preventScroll: true });
  }

  function step(n) {
    const i = curList.indexOf(cur) + n;
    if (i < 0 || i >= curList.length) return;
    if (from) { from.style.visibility = ''; from = null; }
    mount(curList[i]);
  }

  function close() {
    const mover = $('.mover', dv);
    const done = () => { dv.classList.remove('open', 'closing'); if (from) from.style.visibility = ''; from = null; document.body.style.overflow = ''; mover.innerHTML = ''; };
    if (from && document.contains(from)) {
      const r = from.getBoundingClientRect();
      mover.style.transform = 'none';
      const m = mover.getBoundingClientRect();
      const obj = $('.mover > *', dv);
      obj.classList.remove('open');
      obj.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1), translate .5s, scale .5s';
      obj.style.transform = mode(cur) === 'box' ? FROM[fromKind] : 'none';
      const ob = obj.getBoundingClientRect();
      const k = fromKind === 'spine' ? r.height / Math.max(ob.height, 1) : Math.min(r.width / ob.width, r.height / ob.height);
      mover.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1)';
      mover.style.transform = `translate(${r.left + r.width / 2 - (m.left + m.width / 2)}px,${r.top + r.height / 2 - (m.top + m.height / 2)}px) scale(${k})`;
      dv.classList.add('closing');
      setTimeout(done, 480);
    } else done();
  }

  /* ---------- start ---------- */
  fetch('data/games.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(db => {
      ALL = db.games;
      shell();
      const h = location.hash.slice(1);
      if (CONSOLE_BY_ID[h]) state.sel = new Set([h]);
      $('#sort').value = state.sort;
      games = list();
      sync();
      render(true);
      let rt, lw = innerWidth;
      addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (innerWidth !== lw) { lw = innerWidth; render(false); } }, 150); });
    })
    .catch(() => {
      host.innerHTML = `<div class="empty-msg"><b>The shelf couldn't load</b>data/games.json didn't load. Open the site through a web server (for example <code>npx serve</code>) rather than as a file.</div>`;
    });
})();
