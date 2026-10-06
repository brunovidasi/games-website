/* app.js — the game shelf. Loads data/games.json and shows it on a bookcase, in a
   grid or in a list. Going between the shelf and the grid carries every case across:
   it comes off the shelf and turns to show its cover on the way, as the record site
   carries its records between the floor and the grid. A game picked from anywhere
   lifts off the page and flies to the middle, where it can be turned round and
   opened; closing flies it back into its place.

   A collection page (sims.html, gta.html) sets window.SHELF_PAGE before this script
   to show only its games, grouped by game rather than by console, with its own
   header and a fourth view, its checklist:
     id          names what the page remembers in this browser
     data        more JSON files to load besides data/games.json
     games(db, …data)   the games on this page
     group(g)    { key, label, name, order } — the game a copy belongs to
     groupNoun   what a group is called ("game")
     hero(games) the header's HTML
     checklist(el, games)   draws the checklist view into el */

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
  const CFG = window.SHELF_PAGE || null;

  /* ---------- remembered choices (this browser only), each page its own ---------- */
  const KEY = CFG ? `games.${CFG.id}.` : 'games.';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(KEY + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } },
  };

  /* ---------- groups: the shelf stands its games by console, or on a collection page by game ---------- */
  const GROUP = CFG ? 'group' : 'console';
  const groupOf = CFG ? CFG.group : g => {
    const c = CONSOLE_BY_ID[g.console];
    return { key: g.console, label: c.short, name: c.name, order: ORDER[g.console], art: CONSOLE_ART[g.console] };
  };

  /* ---------- sorting: the menu and the list's headers set the same sort ---------- */
  const SORT_BY = {
    title:     { label: 'Title',     value: g => g.title },
    console:   { label: 'Console',   value: g => String(ORDER[g.console]).padStart(2, '0'), plain: true },
    released:  { label: 'Released',  value: g => g.released || '', plain: true },
    region:    { label: 'Region',    value: g => g.region },
    publisher: { label: 'Publisher', value: g => g.publisher || '' },
    genre:     { label: 'Genre',     value: g => g.genre || '' },
    // a collection page's games, each in the order its copies came out
    group:     { label: 'Game',      value: g => String(groupOf(g).order).padStart(3, '0') + (g.released || '9999'), plain: true },
  };
  const MENU = {
    console: { key: GROUP, dir: 'asc', label: CFG ? `By ${CFG.groupNoun}` : 'By console' },
    title: { key: 'title', dir: 'asc', label: 'Title A–Z' },
    newest: { key: 'released', dir: 'desc', label: 'Newest release first' },
    oldest: { key: 'released', dir: 'asc', label: 'Oldest release first' },
  };
  const validSort = s => s && SORT_BY[s.key] && (s.key !== 'group' || CFG) && (s.dir === 'asc' || s.dir === 'desc') ? { key: s.key, dir: s.dir } : { key: GROUP, dir: 'asc' };
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

  const VIEWS = ['shelf', 'rows', 'grid', 'list', ...(CFG && CFG.checklist ? ['checklist'] : [])];
  const flat = v => v === 'list' || v === 'checklist'; // views with no cases to carry across
  const state = {
    view: VIEWS.includes(store.get('view')) ? store.get('view') : 'shelf',
    mode: ['mixed', 'spines', 'covers'].includes(store.get('mode')) ? store.get('mode') : 'mixed',
    sort: validSort(store.get('sort')),
    sel: new Set(), q: '', covers: '',
  };
  let ALL = [], games = [];
  const byId = new Map();

  /* ---------- filtering ---------- */
  const fold = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  function base() {
    const words = fold(state.q).split(/\s+/).filter(Boolean);
    return ALL.filter(g =>
      (!state.covers || (state.covers === 'with') === !!g.cover) &&
      (!words.length || words.every(w => g._hay.includes(w))));
  }
  const list = () => sortList(base().filter(g => !state.sel.size || state.sel.has(g.console)), state.sort);

  /* ---------- the header and controls ---------- */
  function shell() {
    const consoles = CONSOLES.filter(c => !c.hidden && ALL.some(g => g.console === c.id));
    const years = ALL.map(g => g.released).filter(Boolean).map(r => +r.slice(0, 4));
    $('#shell').innerHTML = `
      ${CFG ? CFG.hero(ALL) : `<header class="hero">
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
      </header>`}
      <div class="filters"><div class="filters-in">
        <div class="consoles" role="toolbar" aria-label="Filter by console">
          <button class="chip all" data-all><span class="lab"><b>All</b><i data-n="all"></i></span></button>
          <div class="cscroll">${FAMILIES.filter(f => consoles.some(c => c.fam === f.id)).map(f => `<div class="fam" style="--fc:${f.color}">
            <button class="famname" data-fam="${f.id}">${f.name}</button>
            <div class="row">${consoles.filter(c => c.fam === f.id).map(c => `
              <button class="chip" data-c="${c.id}" title="${c.name}" aria-pressed="false">
                ${CONSOLE_ART[c.id] || ''}
                <span class="lab"><b>${c.short}</b><i data-n="${c.id}"></i></span>
              </button>`).join('')}</div></div>`).join('')}</div>
        </div>
        <div class="subbar">
          <label class="search"><span aria-hidden="true">⌕</span><input id="q" type="search" placeholder="${innerWidth < 640 ? 'Search…' : 'Search title, publisher, year…'}" aria-label="Search games"></label>
          <select class="sort" id="sort" aria-label="Sort">
            ${Object.entries(MENU).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join('')}
            <option value="custom" hidden></option>
          </select>
          <div class="seg" id="view" role="group" aria-label="View">
            <button type="button" data-view="shelf">Shelf</button>
            <button type="button" data-view="rows">Rows</button>
            <button type="button" data-view="grid">Grid</button>
            <button type="button" data-view="list">List</button>
            ${VIEWS.includes('checklist') ? '<button type="button" data-view="checklist">Checklist</button>' : ''}
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
    // the consoles scroll sideways beside "All", and fade out at an edge that has more past it
    const cs = $('.cscroll');
    const edges = () => {
      cs.classList.toggle('more-l', cs.scrollLeft > 2);
      cs.classList.toggle('more-r', cs.scrollLeft + cs.clientWidth < cs.scrollWidth - 2);
    };
    cs.addEventListener('scroll', edges, { passive: true });
    addEventListener('resize', edges);
    edges();
    let t;
    $('#q').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; changed(); }, 120); });
    $('#sort').addEventListener('change', e => { if (MENU[e.target.value]) setSort(MENU[e.target.value]); });
    $$('#view button').forEach(b => b.addEventListener('click', () => {
      if (state.view === b.dataset.view) return;
      // the shelf, the rows and the grid are the same cases laid out three ways, so they are carried across
      const before = Morph.capture();
      state.view = b.dataset.view;
      store.set('view', state.view);
      sync();
      render(!before);
      Morph.play(before);
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
    $$('#view button').forEach(x => x.classList.toggle('on', x.dataset.view === state.view));
    $$('#mode button').forEach(x => x.classList.toggle('on', x.dataset.m === state.mode));
    $('#modeWrap').hidden = state.view !== 'shelf' && state.view !== 'rows';
    document.body.dataset.view = state.view;
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
    tipEl.innerHTML = `<b>${esc(g.title)}</b><span>${CONSOLE_BY_ID[g.console].short}${g.platinum ? ' Platinum' : ''} · ${Case.year(g)} · ${esc(REGIONS[g.region]?.name || g.region)}${g.format !== 'boxed' ? ' · ' + FORMATS[g.format] : ''}</span>`;
    tipEl.classList.add('vis');
  });
  host.addEventListener('pointerout', e => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-id]')) tipEl.classList.remove('vis'); });
  addEventListener('pointermove', e => {
    if (!tipEl.classList.contains('vis')) return;
    const x = Math.min(e.clientX + 14, innerWidth - tipEl.offsetWidth - 8);
    const y = e.clientY + 18 + tipEl.offsetHeight > innerHeight ? e.clientY - tipEl.offsetHeight - 12 : e.clientY + 18;
    tipEl.style.transform = `translate(${x}px,${y}px)`;
  });

  // a click anywhere on a game, on the shelf, in the grid or in the list, picks it up
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
  // a case on a collection page's checklist opens here too, rather than on the shelf it links to
  document.addEventListener('click', e => {
    const item = state.view === 'checklist' && e.target.closest('#checklist [data-id]');
    if (!item || e.metaKey || e.ctrlKey || e.shiftKey || !byId.has(item.dataset.id)) return;
    e.preventDefault();
    Detail.open(byId.get(item.dataset.id), faceOf(item));
  });

  // the part of a shelf item, grid cell or list row that is the game itself
  const faceOf = item => item.querySelector('.lcase > *, .gt > *') || item.firstElementChild;

  function render(animate) {
    tipEl.classList.remove('vis');
    Morph.stop();
    host.classList.toggle('bookcase', state.view === 'shelf');
    host.classList.toggle('gridview', state.view === 'grid');
    host.classList.toggle('listview', state.view === 'list');
    host.classList.toggle('rowsview', state.view === 'rows');
    if (state.view === 'checklist') { CFG.checklist($('#checklist'), ALL); Detail.rehome(); return; }
    if (!games.length) {
      host.innerHTML = `<div class="empty-msg"><b>Nothing on this shelf</b>No games match those filters. Try another console or clear the search.</div>`;
      return;
    }
    if (state.view === 'list') renderList(); else if (state.view === 'grid') renderGrid(animate); else if (state.view === 'rows') renderRows(animate); else renderShelf(animate);
    Detail.rehome();
  }

  /* ---------- the bookcase ---------- */
  const scale = () => innerWidth < 640 ? 0.78 : innerWidth < 1000 ? 0.95 : 1.12;
  // a loose cartridge stands facing out, or, on a console whose cartridges stand sideways (the SNES), on its
  // side with its top label out like a book's spine, all but the one that faces out ("All covers" faces them all out)
  const looseKind = (g, lead) => CONSOLE_BY_ID[g.console].stack && state.mode !== 'covers' && !lead.has(g.id) ? 'stack' : 'loose';
  function shelfItem(g, kind, animate, n) {
    const btn = document.createElement('button');
    btn.className = `item ${kind}` + (animate ? ' enter' : '');
    btn.dataset.id = g.id;
    btn.style.animationDelay = Math.min(n * 6, 900) + 'ms';
    btn.setAttribute('aria-label', `${g.title}, ${CONSOLE_BY_ID[g.console].name}, ${Case.year(g)}`);
    return btn;
  }

  // In "one cover per console" (or game), one per console faces out: a favourite if marked, else the newest with a cover.
  function leaders() {
    const out = new Set(), by = {};
    games.forEach(g => (by[groupOf(g).key] = by[groupOf(g).key] || []).push(g));
    for (const gs of Object.values(by)) {
      // a console whose games are all loose cartridges (the SNES) faces one of those out
      let pool = gs.filter(g => g.format === 'boxed');
      if (!pool.length) pool = gs.filter(g => g.format === 'cartridge-only' && CONSOLE_BY_ID[g.console].stack);
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
    const kindOf = g => g.format === 'cartridge-only' ? looseKind(g, lead) : g.format === 'digital' ? 'spine' : (state.mode === 'covers' || lead.has(g.id)) ? 'face' : 'spine';
    const tallest = Math.max(...games.map(g => { const k = kindOf(g); return k === 'loose' ? Case.cartSize(g, s * 1.6)[1] : k === 'stack' ? Case.topSize(g, s * 1.6, true)[1] : Case.layout(g, s).h; }));
    host.style.setProperty('--bay', (tallest + 34) + 'px');

    // left to right, a new shelf when one is full
    const rows = [[]];
    let x = 0, last = null;
    const grouped = state.sort.key === GROUP;
    games.forEach(g => {
      const kind = kindOf(g), L = Case.layout(g, s);
      const newGroup = grouped && groupOf(g).key !== last;
      const w = (kind === 'face' ? L.w + 12 : kind === 'loose' ? Case.cartSize(g, s * 1.6)[0] + 16 : kind === 'stack' ? Case.topSize(g, s * 1.6, true)[0] : L.d) + 2 + (newGroup && last ? 30 : 0);
      if (x + w > inner && rows[rows.length - 1].length) { rows.push([]); x = 0; }
      const row = rows[rows.length - 1];
      if (newGroup && last && row.length) row.push({ end: true });
      row.push({ g, kind, label: grouped && (newGroup || !row.some(r => r.g)) });
      x += w;
      last = groupOf(g).key;
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
        const btn = shelfItem(g, kind, animate, n++);
        btn.append(kind === 'face' ? Case.front(g, s) : kind === 'loose' ? Case.cart(g, s * 1.6) : kind === 'stack' ? Case.top(g, s * 1.6, true) : Case.spine(g, s));
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
      // in the colour of the console's family, as in the filter: red Nintendo, blue PlayStation, green Xbox
      const fam = CONSOLE_BY_ID[groupOf(g).key] && FAMILIES.find(f => f.id === CONSOLE_BY_ID[groupOf(g).key].fam);
      if (fam) p.style.setProperty('--pc', fam.color);
      p.textContent = groupOf(g).label;
      p.title = groupOf(g).name;
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
        <span class="ltitle"><b title="${esc(g.title)}">${esc(g.title)}</b><small>${c.short}${g.platinum ? ' Platinum' : ''} · ${Case.year(g)}${g.format !== 'boxed' ? ` · ${FORMATS[g.format]}` : ''}</small>${g.format !== 'boxed' ? `<i class="kc">${FORMATS[g.format]}</i>` : ''}${g.platinum ? '<i class="kc plat-tag">Platinum</i>' : ''}</span>
        <span class="lcon"><i class="kc" style="--fc:${FAMILIES.find(f => f.id === c.fam).color}">${c.short}</i></span>
        <span class="lyear" title="${esc(Case.date(g.released, true))}">${Case.year(g)}</span>
        <span class="lregion" title="${esc(REGIONS[g.region]?.long || g.region)}">${esc(g.region)}</span>
        <span class="lpub" title="${esc(g.publisher || '')}">${esc(g.publisher || '—')}</span>
        <span class="lgenre" title="${esc(g.genre || '')}">${esc(g.genre || '—')}</span>`);
      wrap.append(row);
    });
    host.replaceChildren(wrap);
  }

  /* ---------- a game standing face out with its name under it: in the grid and in the rows ----------
     It stands at scale s, no wider than room and no taller than the stage. */
  function cellOf(g, s, room, stage, animate, delay) {
    const c = CONSOLE_BY_ID[g.console];
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell' + (animate ? ' enter' : '');
    cell.dataset.id = g.id;
    cell.style.setProperty('--d', delay + 'ms');
    cell.setAttribute('aria-label', `${g.title}, ${c.name}, ${Case.year(g)}`);
    const tile = document.createElement('span');
    tile.className = 'gt';
    let w;
    if (g.format === 'cartridge-only') {
      const [w1, h1] = Case.cartSize(g, 1);
      const k = Math.min(s * 2, room / w1, (stage * 0.8) / h1);
      tile.append(Case.cart(g, k));
      w = w1 * k;
    } else {
      const L = Case.layout(g, 1);
      const k = Math.min(s, room / L.w, stage / L.h);
      const face = Case.front(g, k);
      if (g.format === 'digital') face.classList.add('ghosted');
      tile.append(face);
      w = L.w * k;
    }
    cell.style.setProperty('--tw', w.toFixed(1) + 'px');
    const st = document.createElement('span');
    st.className = 'stage';
    st.append(tile);
    cell.append(st);
    cell.insertAdjacentHTML('beforeend', `<span class="cap"><b>${esc(g.title)}</b><small>${c.short}${g.platinum ? ' Platinum' : ''} · ${Case.year(g)} · ${esc(g.region)}${g.format !== 'boxed' ? ` · ${FORMATS[g.format]}` : ''}</small></span>`);
    return cell;
  }
  const groupHead = (gr, n) => `<div class="ghead">${gr.art ? `<span class="spot-art">${gr.art}</span>` : ''}<b>${esc(gr.name)}</b><i>${n} ${n === 1 ? 'copy' : CFG ? 'copies' : 'games'}</i></div>`;

  /* ---------- the grid: every game standing face out on one baseline ---------- */
  // A DVD case stands the full height of the stage and the rest keep their real size beside it,
  // so a DS case is shorter and a Switch case narrower. Loose cartridges stand twice their size.
  const gridSize = () => innerWidth < 640 ? { cell: 100, stage: 136, gap: 12 } : innerWidth < 1000 ? { cell: 132, stage: 172, gap: 20 } : { cell: 148, stage: 196, gap: 26 };
  function renderGrid(animate) {
    const G = gridSize();
    const width = host.clientWidth;
    const cols = Math.max(1, Math.floor((width + G.gap) / (G.cell + G.gap)));
    const room = (width - G.gap * (cols - 1)) / cols - 6;
    const s = G.stage / 190;
    const wrap = document.createElement('div');
    wrap.className = 'grid';
    wrap.style.cssText = `--cell:${G.cell}px;--stage:${G.stage}px;--gap:${G.gap}px`;
    const grouped = state.sort.key === GROUP;
    const counts = {};
    games.forEach(g => counts[groupOf(g).key] = (counts[groupOf(g).key] || 0) + 1);
    let last = null, n = 0;
    games.forEach(g => {
      const gr = groupOf(g);
      if (grouped && gr.key !== last) {
        wrap.insertAdjacentHTML('beforeend', groupHead(gr, counts[gr.key]));
      }
      last = gr.key;
      wrap.append(cellOf(g, s, room, G.stage, animate, Math.min(n++ * 12, 700)));
    });
    host.replaceChildren(wrap);
  }

  /* ---------- the rows: each console (or game) on a row of its own that scrolls sideways ----------
     The cases stand as on the shelf, their spines out (with "Show" as on the shelf), but taller,
     and each spine much wider than a real one, so it is easy to tap on a phone. A swipe moves
     along the row. Sorted any way but by console, the games stand on one long row in that order. */
  const rowSize = () => innerWidth < 640 ? { stage: 230, spine: 46 } : innerWidth < 1000 ? { stage: 250, spine: 44 } : { stage: 270, spine: 42 };
  function renderRows(animate) {
    const R = rowSize();
    const s = R.stage / 190;
    const lead = state.mode === 'mixed' ? leaders() : new Set();
    const kindOf = g => g.format === 'cartridge-only' ? looseKind(g, lead) : g.format === 'digital' ? 'spine' : (state.mode === 'covers' || lead.has(g.id)) ? 'face' : 'spine';
    const wrap = document.createElement('div');
    wrap.className = 'rows';
    const grouped = state.sort.key === GROUP;
    const runs = [];
    games.forEach(g => {
      const gr = grouped ? groupOf(g) : null, last = runs[runs.length - 1];
      if (last && (!grouped || last.gr.key === gr.key)) last.games.push(g);
      else runs.push({ gr, games: [g] });
    });
    let n = 0;
    runs.forEach(({ gr, games: gs }) => {
      const sec = document.createElement('section');
      sec.className = 'rgrp';
      if (gr) sec.innerHTML = groupHead(gr, gs.length);
      const track = document.createElement('div');
      track.className = 'rtrack';
      gs.forEach((g, i) => {
        const kind = kindOf(g);
        const btn = document.createElement('button');
        btn.type = 'button';
        // only the first cases on each row rise in; the rest are off to the side
        btn.className = `item ${kind}` + (animate && i < 14 ? ' enter' : '');
        btn.dataset.id = g.id;
        btn.style.animationDelay = Math.min(n++ * 8, 500) + 'ms';
        btn.setAttribute('aria-label', `${g.title}, ${CONSOLE_BY_ID[g.console].name}, ${Case.year(g)}`);
        const tile = document.createElement('span');
        tile.className = 'gt';
        if (kind === 'loose') tile.append(Case.cart(g, s * 1.6));
        else if (kind === 'stack') tile.append(Case.top(g, Math.min(s * 1.6, R.stage * 1.15 / Case.topSize(g, 1, true)[1]), true));
        else if (kind === 'face') tile.append(Case.front(g, Math.min(s, (R.stage * 1.1) / Case.layout(g, 1).w)));
        else {
          const sp = Case.spine(g, s);
          sp.style.setProperty('--d', R.spine + 'px');
          tile.append(sp);
        }
        btn.append(tile);
        track.append(btn);
      });
      sec.append(track);
      wrap.append(sec);
    });
    host.replaceChildren(wrap);
  }

  /* ---------- shelf ⇄ grid: every case on screen is carried across ----------
     As the record site carries its records between the floor and the grid, each
     game on screen travels in an arc from where one view had it to where the other
     stands it. Coming off the shelf a case turns from its spine to its cover on the
     way; going back it turns to its spine again. */
  const Morph = (() => {
    const MAX = 72; // cases that travel; any more simply fade in
    let run = null;
    const onScreen = r => r.bottom > -40 && r.top < innerHeight + 40 && r.right > -40 && r.left < innerWidth + 40;
    const kindOf = el => el.classList.contains('sp') ? 'spine' : el.classList.contains('cart') ? 'cart' : el.classList.contains('cside') ? 'side' : 'front';
    // a spine's width and the size of its lettering, as drawn (the rows draw them wider than real ones)
    const spineOf = el => el.classList.contains('sp') ? { sw: el.offsetWidth, sf: parseFloat(getComputedStyle(el).fontSize) } : {};
    // a cartridge facing out or standing on its side: either way it flies as the one solid cartridge
    const cartish = k => k === 'cart' || k === 'side';
    // how big a cartridge is drawn, in px per mm: on its side its height is the cartridge's width
    const unitOf = (face, kind, g) => face.offsetHeight / Case.cartSize(g, 1)[kind === 'side' ? 0 : 1];
    // how it is turned: on its side with the top label out, leaning on the shelf, or straight
    // (on its side it is pushed back by half its height, so its top label sits where the shelf showed it, not nearer)
    const cartTurn = (kind, view, back) => kind === 'side' ? `translateZ(${-back}px) rotateY(-90deg) rotateZ(90deg)` : `translateZ(0px) rotateY(0deg) rotateZ(${view === 'shelf' ? -6 : 0}deg)`;
    // the part of the page that waits while its case is in the air
    const spotOf = (item, face) => face.closest('.gt') || item;

    /** Where every game on screen is now. Called just before the view is drawn again. */
    function capture() {
      if (flat(state.view) || reduced()) return null;
      const spots = new Map();
      for (const item of host.querySelectorAll('[data-id]')) {
        const face = faceOf(item), kind = kindOf(face);
        const r = face.getBoundingClientRect();
        if (onScreen(r)) spots.set(item.dataset.id, { cx: r.left + r.width / 2, cy: r.top + r.height / 2, h: face.offsetHeight, kind, u: cartish(kind) ? unitOf(face, kind, byId.get(item.dataset.id)) : 0, ...spineOf(face) });
      }
      return { view: state.view, spots };
    }

    function stop() {
      if (!run) return;
      clearTimeout(run.timer);
      run.layer.remove();
      run.hidden.forEach(el => { el.style.visibility = ''; });
      host.querySelector('.grid')?.classList.remove('morphing');
      run = null;
    }

    /** Sets the games of the view just drawn travelling from where `snap` had them. */
    function play(snap) {
      if (!snap || snap.view === state.view || flat(state.view) || reduced()) return;
      stop();
      const layer = document.createElement('div');
      layer.className = 'morph';
      document.body.append(layer);
      const hidden = [];

      // every read first, so the page is laid out once rather than once per case
      const arrivals = [];
      for (const item of host.querySelectorAll('[data-id]')) {
        const face = faceOf(item);
        const r = face.getBoundingClientRect();
        if (onScreen(r)) arrivals.push({ item, face, r, from: snap.spots.get(item.dataset.id), kind: kindOf(face) });
      }
      arrivals.sort((a, b) => (a.r.top - b.r.top) || (a.r.left - b.r.left));
      const flights = arrivals.filter(a => a.from && cartish(a.from.kind) === cartish(a.kind)).slice(0, MAX);
      const flying = new Set(flights);

      let longest = 0;
      flights.forEach((a, i) => {
        const g = byId.get(a.item.dataset.id);
        const cart = cartish(a.kind);
        // it flies at the size it lands, so it is crisp when it gets there
        const s = cart ? unitOf(a.face, a.kind, g) : a.face.offsetHeight / Case.layout(g, 1).h;
        const fly = cart ? Case.cart(g, s) : Case.slab(g, s);
        if (g.format === 'digital') $('.cv', fly)?.classList.add('ghosted');
        const [W, H] = cart ? Case.cartSize(g, s) : [Case.layout(g, s).w, a.face.offsetHeight];
        const cx = a.r.left + a.r.width / 2, cy = a.r.top + a.r.height / 2;
        const wrap = document.createElement('div');
        wrap.className = 'mf';
        wrap.style.cssText = `left:${(cx - W / 2 + scrollX).toFixed(1)}px;top:${(cy - H / 2 + scrollY).toFixed(1)}px;width:${W.toFixed(1)}px;height:${H.toFixed(1)}px`;
        wrap.append(fly);
        layer.append(wrap);

        const dx = a.from.cx - cx, dy = a.from.cy - cy, k = cart ? a.from.u / s : a.from.h / H;
        const dist = Math.hypot(dx, dy);
        const lift = 30 + Math.min(90, dist * 0.12);
        const duration = 760 + Math.min(340, dist * 0.3);
        const delay = Math.min(i, 48) * 14;
        longest = Math.max(longest, delay + duration);
        const at = (x, y, sc) => `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${sc.toFixed(3)})`;
        const anim = wrap.animate([
          { transform: at(dx, dy, k) },
          { transform: at(dx / 2, dy / 2 - lift, ((k + 1) / 2) * 1.06), offset: 0.5 },
          { transform: at(0, 0, 1) },
        ], { duration, delay, easing: 'cubic-bezier(.35,0,.25,1)', fill: 'both' });
        // a case turns between its spine and its cover; a cartridge turns from its side to its front, or straightens up or leans back
        const turn = cart
          ? [cartTurn(a.from.kind, snap.view, H / 2), cartTurn(a.kind, state.view, H / 2)]
          : [`rotateY(${a.from.kind === 'spine' ? 90 : 0}deg)`, `rotateY(${a.kind === 'spine' ? 90 : 0}deg)`];
        fly.animate(turn.map(transform => ({ transform })), { duration: duration * 0.8, delay: delay + duration * 0.1, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'both' });
        // a spine as wide as it was where it took off, widening or narrowing to the one it lands on
        if (!cart) {
          const d1 = parseFloat(fly.style.getPropertyValue('--sd')), f1 = parseFloat(fly.style.getPropertyValue('--sfs'));
          const to = spineOf(a.face);
          const ends = [a.from.sw ? [a.from.sw / k, a.from.sf / k] : [d1, f1], to.sw ? [to.sw, to.sf] : [d1, f1]];
          if (Math.abs(ends[0][0] - ends[1][0]) > 0.5) fly.animate(ends.map(([d, f]) => ({ '--sd': d + 'px', '--sfs': f + 'px' })), { duration, delay, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'both' });
        }

        // the game on the page waits under it until it lands
        const spot = spotOf(a.item, a.face);
        spot.style.visibility = 'hidden';
        hidden.push(spot);
        anim.onfinish = () => { spot.style.visibility = ''; wrap.remove(); };
      });

      // the rest had no place in the other view: they come in quietly
      arrivals.filter(a => !flying.has(a)).forEach(a => {
        spotOf(a.item, a.face).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: 350, easing: 'ease-out', fill: 'backwards' });
      });
      // the grid's captions come in once the cases are nearly home
      host.querySelector('.grid')?.classList.add('morphing');
      run = { layer, hidden, timer: setTimeout(stop, longest + 300) };
    }

    return { capture, play, stop };
  })();

  /* ---------- the spotlight: a game lifts off the page and comes to the middle ----------
     Its place on the shelf (or in the grid or list) stays empty while it is out. It
     stands in the middle with its name above and its details below, and can be
     turned round and opened. Closing flies it back into its place. */
  const Detail = (() => {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const ui = document.createElement('div');
    ui.className = 'spot-ui';
    ui.setAttribute('role', 'dialog');
    ui.setAttribute('aria-modal', 'true');
    ui.tabIndex = -1;
    ui.innerHTML = `<button class="spot-close" type="button" aria-label="Close">✕</button>
      <div class="spot-nav"><button type="button" data-step="-1" aria-label="Previous game">←</button><span class="spot-count"></span><button type="button" data-step="1" aria-label="Next game">→</button></div>`;
    document.body.append(overlay, ui);
    overlay.addEventListener('click', () => close());
    $('.spot-close', ui).addEventListener('click', () => close());
    ui.addEventListener('click', e => { const s = e.target.closest('[data-step]'); if (s) step(+s.dataset.step); });

    const REST = { box: [-6, -24], flat: [-4, -14] };
    const NAV = 64; // the arrows along the bottom
    let cur = null; // the game in the middle
    const leaving = new Set(); // games on their way back

    const isOpen = () => !!cur && !cur.closing;
    const shape = g => g.format === 'cartridge-only' ? 'cart' : g.format === 'digital' ? 'card' : 'box';
    // how it stood where it was picked from: a spine turned side on, a cartridge on its side with its top label out, or facing out
    const fromPose = el => el && el.classList.contains('sp') ? [0, 90, 0] : el && el.classList.contains('cside') ? [0, -90, 90] : [0, 0, 0];
    const rot = ([x, y, z = 0]) => `rotateX(${x}deg) rotateY(${y}deg) rotateZ(${z}deg)`;

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

    /* The game in the middle of the screen, as big as the text above and below leaves room for.
       On a wide, short screen (a phone on its side) the game stands on the left and its text on the right. */
    function layoutFor(g) {
      const vw = innerWidth, vh = innerHeight;
      const [w1, h1] = sizeOf(g, 1);
      const padX = clamp(vw * 0.06, 16, 96), margin = clamp(vh * 0.04, 12, 44);
      const cap = shape(g) === 'cart' ? 7 : 3.2;
      if (vw >= 600 && vh < 560 && vw > vh * 1.4) {
        const k = Math.max(0.15, Math.min((vw * 0.5 - padX * 1.5) / (w1 * 1.15), (vh - margin * 2 - NAV) / h1, cap));
        return { k, w: w1 * k, h: h1 * k, cx: (padX + vw * 0.5) / 2, cy: (vh - NAV) / 2, vw, vh, padX, margin, side: true };
      }
      const text = vw < 640 ? 200 : 250; // a first guess at the text; place() measures it
      const k = Math.max(0.15, Math.min((vw - padX * 2) / (w1 * 1.2), Math.max(vh - margin * 2 - NAV - text, 140) / h1, (vh * 0.55) / h1, cap));
      return { k, w: w1 * k, h: h1 * k, cx: vw / 2, cy: vh / 2, vw, vh, padX, margin };
    }

    const infoAbove = g => {
      const c = CONSOLE_BY_ID[g.console];
      return `<p class="spot-eyebrow" style="--n:0"><span class="spot-art">${CONSOLE_ART[g.console] || ''}</span>${esc(c.name)}${g.mac ? ' / Mac' : ''} · ${esc(REGIONS[g.region]?.name || g.region)}</p><h2 style="--n:1">${esc(g.title)}</h2>`;
    };
    function infoBelow(g) {
      const c = CONSOLE_BY_ID[g.console];
      const made = g.developer && g.developer !== g.publisher ? `Developed by ${g.developer}` : '';
      const pack = g.pack && g.pack !== 'Base game' ? [g.pack, g.packCode].filter(Boolean).join(' ') : '';
      const rest = [pack, g.genre, FORMATS[g.format], g.platinum && 'Platinum', g.alsoDigital && 'Also in the EA app', g.edition, made].filter(Boolean);
      const q = encodeURIComponent(`${g.title} ${c.name} ${REGIONS[g.region]?.name || g.region} box art`);
      let n = 2;
      return `
        <p class="spot-who" style="--n:${n++}">${[Case.date(g.released, true), g.publisher].filter(Boolean).map(esc).join(' · ')}</p>
        ${rest.length ? `<p class="spot-rest" style="--n:${n++}">${rest.map(esc).join(' · ')}</p>` : ''}
        ${g.note ? `<p class="spot-note" style="--n:${n++}">${esc(g.note)}</p>` : ''}
        ${g.cover ? '' : `<a class="spot-find" style="--n:${n++}" href="https://www.google.com/search?tbm=isch&amp;q=${q}" target="_blank" rel="noopener">Find the cover on Google Images ↗</a>`}
        ${shape(g) === 'box' ? `<div class="views" style="--n:${n++}">
          <button type="button" data-v="front">Front</button><button type="button" data-v="spine">Spine</button><button type="button" data-v="back">Back</button>
          <button type="button" class="open-btn" data-v="open">${Case.layout(g, 1).kind === 'box' ? 'Take it out' : 'Open case'}</button></div>` : ''}`;
    }

    /* ---------- turning it round ---------- */
    function pose(animate) {
      if (!cur) return;
      cur.turn.style.transition = animate ? 'transform .8s cubic-bezier(.2,.8,.2,1)' : 'none';
      cur.turn.style.transform = rot([cur.rx, cur.ry]);
      const n = ((cur.ry % 360) + 360) % 360;
      const v = n > 45 && n < 135 ? 'spine' : n >= 135 && n < 225 ? 'back' : (n < 45 || n > 315) ? 'front' : '';
      $$('[data-v]', cur.layer).forEach(b => b.classList.toggle('on', b.dataset.v === v));
    }
    function view(v) {
      if (!cur || cur.sh !== 'box') return;
      const isBox = Case.layout(cur.g, 1).kind === 'box';
      if (v === 'open' || v === 'close') {
        cur.open = v === 'open';
        cur.obj.classList.toggle('open', cur.open);
        if (cur.open) { cur.rx = -8; cur.ry = isBox ? -18 : 16; }
        $$('.open-btn', cur.layer).forEach(b => {
          b.textContent = cur.open ? (isBox ? 'Put it back' : 'Close case') : (isBox ? 'Take it out' : 'Open case');
          b.dataset.v = cur.open ? 'close' : 'open';
        });
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
        if (!cur || cur.closing || cur.piece !== el) return;
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

    /* ---------- where a game is on the page ---------- */
    function poseOf(el) {
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height, seen: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0 };
    }
    // the element that shows this game now: on the shelf, in the grid or in the list
    function homeOf(g) {
      const item = (state.view === 'checklist' ? $('#checklist') : host).querySelector(`[data-id="${CSS.escape(g.id)}"]`);
      return item ? faceOf(item) : null;
    }
    // what a flight scales against: a spine is matched by height, anything else by its size
    const scaleFrom = (el, p, w, h) => el.classList.contains('sp') ? p.h / h : el.classList.contains('cside') ? p.h / w : Math.min(p.w / w, p.h / h);
    const piecePose = (L, cx, cy, s) => `translate(${(cx - L.w / 2).toFixed(1)}px,${(cy - L.h / 2).toFixed(1)}px) scale(${s.toFixed(4)})`;
    // a place just off the screen on the way to (x, y)
    const offscreen = (L, x, y) => [clamp(x, L.w / 2, L.vw - L.w / 2), y < L.vh / 2 ? -L.h * 0.75 : L.vh + L.h * 0.75];

    // a case picked from a spine drawn wider than the real one (the rows) starts as wide and narrows to its real
    // depth on the way out, and widens again on the way home, instead of jumping (s: its scale at the spine's end)
    function depth(a, el, s, duration, fill, out) {
      if (a.sh !== 'box' || !el || !el.classList.contains('sp')) return;
      const real = [parseFloat(a.obj.style.getPropertyValue('--sd')), parseFloat(a.obj.style.getPropertyValue('--sfs'))];
      const spine = [el.offsetWidth / s, parseFloat(getComputedStyle(el).fontSize) / s];
      if (Math.abs(spine[0] - real[0]) < 0.5) return;
      const keys = (out ? [spine, real] : [real, spine]).map(([d, f]) => ({ '--sd': d + 'px', '--sfs': f + 'px' }));
      a.obj.animate(keys, { duration, easing: 'cubic-bezier(.4,.1,.2,1)', fill });
    }

    function hide(a, el) { if (el && !a.hidden.includes(el)) { el.style.visibility = 'hidden'; a.hidden.push(el); } }
    function unhide(a) { a.hidden.forEach(el => { el.style.visibility = ''; }); a.hidden = []; }

    /* ---------- opening ---------- */
    function open(g, source, fromHash) {
      if (!g) return;
      if (cur) finish(cur);
      tipEl.classList.remove('vis');
      if (!fromHash) setHash(g.id, true);
      overlay.classList.add('open');
      ui.classList.add('open');
      show(g, source && source.isConnected ? source : homeOf(g), 0);
      setTimeout(() => ui.focus({ preventScroll: true }), 60);
    }

    // Stands a game in the middle. It lifts off its place when that is on screen; otherwise it
    // comes in from the side it is on (side: 1 from the right, -1 from the left, 0 from its place).
    function show(g, src, side, still) {
      leaving.forEach(x => { if (x.g === g) finish(x); }); // already on its way back: it comes straight out again
      const L = layoutFor(g);
      const a = cur = { g, source: src || null, L, rx: 0, ry: 0, open: false, closing: false, hidden: [], raf: 0, timer: 0 };
      const layer = document.createElement('div');
      layer.className = 'spot';
      layer.innerHTML = `<div class="spot-floor"></div><div class="spot-info above">${infoAbove(g)}</div><div class="spot-info below">${infoBelow(g)}</div>`;
      const piece = document.createElement('div');
      piece.className = 'spot-piece';
      const { turn, obj, sh } = build(g, L.k);
      piece.append(turn);
      layer.append(piece);
      layer.classList.toggle('side', !!L.side);
      if (still) layer.classList.add('still');
      ui.before(layer);
      Object.assign(a, { layer, piece, turn, obj, sh });
      layer.addEventListener('click', e => { const v = e.target.closest('[data-v]'); if (v) view(v.dataset.v); });
      grab(piece);
      place(a);
      count(g);
      ui.setAttribute('aria-label', g.title);
      document.body.style.setProperty('--spot-x', L.cx.toFixed(0) + 'px');
      document.body.style.setProperty('--spot-y', L.cy.toFixed(0) + 'px');

      const restPose = REST[sh === 'box' ? 'box' : 'flat'];
      [a.rx, a.ry] = restPose;
      const rest = piecePose(L, L.cx, L.cy, 1);
      piece.style.transform = rest;
      pose(false);

      const from = a.source ? poseOf(a.source) : null;
      hide(a, a.source); // its place stays empty while it is out
      if (still || reduced()) return;
      if (from && from.seen && !side) {
        // off the page: it lifts from its place and flies over, turning and growing as it goes
        const s0 = scaleFrom(a.source, from, L.w, L.h);
        const dist = Math.hypot(from.cx - L.cx, from.cy - L.cy);
        const lift = 50 + Math.min(110, dist * 0.12);
        const duration = 820 + Math.min(320, dist * 0.25);
        a.flight = piece.animate([
          { transform: piecePose(L, from.cx, from.cy, s0) },
          { transform: piecePose(L, (from.cx + L.cx) / 2, (from.cy + L.cy) / 2 - lift, (s0 + 1) / 2), offset: 0.45 },
          { transform: rest },
        ], { duration, easing: 'cubic-bezier(.3,.05,.2,1)', fill: 'backwards' });
        turn.animate([{ transform: rot(fromPose(a.source)) }, { transform: rot(restPose) }], { duration: duration * 0.9, easing: 'cubic-bezier(.4,.1,.2,1)', fill: 'backwards' });
        depth(a, a.source, s0, duration * 0.9, 'backwards', true);
      } else {
        // its place is off the screen (or it has none): it comes in from that side
        const start = side ? [L.cx + side * (L.vw / 2 + L.w * 0.8), L.cy]
          : from ? offscreen(L, from.cx, from.cy)
          : [L.cx, L.vh + L.h * 0.75];
        const s0 = from && !side ? Math.max(0.3, scaleFrom(a.source, from, L.w, L.h)) : 0.9;
        a.flight = piece.animate([
          { transform: piecePose(L, start[0], start[1], s0) },
          { transform: rest },
        ], { duration: 820, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'backwards' });
        turn.animate([{ transform: rot(from && !side ? fromPose(a.source) : [restPose[0], restPose[1] + (side || -1) * 40]) }, { transform: rot(restPose) }],
          { duration: 820, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'backwards' });
      }
    }

    // the text above and below, kept on the screen: the game shrinks if the text needs the room
    function place(a) {
      const { L, layer } = a;
      const above = $('.spot-info.above', layer), below = $('.spot-info.below', layer);
      if (L.side) {
        // the text in one column on the right, the game in the middle of the left
        const x0 = L.vw * 0.52, width = L.vw - L.padX - x0;
        for (const info of [above, below]) {
          info.style.left = x0.toFixed(1) + 'px';
          info.style.width = width.toFixed(1) + 'px';
        }
        const ah = above.offsetHeight, bh = below.offsetHeight;
        const top = Math.max(L.margin, (L.vh - NAV - ah - 12 - bh) / 2);
        above.style.top = top.toFixed(1) + 'px';
        below.style.top = (top + ah + 12).toFixed(1) + 'px';
        L.cy = Math.max(L.margin + L.h / 2, (L.vh - NAV) / 2);
      } else layOut(a, above, below);
      a.piece.style.width = L.w.toFixed(1) + 'px';
      a.piece.style.height = L.h.toFixed(1) + 'px';
      const floor = $('.spot-floor', layer);
      floor.style.left = (L.cx - L.w * 0.7).toFixed(1) + 'px';
      floor.style.width = (L.w * 1.4).toFixed(1) + 'px';
      floor.style.top = (L.cy + L.h / 2 - 12).toFixed(1) + 'px';
    }
    function layOut(a, above, below) {
      const L = a.L;
      const width = Math.min(Math.max(L.w * 1.6, 360), L.vw - L.padX * 2);
      for (const info of [above, below]) {
        info.style.left = ((L.vw - width) / 2).toFixed(1) + 'px';
        info.style.width = width.toFixed(1) + 'px';
      }
      const ah = above.offsetHeight, bh = below.offsetHeight, gapA = 22, gapB = 26;
      const room = L.vh - L.margin * 2 - NAV - ah - bh - gapA - gapB;
      if (L.h > room && room > 50) {
        const f = room / L.h;
        Object.assign(L, { k: L.k * f, w: L.w * f, h: L.h * f });
        const { turn, obj, sh } = build(a.g, L.k);
        a.piece.replaceChildren(turn);
        Object.assign(a, { turn, obj, sh });
      }
      const top = L.margin + Math.max(0, (L.vh - NAV - L.margin * 2 - (ah + gapA + L.h + gapB + bh)) / 2);
      L.cy = top + ah + gapA + L.h / 2;
      above.style.top = top.toFixed(1) + 'px';
      below.style.top = (L.cy + L.h / 2 + gapB).toFixed(1) + 'px';
    }

    function count(g) {
      const i = games.indexOf(g);
      $('.spot-count', ui).textContent = i < 0 ? '' : `${i + 1} of ${games.length}`;
      $('[data-step="-1"]', ui).disabled = i <= 0;
      $('[data-step="1"]', ui).disabled = i < 0 || i >= games.length - 1;
    }

    /* ---------- closing: back to its place ---------- */
    function close(fromHash) {
      const a = cur;
      if (!a || a.closing) return;
      overlay.classList.remove('open');
      ui.classList.remove('open');
      if (!fromHash) setHash(state.sel.size === 1 ? [...state.sel][0] : '', false, a.g.id);
      const back = homeOf(a.g);
      if (back && state.view === 'rows') back.closest('[data-id]').scrollIntoView({ block: 'nearest', inline: 'center' });
      leave(a, 0);
      setTimeout(() => back?.closest('[data-id]')?.focus({ preventScroll: true }), 30);
    }

    // Sends a game back: into its place if that is on screen, else off the screen towards it,
    // or out of the side it is leaving by when stepping through (side -1 left, 1 right).
    function leave(a, side) {
      a.closing = true;
      if (cur === a) cur = null;
      leaving.add(a);
      clearTimeout(a.timer);
      if (reduced()) { finish(a); return; }
      a.layer.classList.add('leaving');
      a.obj.classList.remove('open');
      const L = a.L;
      // where it is right now, which is not its resting place if it was still flying in
      let from = { cx: L.cx, cy: L.cy, s: 1 };
      if (a.flight && a.flight.playState === 'running') {
        const m = new DOMMatrix(getComputedStyle(a.piece).transform);
        from = { cx: m.e + L.w / 2, cy: m.f + L.h / 2, s: Math.hypot(m.a, m.b) };
      }
      a.piece.getAnimations().forEach(x => x.cancel());
      a.turn.getAnimations().forEach(x => x.cancel());
      a.obj.getAnimations().forEach(x => { if (x.effect?.getKeyframes?.()[0]?.['--sd'] !== undefined) x.cancel(); });
      a.piece.style.transform = piecePose(L, from.cx, from.cy, from.s);

      // the page may have been drawn again since it came out
      const home = homeOf(a.g);
      if (home !== a.source) { unhide(a); a.source = home; hide(a, home); }
      const to = home ? poseOf(home) : null;

      if (to && to.seen) {
        const dist = Math.hypot(to.cx - from.cx, to.cy - from.cy);
        const lift = 40 + Math.min(100, dist * 0.1);
        const duration = 760 + Math.min(300, dist * 0.22);
        a.turn.style.transition = `transform ${duration * 0.85}ms cubic-bezier(.4,0,.2,1)`;
        a.turn.style.transform = rot(fromPose(home));
        depth(a, home, scaleFrom(home, to, L.w, L.h), duration * 0.85, 'forwards', false);
        const t0 = performance.now();
        let goal = to;
        // every frame aims at where its place is now, since the page can scroll meanwhile
        const frame = now => {
          if (a.done) return;
          const t = clamp((now - t0) / duration, 0, 1), u = easeInOut(t);
          if (home.isConnected) goal = poseOf(home);
          a.piece.style.transform = piecePose(L, lerp(from.cx, goal.cx, u), lerp(from.cy, goal.cy, u) - lift * Math.sin(Math.PI * u), lerp(from.s, scaleFrom(home, goal, L.w, L.h), u));
          if (t < 1) a.raf = requestAnimationFrame(frame); else finish(a);
        };
        a.raf = requestAnimationFrame(frame);
        a.timer = setTimeout(() => finish(a), duration + 400);
        return;
      }

      const end = side ? [L.cx + side * (L.vw / 2 + L.w * 0.8), from.cy]
        : to ? offscreen(L, to.cx, to.cy)
        : [from.cx, L.vh + L.h * 0.75];
      const s1 = to && !side ? Math.max(0.3, scaleFrom(home, to, L.w, L.h)) : 0.9;
      a.turn.style.transition = 'transform .6s cubic-bezier(.4,0,.2,1)';
      a.turn.style.transform = rot(to && !side ? fromPose(home) : [a.rx, a.ry + (side || 1) * 40]);
      a.flight = a.piece.animate([
        { transform: piecePose(L, from.cx, from.cy, from.s) },
        { transform: piecePose(L, end[0], end[1], s1) },
      ], { duration: 650, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'forwards' });
      a.flight.finished.then(() => finish(a), () => {});
      a.timer = setTimeout(() => finish(a), 1000);
    }

    function finish(a) {
      if (!a || a.done) return;
      a.done = true;
      clearTimeout(a.timer);
      cancelAnimationFrame(a.raf);
      a.layer?.remove();
      unhide(a);
      leaving.delete(a);
      if (cur === a) cur = null;
    }

    // the next or previous game: this one goes back as that one comes out
    function step(n) {
      if (!cur || cur.closing) return;
      const g = games[games.indexOf(cur.g) + n];
      if (!g || games.indexOf(cur.g) < 0) return;
      leave(cur, -n);
      setHash(g.id, false);
      show(g, homeOf(g), n);
    }

    // the page was drawn again: the game in the middle belongs to its new place
    function rehome() {
      if (!cur) return;
      unhide(cur);
      cur.source = homeOf(cur.g);
      hide(cur, cur.source);
      count(cur.g);
    }

    let rt = 0;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (!cur || cur.closing) return;
        const g = cur.g;
        finish(cur);
        show(g, homeOf(g), 0, true);
      }, 200);
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
    if (byId.has(h)) { if (Detail.current()?.id !== h) Detail.open(byId.get(h), null, true); return; }
    if (Detail.isOpen()) Detail.close(true);
    // a console typed into the address, or a link to one: the shelf shows that console
    if (CONSOLE_BY_ID[h] && !(state.sel.size === 1 && state.sel.has(h))) { state.sel = new Set([h]); changed(); }
  });

  /* ---------- start ---------- */
  const json = u => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  Promise.all(['data/games.json', ...(CFG && CFG.data || [])].map(json))
    .then(([db, ...more]) => {
      ALL = CFG ? CFG.games(db, ...more) : db.games;
      ALL.forEach(g => {
        byId.set(g.id, g);
        g._hay = fold([g.title, g.listedAs, g.publisher, g.developer, g.genre, g.released, g.region, REGIONS[g.region]?.std !== g.region && REGIONS[g.region]?.long, CONSOLE_BY_ID[g.console].name, CONSOLE_BY_ID[g.console].short, g.note, g.edition, g.platinum && 'Platinum', g.series, g.pack, g.packCode, g.mac && 'Mac'].join(' | '));
      });
      shell();
      const h = location.hash.slice(1);
      if (CONSOLE_BY_ID[h]) state.sel = new Set([h]);
      games = list();
      sync();
      render(true);
      // a collection page's link to one of its checklist's sections opens the checklist there
      if (h && VIEWS.includes('checklist') && !byId.has(h) && !CONSOLE_BY_ID[h]) {
        state.view = 'checklist';
        sync();
        render(false);
        try { $('#' + CSS.escape(h))?.scrollIntoView(); } catch (e) { /* not a section */ }
      }
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
