/* sims.js — the Sims collection page. Every game in data/games.json with a "series"
   stands here, grouped by game and then by pack, with how much of each is there.
   The want list (data/sims-wants.json) is what the collection is still missing.
   A case opens in the spotlight on the shelf (index.html#<id>). */

(function () {
  const esc = Case.esc;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // the games in the series, in the order they came out
  const SERIES = [
    { id: 'the-sims',   name: 'The Sims',          blurb: 'The first one, from 2000, and its seven expansions.' },
    { id: 'the-sims-2', name: 'The Sims 2',        blurb: 'The base game, its expansions and its stuff packs.' },
    { id: 'stories',    name: 'The Sims Stories',  blurb: 'Made for laptops, all three of them.' },
    { id: 'the-sims-3', name: 'The Sims 3',        blurb: 'On PC and Mac, on disc and registered in the EA app.' },
    { id: 'medieval',   name: 'The Sims Medieval', blurb: 'The Sims with quests, and its one expansion.' },
    { id: 'the-sims-4', name: 'The Sims 4',        blurb: 'On PC and Mac. Most packs live in the EA app.' },
    { id: 'simcity',    name: 'SimCity',           blurb: 'Where Maxis started.' },
    { id: 'mysims',     name: 'MySims',            blurb: 'The little round Sims.' },
  ].map(s => ({ ...s, key: s.name }));
  const PACKS = ['Base game', 'Collection', 'Expansion Pack', 'Game Pack', 'Stuff Pack', 'Kit', 'Free Pack', 'World', 'Extra'];
  const PACK_PLURAL = { 'Base game': 'Base games', 'Collection': 'Collections', 'Expansion Pack': 'Expansion packs', 'Game Pack': 'Game packs', 'Stuff Pack': 'Stuff packs', 'Kit': 'Kits', 'Free Pack': 'Free packs', 'World': 'Worlds', 'Extra': 'Extras' };
  const byRelease = (a, b) => (a.released || '9999').localeCompare(b.released || '9999') || a.title.localeCompare(b.title);
  const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

  const stageH = () => innerWidth < 640 ? 130 : 168;

  function card(g) {
    const c = CONSOLE_BY_ID[g.console];
    const a = document.createElement('a');
    a.className = 'cell';
    a.href = './#' + encodeURIComponent(g.id);
    a.setAttribute('aria-label', `${g.title}, ${c.name}${g.mac ? ' and Mac' : ''}, ${Case.year(g)}`);
    const stage = document.createElement('span');
    stage.className = 'stage';
    const tile = document.createElement('span');
    tile.className = 'gt';
    // a DVD case stands the height of the stage, and the rest keep their real size beside it
    const s = stageH() / 190;
    if (g.format === 'cartridge-only') tile.append(Case.cart(g, s * 2));
    else {
      const face = Case.front(g, Math.min(s, (stageH() * 0.95) / Case.layout(g, 1).w));
      if (g.format === 'digital') face.classList.add('ghosted');
      tile.append(face);
    }
    stage.append(tile);
    a.append(stage);
    const tags = [];
    if (g.packCode) tags.push(`<span class="tag code">${esc(g.packCode)}</span>`);
    if (g.console !== 'pc') tags.push(`<span class="tag">${esc(c.short)}</span>`);
    if (g.format === 'boxed') tags.push('<span class="tag disc">Disc</span>');
    if (g.format === 'cartridge-only') tags.push('<span class="tag disc">Cart</span>');
    if (g.format === 'digital' || g.alsoDigital) tags.push('<span class="tag ea">EA app</span>');
    if (g.mac) tags.push('<span class="tag mac">Mac</span>');
    a.insertAdjacentHTML('beforeend', `<span class="cap"><b title="${esc(g.title)}">${esc(short(g))}</b><small>${Case.year(g)}${g.edition ? ' · ' + esc(g.edition) : ''}</small><span class="tags">${tags.join('')}</span></span>`);
    return a;
  }
  // inside its own section "The Sims 2: Pets" reads as "Pets"
  const short = (g, series = g.series) => {
    const t = g.title;
    for (const p of [series + ': ', 'The Sims: ', 'SimCity: ']) if (t.startsWith(p) && t.length > p.length) return t.slice(p.length);
    return t;
  };

  // one kind of pack, its cases standing on their own stretch of shelf
  function group(name, gs) {
    const grp = document.createElement('div');
    grp.className = 'pgrp';
    grp.innerHTML = `<h3>${esc(name)} <em>${gs.length}</em></h3>`;
    const rack = document.createElement('div');
    rack.className = 'rack';
    gs.forEach(g => rack.append(card(g)));
    grp.append(rack);
    return grp;
  }

  function meter(have, want) {
    const total = have + want, p = total ? Math.round(have / total * 100) : 100;
    return `<div class="meter" aria-label="${have} of ${total} on the list">
      <div class="nums"><b>${have} <span>of ${total}</span></b><span>${want ? plural(want, 'to find', 'to find') : 'Complete'}</span></div>
      <div class="track"><i style="--p:${p}%"></i></div></div>`;
  }

  function wantCard(w) {
    const q = encodeURIComponent(`${w.title} ${w.platform === 'PC / Mac' ? 'PC' : w.platform}`);
    const tag = w.packCode || ({ 'Expansion Pack': 'EP', 'Game Pack': 'GP', 'Stuff Pack': 'SP', 'Kit': 'Kit', 'Free Pack': 'Free' }[w.pack] || w.platform);
    return `<div class="want">
      <span class="ghostcase" aria-hidden="true">${esc(tag)}</span>
      <span><b>${esc(w.title)}</b>
        <small>${[w.pack, Case.date(w.released), w.platform].filter(Boolean).map(esc).join(' · ')}</small>
        ${w.note ? `<small class="note">${esc(w.note)}</small>` : ''}
        <a href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener">Look for it ↗</a></span>
    </div>`;
  }

  function render(games, wants) {
    const pc = games.filter(g => g.console === 'pc');
    const consoles = games.filter(g => g.console !== 'pc');
    const inApp = games.filter(g => g.format === 'digital' || g.alsoDigital).length;
    const onDisc = games.filter(g => g.format === 'boxed' || g.format === 'cartridge-only').length;
    const sections = SERIES.map(s => ({ ...s, games: pc.filter(g => g.series === s.key).sort(byRelease), wants: wants.filter(w => w.series === s.key && !/DS|N64/.test(w.platform)) }))
      .filter(s => s.games.length || s.wants.length);
    const consoleWants = wants.filter(w => /DS|N64/.test(w.platform));

    const root = $('#sims');
    root.innerHTML = `
      <header class="hero">
        <div>
          <div class="eyebrow">Bruno's Games</div>
          <h1>The Sims <em>Collection</em><i class="plumbob" aria-hidden="true"></i></h1>
          <p>Every Sims game and pack I have, from the first one in 2000 to The Sims 4, with SimCity and MySims beside them. A solid case is on disc; an outline is in the EA app.</p>
        </div>
        <div class="stats">
          <div><b>${games.length}</b><span>In the collection</span></div>
          <div><b>${onDisc}</b><span>On disc</span></div>
          <div><b>${inApp}</b><span>In the EA app</span></div>
          <div><b>${wants.length}</b><span>Still to find</span></div>
        </div>
      </header>
      <nav class="series-nav" aria-label="Jump to"><div class="in">
        ${sections.map(s => `<a href="#${s.id}">${esc(s.name)} <em>${s.games.length}</em></a>`).join('')}
        ${consoles.length ? `<a href="#consoles">On consoles <em>${consoles.length}</em></a>` : ''}
        <a class="want" href="#want-list">Want list <em>${wants.length}</em></a>
      </div></nav>`;

    sections.forEach(s => {
      const sec = document.createElement('section');
      sec.className = 'series';
      sec.id = s.id;
      sec.innerHTML = `<div class="shead"><div><h2>${esc(s.name)}</h2><p>${esc(s.blurb)}</p></div>${meter(s.games.length, s.wants.length)}</div><div class="packs"></div>`;
      const packs = $('.packs', sec);
      PACKS.forEach(p => {
        const gs = s.games.filter(g => (g.pack || 'Base game') === p);
        if (!gs.length) return;
        packs.append(group(PACK_PLURAL[p], gs));
      });
      root.append(sec);
    });

    if (consoles.length) {
      const sec = document.createElement('section');
      sec.className = 'series';
      sec.id = 'consoles';
      sec.innerHTML = `<div class="shead"><div><h2>On consoles</h2><p>The Sims, SimCity and MySims on PlayStation, Xbox and Nintendo, from the shelf.</p></div>${meter(consoles.length, consoleWants.length)}</div><div class="packs"></div>`;
      const packs = $('.packs', sec);
      SERIES.forEach(s => {
        const gs = consoles.filter(g => g.series === s.key).sort((a, b) => byRelease(a, b));
        if (!gs.length) return;
        packs.append(group(s.name, gs));
      });
      root.append(sec);
    }

    const sec = document.createElement('section');
    sec.className = 'series wantlist';
    sec.id = 'want-list';
    const groups = [...SERIES.map(s => [s.name, wants.filter(w => w.series === s.key && !/DS|N64/.test(w.platform))]), ['On consoles', consoleWants]].filter(([, ws]) => ws.length);
    sec.innerHTML = `<div class="shead"><div><h2>The <em>want list</em></h2><p>What is on my list but not on the shelf yet, oldest first.</p></div>${meter(games.length, wants.length)}</div>
      <div class="packs">${groups.map(([name, ws]) => {
        const sorted = [...ws].sort((a, b) => PACKS.indexOf(a.pack) - PACKS.indexOf(b.pack) || byRelease(a, b));
        return `<div class="pgrp"><h3>${esc(name)} <em>${ws.length}</em></h3><div class="wants">${sorted.map(wantCard).join('')}</div></div>`;
      }).join('')}</div>`;
    root.append(sec);

    // the pill for the section on screen lights up
    const links = $$('.series-nav a');
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id));
      const on = $(`.series-nav a[href="#${e.target.id}"]`), bar = $('.series-nav .in');
      if (on) bar.scrollTo({ left: on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2, behavior: 'smooth' });
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('.series').forEach(s => io.observe(s));
  }

  Promise.all(['data/games.json', 'data/sims-wants.json'].map(u => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); })))
    .then(([db, w]) => {
      const games = db.games.filter(g => g.series);
      const draw = () => render(games, w.wants);
      draw();
      if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
      let lw = innerWidth, t;
      addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if ((innerWidth < 640) !== (lw < 640)) { lw = innerWidth; draw(); } }, 150); });
    })
    .catch(err => {
      console.error(err);
      $('#sims').innerHTML = `<div class="empty-msg" style="padding-top:120px"><b>The collection couldn't load</b>The data didn't load. Open the site through a web server (for example <code>npx serve</code>) rather than as a file.</div>`;
    });
})();
