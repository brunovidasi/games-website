/* app.js — the game shelf. Loads data/games.json and shows it on a bookcase or
   in a list. A game picked from either lifts off and flies into a spotlight
   beside the drawer, the way a record does on the music site; there it can be
   turned round and opened, and closing flies it back to where it was. */

(function () {
  const esc = Case.esc;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ORDER = Object.fromEntries(CONSOLES.map((c, i) => [c.id, i]));
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  /* ---------- remembered choices (this browser only) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('games.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('games.' + k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } },
  };

  /* ---------- sorting: the menu and the list's headers set the same sort ---------- */
  const SORT_BY = {
    title:     { label: 'Title',     value: g => g.title },
    console:   { label: 'Console',   value: g => String(ORDER[g.console]).padStart(2, '0'), plain: true },
    released:  { label: 'Released',  value: g => g.released || '', plain: true },
    region:    { label: 'Region',    value: g => g.region },
    publisher: { label: 'Publisher', value: g => g.publisher || '' },
    genre:     { label: 'Genre',     value: g => g.genre || '' },
  };
  const MENU = {
    console: { key: 'console', dir: 'asc', label: 'By console' },
    title: { key: 'title', dir: 'asc', label: 'Title A–Z' },
    newest: { key: 'released', dir: 'desc', label: 'Newest release first' },
    oldest: { key: 'released', dir: 'asc', label: 'Oldest release first' },
  };
  const validSort = s => s && SORT_BY[s.key] && (s.dir === 'asc' || s.dir === 'desc') ? { key: s.key, dir: s.dir } : { key: 'console', dir: 'asc' };
  function sortList(list, { key, dir }) {
    const { value, plain } = SORT_BY[key];
    const sign = dir === 'desc' ? -1 : 1;
    const cmp = (x, y) => plain ? (x < y ? -1 : x > y ? 1 : 0) : collator.compare(x, y);
    const tie = (a, b) => ORDER[a.console] - ORDER[b.console] || collator.compare(a.title, b.title);
    return [...list].sort((a, b) => {
      const x = value(a), y = value(b);
      if (!x || !y) return (!x - !y) || tie(a, b); // nothing in the column goes last either way
      return sign * cmp(x, y) || tie(a, b);
    });
  }

  const state = {
    view: ['shelf', 'list'].includes(store.get('view')) ? store.get('view') : 'shelf',
    mode: ['mixed', 'spines', 'covers'].includes(store.get('mode')) ? store.get('mode') : 'mixed',
    sort: validSort(store.get('sort')),
    sel: new Set(), region: '', q: '', covers: '',
  };
  let ALL = [], games = [];
  const byId = new Map();

  /* ---------- filtering ---------- */
  const fold = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  function base() {
    const words = fold(state.q).split(/\s+/).filter(Boolean);
    return ALL.filter(g =>
      (!state.region || g.region === state.region) &&
      (!state.covers || (state.covers === 'with') === !!g.cover) &&
      (!words.length || words.every(w => g._hay.includes(w))));
  }
  const list = () => sortList(base().filter(g => !state.sel.size || state.sel.has(g.console)), state.sort);

  /* ---------- the header and controls ---------- */
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
                ${CONSOLE_ART[c.id] || ''}
                <span class="lab"><b>${c.short}</b><i data-n="${c.id}"></i></span>
              </button>`).join('')}</div></div>`).join('')}
        </div>
        <div class="subbar">
          <label class="search"><span aria-hidden="true">⌕</span><input id="q" type="search" placeholder="Search title, publisher, year…" aria-label="Search games"></label>
          ${regions.length > 1 ? `<div class="pills" role="group" aria-label="Region"><button data-r="">All regions</button>${regions.map(r => `<button data-r="${r}">${REGIONS[r].name} <em data-rn="${r}"></em></button>`).join('')}</div>` : ''}
          <select class="sort" id="sort" aria-label="Sort">
            ${Object.entries(MENU).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join('')}
            <option value="custom" hidden></option>
          </select>
          <div class="seg" id="view" role="group" aria-label="View">
            <button type="button" data-view="shelf">Shelf</button>
            <button type="button" data-view="list">List</button>
          </div>
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
    $('#sort').addEventListener('change', e => { if (MENU[e.target.value]) setSort(MENU[e.target.value]); });
    $$('#view button').forEach(b => b.addEventListener('click', () => {
      if (state.view === b.dataset.view) return;
      state.view = b.dataset.view;
      store.set('view', state.view);
      changed();
    }));
    $$('#mode button').forEach(b => b.addEventListener('click', () => { state.mode = b.dataset.m; store.set('mode', state.mode); changed(); }));
    $$('#covers button').forEach(b => b.addEventListener('click', () => { state.covers = b.dataset.cv; changed(); }));
  }

  function setSort(sort) {
    state.sort = validSort(sort);
    store.set('sort', state.sort);
    changed();
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
    $$('#view button').forEach(x => x.classList.toggle('on', x.dataset.view === state.view));
    $$('#mode button').forEach(x => x.classList.toggle('on', x.dataset.m === state.mode));
    $('#modeWrap').hidden = state.view !== 'shelf';
    $$('#covers button').forEach(x => x.classList.toggle('on', x.dataset.cv === state.covers));
    $('#cv-with').textContent = ALL.filter(g => g.cover).length;
    $('#cv-without').textContent = ALL.filter(g => !g.cover).length;
    // the sort menu names the sort, or a line of its own for one set from a column
    const [choice] = Object.entries(MENU).find(([, m]) => m.key === state.sort.key && m.dir === state.sort.dir) || [];
    const custom = $('#sort option[value="custom"]');
    custom.hidden = !!choice;
    custom.textContent = `Sorted by ${SORT_BY[state.sort.key].label} ${state.sort.dir === 'asc' ? '↑' : '↓'}`;
    $('#sort').value = choice || 'custom';
    $('#count').textContent = `${games.length} of ${ALL.length} games`;
  }

  function changed() {
    games = list();
    sync();
    render(true);
    if (!Detail.isOpen()) setHash(state.sel.size === 1 ? [...state.sel][0] : '');
  }

  /* ---------- tooltip ---------- */
  const tipEl = document.createElement('div');
  tipEl.id = 'tip';
  document.body.append(tipEl);
  const host = $('#case');
  host.addEventListener('pointerover', e => {
    const item = e.target.closest('[data-id]');
    if (!item || e.pointerType === 'touch' || !host.contains(item) || state.view !== 'shelf') return;
    const g = byId.get(item.dataset.id);
    tipEl.innerHTML = `<b>${esc(g.title)}</b><span>${CONSOLE_BY_ID[g.console].short} · ${Case.year(g)} · ${esc(REGIONS[g.region]?.name || g.region)}${g.format !== 'boxed' ? ' · ' + FORMATS[g.format] : ''}</span>`;
    tipEl.classList.add('vis');
  });
  host.addEventListener('pointerout', e => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-id]')) tipEl.classList.remove('vis'); });
  addEventListener('pointermove', e => {
    if (!tipEl.classList.contains('vis')) return;
    const x = Math.min(e.clientX + 14, innerWidth - tipEl.offsetWidth - 8);
    const y = e.clientY + 18 + tipEl.offsetHeight > innerHeight ? e.clientY - tipEl.offsetHeight - 12 : e.clientY + 18;
    tipEl.style.transform = `translate(${x}px,${y}px)`;
  });

  // a click anywhere on a game, on the shelf or in the list, picks it up
  host.addEventListener('click', e => {
    const head = e.target.closest('.lsort');
    if (head) {
      const key = head.dataset.key;
      setSort({ key, dir: state.sort.key === key && state.sort.dir === 'asc' ? 'desc' : 'asc' });
      $(`.lsort[data-key="${key}"]`)?.focus({ preventScroll: true });
      return;
    }
    const item = e.target.closest('[data-id]');
    if (item) Detail.open(byId.get(item.dataset.id), faceOf(item));
  });
  host.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('.lrow[data-id]');
    if (item) { e.preventDefault(); Detail.open(byId.get(item.dataset.id), faceOf(item)); }
  });
  // the part of a shelf item or list row that is the game itself
  const faceOf = item => item.querySelector('.lcase > *') || item.firstElementChild;

  function render(animate) {
    tipEl.classList.remove('vis');
    host.classList.toggle('bookcase', state.view === 'shelf');
    host.classList.toggle('listview', state.view === 'list');
    if (!games.length) {
      host.innerHTML = `<div class="empty-msg"><b>Nothing on this shelf</b>No games match those filters. Try another console or clear the search.</div>`;
      return;
    }
    if (state.view === 'list') renderList(); else renderShelf(animate);
    Detail.rehome();
  }

  /* ---------- the bookcase ---------- */
  const scale = () => innerWidth < 640 ? 0.78 : innerWidth < 1000 ? 0.95 : 1.12;

  // In "one cover per console", one game per console faces out: a favourite if marked, else the newest with a cover.
  function leaders() {
    const out = new Set(), by = {};
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

  function renderShelf(animate) {
    host.innerHTML = '';
    const s = scale();
    const inner = host.clientWidth - (innerWidth < 820 ? 20 + 12 : 44 + 28);
    const lead = state.mode === 'mixed' ? leaders() : new Set();
    const kindOf = g => g.format === 'cartridge-only' ? 'loose' : g.format === 'digital' ? 'spine' : (state.mode === 'covers' || lead.has(g.id)) ? 'face' : 'spine';
    const tallest = Math.max(...games.map(g => kindOf(g) === 'loose' ? Case.cartSize(g, s * 1.6)[1] : Case.layout(g, s).h));
    host.style.setProperty('--bay', (tallest + 34) + 'px');

    // left to right, a new shelf when one is full
    const rows = [[]];
    let x = 0, last = null;
    const grouped = state.sort.key === 'console';
    games.forEach(g => {
      const kind = kindOf(g), L = Case.layout(g, s);
      const newGroup = grouped && g.console !== last;
      const w = (kind === 'face' ? L.w + 12 : kind === 'loose' ? Case.cartSize(g, s * 1.6)[0] + 16 : L.d) + 2 + (newGroup && last ? 30 : 0);
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
        btn.dataset.id = g.id;
        btn.style.animationDelay = Math.min(n++ * 6, 900) + 'ms';
        btn.setAttribute('aria-label', `${g.title}, ${CONSOLE_BY_ID[g.console].name}, ${Case.year(g)}`);
        btn.append(kind === 'face' ? Case.front(g, s) : kind === 'loose' ? Case.cart(g, s * 1.6) : Case.spine(g, s));
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

  /* ---------- the list ---------- */
  const COLS = ['title', 'console', 'released', 'region', 'publisher', 'genre'];
  function renderList() {
    const wrap = document.createElement('div');
    wrap.className = 'list';
    const head = document.createElement('div');
    head.className = 'lrow lhead';
    head.innerHTML = '<span></span>' + COLS.map(key => {
      const on = state.sort.key === key;
      return `<span><button type="button" class="lsort${on ? ` on ${state.sort.dir}` : ''}" data-key="${key}" aria-label="Sort by ${SORT_BY[key].label}${on ? `, sorted ${state.sort.dir === 'asc' ? 'ascending' : 'descending'}` : ''}">${SORT_BY[key].label}<i aria-hidden="true"></i></button></span>`;
    }).join('');
    wrap.append(head);

    games.forEach(g => {
      const c = CONSOLE_BY_ID[g.console];
      const row = document.createElement('div');
      row.className = 'lrow';
      row.dataset.id = g.id;
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.setAttribute('aria-label', `${g.title}, ${c.name}. Open details`);
      const thumb = document.createElement('span');
      thumb.className = 'lcase';
      if (g.format === 'cartridge-only') {
        const [cw, ch] = Case.cartSize(g, 1);
        thumb.append(Case.cart(g, Math.min(44 / ch, 46 / cw)));
      } else {
        const L = Case.layout(g, 1);
        const face = Case.front(g, Math.min(48 / L.h, 58 / L.w));
        if (g.format === 'digital') face.classList.add('ghosted');
        thumb.append(face);
      }
      row.append(thumb);
      row.insertAdjacentHTML('beforeend', `
        <span class="ltitle"><b title="${esc(g.title)}">${esc(g.title)}</b><small>${c.short} · ${Case.year(g)}${g.format !== 'boxed' ? ` · ${FORMATS[g.format]}` : ''}</small>${g.format !== 'boxed' ? `<i class="kc">${FORMATS[g.format]}</i>` : ''}</span>
        <span class="lcon"><i class="kc" style="--fc:${FAMILIES.find(f => f.id === c.fam).color}">${c.short}</i></span>
        <span class="lyear" title="${esc(Case.date(g.released, true))}">${Case.year(g)}</span>
        <span class="lregion" title="${esc(REGIONS[g.region]?.long || g.region)}">${esc(g.region)}</span>
        <span class="lpub" title="${esc(g.publisher || '')}">${esc(g.publisher || '—')}</span>
        <span class="lgenre" title="${esc(g.genre || '')}">${esc(g.genre || '—')}</span>`);
      wrap.append(row);
    });
    host.replaceChildren(wrap);
  }

  /* ---------- the detail: drawer and spotlight ---------- */
  const Detail = (() => {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Game details');
    drawer.innerHTML = `<button class="drawer-close" type="button" aria-label="Close">✕</button><div class="drawer-cover"></div><div class="drawer-body"></div>`;
    document.body.append(overlay, drawer);
    overlay.addEventListener('click', () => close());
    $('.drawer-close', drawer).addEventListener('click', () => close());

    const REST = { box: [-6, -24], flat: [-4, -14] };
    let cur = null; // { g, source, piece, turn, obj, layer, L, rx, ry, open, closing, ... }

    const isOpen = () => !!cur && !cur.closing;
    const shape = g => g.format === 'cartridge-only' ? 'cart' : g.format === 'digital' ? 'card' : 'box';
    const fromPose = el => el && el.classList.contains('sp') ? [0, 90] : [0, 0];
    const rot = ([x, y]) => `rotateX(${x}deg) rotateY(${y}deg)`;

    /* What stands in the spotlight: the 3D case, a cartridge, or a digital copy's card. */
    function build(g, k) {
      const turn = document.createElement('div');
      turn.className = 'turn';
      const sh = shape(g);
      let obj;
      if (sh === 'box') obj = Case.box(g, k);
      else {
        obj = document.createElement('div');
        obj.className = 'flat';
        obj.append(sh === 'cart' ? Case.cart(g, k) : Case.front(g, k, false));
        if (sh === 'card') obj.insertAdjacentHTML('beforeend', '<span class="stamp">Digital copy</span>');
      }
      turn.append(obj);
      return { turn, obj, sh };
    }
    function sizeOf(g, k) {
      if (shape(g) === 'cart') return Case.cartSize(g, k);
      const L = Case.layout(g, k);
      return [L.w, L.h];
    }

    /* Where the spotlight stands: the page beside the drawer, the game in the middle, text above and below. */
    function layoutFor(g) {
      const lw = innerWidth - drawer.offsetWidth;
      const vh = innerHeight;
      if (lw < 520 || vh < 460) return null;
      const [w1, h1] = sizeOf(g, 1);
      const padX = clamp(lw * 0.07, 28, 96), margin = clamp(vh * 0.05, 20, 56);
      const availH = vh - margin * 2 - 2 * (110 + 24);
      if (availH < 150) return null;
      const k = Math.min((lw - padX * 2) / (w1 * 1.25), Math.min(availH, vh * 0.52) / h1, shape(g) === 'cart' ? 7 : 3.2);
      return { k, w: w1 * k, h: h1 * k, cx: lw / 2, cy: vh / 2 + 8, lw, padX, margin };
    }

    const infoAbove = g => {
      const c = CONSOLE_BY_ID[g.console];
      return `<p class="spot-eyebrow" style="--n:0"><span class="spot-art">${CONSOLE_ART[g.console] || ''}</span>${esc(c.name)} · ${esc(REGIONS[g.region]?.name || g.region)}</p><h2 style="--n:1">${esc(g.title)}</h2>`;
    };
    const infoBelow = g => `
      <p class="spot-who" style="--n:2">${[Case.date(g.released, true), g.publisher].filter(Boolean).map(esc).join(' · ')}</p>
      <p class="spot-rest" style="--n:3">${[g.genre, FORMATS[g.format], g.edition].filter(Boolean).map(esc).join(' · ')}</p>
      ${shape(g) === 'box' ? `<div class="views" style="--n:4">
        <button type="button" data-v="front">Front</button><button type="button" data-v="spine">Spine</button><button type="button" data-v="back">Back</button>
        <button type="button" class="open-btn" data-v="open">${Case.layout(g, 1).kind === 'box' ? 'Take it out' : 'Open case'}</button></div>` : ''}`;

    /* ---------- the drawer's text ---------- */
    function body(g) {
      const c = CONSOLE_BY_ID[g.console], st = CONSOLE_BY_ID[Case.styleOf(g)];
      const R = REGIONS[g.region] || { name: g.region, long: g.region };
      const Ln = g.launcher && LAUNCHERS[g.launcher];
      const i = games.indexOf(g);
      const q = encodeURIComponent(`${g.title} ${c.name} ${R.name} box art`);
      const tags = [R.name, g.format !== 'boxed' && FORMATS[g.format], g.edition, g.genre, Ln && (g.launcher === 'none' ? 'No activation needed' : 'Activates on ' + Ln.name)].filter(Boolean);
      return `
        <p class="d-eyebrow"><span class="spot-art">${CONSOLE_ART[g.console] || ''}</span>${esc(c.name)}${st !== c ? ` · ${esc(st.name)} case` : ''}</p>
        <h2>${esc(g.title)}</h2>
        <div class="artist">${[Case.year(g), g.publisher].filter(Boolean).map(esc).join(' · ')}</div>
        <div class="tags">${tags.map((t, n) => `<span class="tag${n ? '' : ' gold'}">${esc(t)}</span>`).join('')}</div>
        <dl class="facts">
          <dt>Released</dt><dd>${Case.date(g.released, true)}</dd>
          <dt>Region</dt><dd>${esc(R.long)}</dd>
          <dt>Publisher</dt><dd>${esc(g.publisher || '—')}</dd>
          <dt>Developer</dt><dd>${esc(g.developer || '—')}</dd>
          <dt>Genre</dt><dd>${esc(g.genre || '—')}</dd>
          <dt>Console</dt><dd>${esc(c.name)}</dd>
          <dt>Copy</dt><dd>${FORMATS[g.format]}</dd>
          ${g.listedAs ? `<dt>On my list as</dt><dd>${esc(g.listedAs)}</dd>` : ''}
        </dl>
        ${g.note ? `<p class="note">${esc(g.note)}</p>` : ''}
        ${g.cover
          ? `<p class="credit">Cover scan: ${esc(g.cover.source)}, ${esc(g.cover.ref)}</p>`
          : `<div class="find"><p>No cover scan for this one yet.</p><a href="https://www.google.com/search?tbm=isch&amp;q=${q}" target="_blank" rel="noopener">Find the cover on Google Images ↗</a></div>`}
        <div class="navbtns">
          <button type="button" data-step="-1" ${i <= 0 ? 'disabled' : ''}>← Previous</button>
          <button type="button" data-step="1" ${i < 0 || i >= games.length - 1 ? 'disabled' : ''}>Next →</button>
          <span>${i + 1} of ${games.length}</span>
        </div>`;
    }

    /* ---------- turning it round ---------- */
    function pose(animate) {
      if (!cur) return;
      cur.turn.style.transition = animate ? 'transform .8s cubic-bezier(.2,.8,.2,1)' : 'none';
      cur.turn.style.transform = rot([cur.rx, cur.ry]);
      const n = ((cur.ry % 360) + 360) % 360;
      const v = n > 45 && n < 135 ? 'spine' : n >= 135 && n < 225 ? 'back' : (n < 45 || n > 315) ? 'front' : '';
      $$('[data-v]', cur.viewsHost).forEach(b => b.classList.toggle('on', b.dataset.v === v));
    }
    function view(v) {
      if (!cur || cur.sh !== 'box') return;
      const bx = cur.obj, isBox = Case.layout(cur.g, 1).kind === 'box';
      if (v === 'open' || v === 'close') {
        cur.open = v === 'open';
        bx.classList.toggle('open', cur.open);
        if (cur.open) { cur.rx = -8; cur.ry = isBox ? -18 : 16; }
        $$('.open-btn', cur.viewsHost).forEach(b => b.textContent = cur.open ? (isBox ? 'Put it back' : 'Close case') : (isBox ? 'Take it out' : 'Open case'));
      } else {
        if (cur.open) view('close');
        cur.rx = -5;
        cur.ry = { front: -14, spine: 90, back: 180 }[v] + Math.round(cur.ry / 360) * 360;
      }
      pose(true);
    }
    // drag to turn, a tap opens the case
    function grab(el) {
      let drag = null;
      el.addEventListener('pointerdown', e => {
        if (!cur || cur.closing || e.target.closest('.views')) return;
        drag = { x: e.clientX, y: e.clientY, rx: cur.rx, ry: cur.ry, moved: false };
        el.setPointerCapture(e.pointerId);
        cur.flight?.finish?.();
      });
      el.addEventListener('pointermove', e => {
        if (!drag || !cur) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
        cur.ry = drag.ry + dx * 0.5;
        cur.rx = clamp(drag.rx - dy * 0.35, -60, 60);
        pose(false);
      });
      el.addEventListener('pointerup', () => {
        if (drag && !drag.moved && cur && cur.sh === 'box') view(cur.open ? 'close' : 'open');
        drag = null;
      });
    }
    drawer.addEventListener('click', e => {
      const v = e.target.closest('[data-v]');
      if (v) view(v.dataset.v);
      const s = e.target.closest('[data-step]');
      if (s) step(+s.dataset.step);
    });

    /* ---------- where a game is on the page ---------- */
    function poseOf(el) {
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height, seen: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0 };
    }
    // the element that shows this game now, on the shelf or in the list
    function homeOf(g) {
      if (cur && cur.source && cur.source.isConnected) return cur.source;
      const item = host.querySelector(`[data-id="${CSS.escape(g.id)}"]`);
      return item ? faceOf(item) : null;
    }
    // what the flight scales against: a spine is matched by height, anything else by width
    const scaleFrom = (el, p, w, h) => el.classList.contains('sp') ? p.h / h : Math.min(p.w / w, p.h / h);
    const piecePose = (L, cx, cy, s) => `translate(${(cx - L.w / 2).toFixed(1)}px,${(cy - L.h / 2).toFixed(1)}px) scale(${s.toFixed(4)})`;

    function hide(el) { if (el) { el.style.visibility = 'hidden'; cur.hidden.push(el); } }
    function unhide(a) { a.hidden.forEach(el => { el.style.visibility = ''; }); a.hidden = []; }

    /* ---------- opening ---------- */
    function open(g, source, fromHash) {
      if (!g) return;
      if (cur) finish(cur);
      tipEl.classList.remove('vis');
      $('.drawer-body', drawer).innerHTML = body(g);
      $('.drawer-cover', drawer).innerHTML = '';
      drawer.scrollTop = 0;
      overlay.classList.add('open');
      drawer.classList.add('open');
      document.body.classList.add('detail-open');
      if (!fromHash) setHash(g.id, true);

      const L = layoutFor(g);
      const a = cur = { g, source: source || null, L, rx: 0, ry: 0, open: false, closing: false, hidden: [], raf: 0, timer: 0 };
      if (L) spotlight(a); else inDrawer(a);
      setTimeout(() => $('.drawer-close', drawer).focus({ preventScroll: true }), 50);
    }

    // On a narrow screen the drawer has the whole width: the case sits at its top.
    function inDrawer(a) {
      document.body.classList.remove('spot-on');
      drawer.classList.remove('spot-on');
      const cover = $('.drawer-cover', drawer);
      const w = Math.min(drawer.clientWidth || innerWidth, 440);
      const [w1, h1] = sizeOf(a.g, 1);
      const k = Math.min((w - 90) / w1, 250 / h1, shape(a.g) === 'cart' ? 6 : 3);
      const { turn, obj, sh } = build(a.g, k);
      Object.assign(a, { turn, obj, sh, viewsHost: cover });
      const stage = document.createElement('div');
      stage.className = 'dstage';
      stage.append(turn);
      cover.append(stage);
      cover.insertAdjacentHTML('beforeend', sh === 'box' ? infoBelow(a.g).replace(/<p[\s\S]*?<\/p>/g, '') : '');
      grab(stage);
      [a.rx, a.ry] = REST[sh === 'box' ? 'box' : 'flat'];
      pose(false);
      if (!reduced()) turn.animate([{ transform: rot([a.rx, a.ry - 40]), opacity: 0 }, { transform: rot([a.rx, a.ry]), opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.2,.8,.25,1)' });
    }

    // Beside the drawer: the game lifts off the page and flies over, growing as it goes.
    function spotlight(a) {
      const { g, L } = a;
      const layer = document.createElement('div');
      layer.className = 'spot';
      layer.innerHTML = `<div class="spot-floor"></div><div class="spot-info above">${infoAbove(g)}</div><div class="spot-info below">${infoBelow(g)}</div>`;
      const piece = document.createElement('div');
      piece.className = 'spot-piece';
      const { turn, obj, sh } = build(g, L.k);
      piece.append(turn);
      layer.append(piece);
      drawer.before(layer);
      Object.assign(a, { layer, piece, turn, obj, sh, viewsHost: layer });
      layer.addEventListener('click', e => { const v = e.target.closest('[data-v]'); if (v) view(v.dataset.v); });
      grab(piece);
      place(a);
      document.body.classList.add('spot-on');
      drawer.classList.add('spot-on');
      document.body.style.setProperty('--spot-x', L.cx.toFixed(0) + 'px');
      document.body.style.setProperty('--spot-y', L.cy.toFixed(0) + 'px');

      const restPose = REST[sh === 'box' ? 'box' : 'flat'];
      [a.rx, a.ry] = restPose;
      const rest = piecePose(L, L.cx, L.cy, 1);
      piece.style.transform = rest;
      pose(false);

      const src = a.source && a.source.isConnected ? a.source : null;
      const from = src ? poseOf(src) : null;
      if (reduced()) { hide(src); return; }
      if (from && from.seen) {
        hide(src);
        const s0 = scaleFrom(src, from, L.w, L.h);
        const dist = Math.hypot(from.cx - L.cx, from.cy - L.cy);
        const lift = 50 + Math.min(110, dist * 0.12);
        const duration = 820 + Math.min(320, dist * 0.25);
        a.flight = piece.animate([
          { transform: piecePose(L, from.cx, from.cy, s0) },
          { transform: piecePose(L, (from.cx + L.cx) / 2, (from.cy + L.cy) / 2 - lift, (s0 + 1) / 2), offset: 0.45 },
          { transform: rest },
        ], { duration, easing: 'cubic-bezier(.3,.05,.2,1)', fill: 'backwards' });
        turn.animate([{ transform: rot(fromPose(src)) }, { transform: rot(restPose) }], { duration: duration * 0.9, easing: 'cubic-bezier(.4,.1,.2,1)', fill: 'backwards' });
      } else {
        a.flight = piece.animate([
          { transform: piecePose(L, L.cx, L.cy + 70, 0.94), opacity: 0 },
          { transform: rest, opacity: 1 },
        ], { duration: 700, easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'backwards' });
      }
    }

    // the text above and below, kept on the page: the game shrinks if the text needs the room
    function place(a) {
      const { L, layer } = a;
      const above = $('.spot-info.above', layer), below = $('.spot-info.below', layer);
      const width = Math.min(Math.max(L.w * 1.6, 360), L.lw - L.padX * 2);
      for (const info of [above, below]) {
        info.style.left = (L.cx - width / 2).toFixed(1) + 'px';
        info.style.width = width.toFixed(1) + 'px';
      }
      const room = innerHeight / 2 - L.margin - 24 - Math.max(above.offsetHeight, below.offsetHeight);
      if (L.h / 2 > room && room > 60) {
        const f = (room * 2) / L.h;
        Object.assign(L, { k: L.k * f, w: L.w * f, h: L.h * f });
        const { turn, obj, sh } = build(a.g, L.k);
        a.piece.replaceChildren(turn);
        Object.assign(a, { turn, obj, sh });
      }
      a.piece.style.width = L.w.toFixed(1) + 'px';
      a.piece.style.height = L.h.toFixed(1) + 'px';
      above.style.bottom = (innerHeight - (L.cy - L.h / 2) + 24).toFixed(1) + 'px';
      below.style.top = (L.cy + L.h / 2 + 28).toFixed(1) + 'px';
      const floor = $('.spot-floor', layer);
      floor.style.left = (L.cx - L.w * 0.7).toFixed(1) + 'px';
      floor.style.width = (L.w * 1.4).toFixed(1) + 'px';
      floor.style.top = (L.cy + L.h / 2 - 12).toFixed(1) + 'px';
    }

    /* ---------- closing: back to where it came from ---------- */
    function close(fromHash) {
      const a = cur;
      if (!a || a.closing) return;
      a.closing = true;
      overlay.classList.remove('open');
      drawer.classList.remove('open');
      document.body.classList.remove('detail-open');
      if (!fromHash) setHash(state.sel.size === 1 ? [...state.sel][0] : '', false, a.g.id);
      const focusTo = homeOf(a.g);
      if (!a.layer || reduced()) { finish(a); focusTo?.closest('[data-id]')?.focus({ preventScroll: true }); return; }

      a.layer.classList.add('leaving');
      a.obj.classList.remove('open');
      const home = homeOf(a.g);
      const to = home ? poseOf(home) : null;
      const L = a.L;
      // where it is right now, which is not its resting place if it was still flying in
      let from = { cx: L.cx, cy: L.cy, s: 1 };
      if (a.flight && a.flight.playState === 'running') {
        const m = new DOMMatrix(getComputedStyle(a.piece).transform);
        from = { cx: m.e + L.w / 2, cy: m.f + L.h / 2, s: Math.hypot(m.a, m.b) };
      }
      a.piece.getAnimations().forEach(x => x.cancel());
      a.turn.getAnimations().forEach(x => x.cancel());

      if (!to || !to.seen) {
        // nowhere to go (scrolled away or filtered out): it sinks and fades
        a.flight = a.piece.animate([
          { transform: piecePose(L, from.cx, from.cy, from.s), opacity: 1 },
          { transform: piecePose(L, L.cx, L.cy + 50, 0.94), opacity: 0 },
        ], { duration: 450, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
        a.flight.finished.then(() => finish(a), () => {});
        a.timer = setTimeout(() => finish(a), 700);
        return;
      }

      if (home !== a.source) { unhide(a); cur = a; hide(home); }
      const dist = Math.hypot(to.cx - from.cx, to.cy - from.cy);
      const lift = 40 + Math.min(100, dist * 0.1);
      const duration = 760 + Math.min(300, dist * 0.22);
      a.turn.style.transition = `transform ${duration * 0.85}ms cubic-bezier(.4,0,.2,1)`;
      a.turn.style.transform = rot(fromPose(home));
      const t0 = performance.now();
      let goal = to;
      // every frame aims at where the game is now, since the page can scroll meanwhile
      const frame = now => {
        if (a.done) return;
        const t = clamp((now - t0) / duration, 0, 1), u = easeInOut(t);
        if (home.isConnected) goal = poseOf(home);
        const s1 = scaleFrom(home, goal, L.w, L.h);
        a.piece.style.transform = piecePose(L, lerp(from.cx, goal.cx, u), lerp(from.cy, goal.cy, u) - lift * Math.sin(Math.PI * u), lerp(from.s, s1, u));
        if (t < 1) a.raf = requestAnimationFrame(frame); else finish(a);
      };
      a.raf = requestAnimationFrame(frame);
      a.timer = setTimeout(() => finish(a), duration + 400);
      setTimeout(() => focusTo?.closest('[data-id]')?.focus({ preventScroll: true }), 30);
    }

    function finish(a) {
      if (!a || a.done) return;
      a.done = true;
      clearTimeout(a.timer);
      cancelAnimationFrame(a.raf);
      a.layer?.remove();
      unhide(a);
      if (cur === a) {
        cur = null;
        document.body.classList.remove('spot-on');
        drawer.classList.remove('spot-on');
        if (!drawer.classList.contains('open')) $('.drawer-cover', drawer).innerHTML = '';
      }
    }

    // the next or previous game, without leaving the drawer
    function step(n) {
      if (!cur || cur.closing) return;
      const g = games[games.indexOf(cur.g) + n];
      if (!g) return;
      const prev = cur;
      prev.done = true;
      clearTimeout(prev.timer);
      cancelAnimationFrame(prev.raf);
      unhide(prev);
      prev.layer?.remove();
      cur = null;
      $('.drawer-body', drawer).innerHTML = body(g);
      $('.drawer-cover', drawer).innerHTML = '';
      setHash(g.id, false);
      const L = layoutFor(g);
      const item = host.querySelector(`[data-id="${CSS.escape(g.id)}"]`);
      const a = cur = { g, source: item ? faceOf(item) : null, L, rx: 0, ry: 0, open: false, closing: false, hidden: [], raf: 0, timer: 0 };
      if (L) {
        spotlight(Object.assign(a, { source: null }));
        a.source = item ? faceOf(item) : null;
        hide(a.source);
      } else inDrawer(a);
    }

    // the page was drawn again: the game in the spotlight goes home to its new element
    function rehome() {
      if (!cur || cur.closing) return;
      unhide(cur);
      const item = host.querySelector(`[data-id="${CSS.escape(cur.g.id)}"]`);
      cur.source = item ? faceOf(item) : null;
      if (cur.layer) hide(cur.source);
    }

    let rt = 0;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { if (cur && !cur.closing) { const g = cur.g, src = cur.source; finish(cur); open(g, null, true); if (cur) { cur.source = src; if (cur.layer) hide(src); } } }, 200);
    });
    document.addEventListener('keydown', e => {
      if (!isOpen() || e.target.matches('input, select, textarea')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });

    return { open, close, isOpen, rehome, current: () => cur && cur.g };
  })();

  /* ---------- the address: #ps2 for a console, #ps2-final-fantasy-x for a game ---------- */
  // Opening a game adds a step to the history, so Back closes it again.
  function setHash(h, push, closing) {
    try {
      const url = h ? '#' + h : location.pathname + location.search;
      const st = byId.has(h) ? { game: h } : null;
      if (push) history.pushState(st, '', url);
      else if (closing && history.state && history.state.game) history.back();
      else if (location.hash !== (h ? '#' + h : '')) history.replaceState(st, '', url);
    } catch (e) { /* some viewers refuse it */ }
  }
  addEventListener('popstate', () => {
    const h = location.hash.slice(1);
    if (byId.has(h)) { if (Detail.current()?.id !== h) Detail.open(byId.get(h), null, true); }
    else if (Detail.isOpen()) Detail.close(true);
  });

  /* ---------- start ---------- */
  fetch('data/games.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(db => {
      ALL = db.games;
      ALL.forEach(g => {
        byId.set(g.id, g);
        g._hay = fold([g.title, g.listedAs, g.publisher, g.developer, g.genre, g.released, g.region, CONSOLE_BY_ID[g.console].name, CONSOLE_BY_ID[g.console].short, g.note, g.edition].join(' | '));
      });
      shell();
      const h = location.hash.slice(1);
      if (CONSOLE_BY_ID[h]) state.sel = new Set([h]);
      games = list();
      sync();
      render(true);
      if (byId.has(h)) {
        const g = byId.get(h);
        if (!games.includes(g)) { state.sel = new Set(); games = list(); sync(); render(false); }
        setTimeout(() => Detail.open(g, null, true), 300);
      }
      let lw = innerWidth, rt;
      addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (innerWidth !== lw) { lw = innerWidth; render(false); } }, 150); });
    })
    .catch(err => {
      console.error(err);
      host.innerHTML = `<div class="empty-msg"><b>The shelf couldn't load</b>data/games.json didn't load. Open the site through a web server (for example <code>npx serve</code>) rather than as a file.</div>`;
    });
})();
