/* consoles.js — every platform the shelf knows about, with its real case size in mm
   (front width × height, depth) so cases are drawn at their true relative size. */

window.FAMILIES = [
  { id: 'playstation', name: 'PlayStation', color: '#3b7be0' },
  { id: 'xbox',        name: 'Xbox',        color: '#3aa64a' },
  { id: 'nintendo',    name: 'Nintendo',    color: '#e8303a' },
  { id: 'pc',          name: 'PC',          color: '#9aa4ad' },
];

/* kind: keep = plastic keep case, jewel = CD jewel case, box = cardboard box.
   media: what is inside. spineArt: the spine takes its colour from the cover.
   mini: colours for the little case icon in the filter (plastic, banner).
   hidden: a case style only, never a shelf of its own. */
window.CONSOLES = [
  { id: 'ps1',     name: 'PlayStation',       short: 'PS1',      fam: 'playstation', w: 142, h: 125, d: 10, kind: 'jewel', media: 'cd',     spineArt: true,  mini: ['#cfd6dd', '#0b0b0b'] },
  { id: 'ps2',     name: 'PlayStation 2',     short: 'PS2',      fam: 'playstation', w: 135, h: 190, d: 14, kind: 'keep',  media: 'dvd',    spineArt: false, mini: ['#1a1a1a', '#3a3a3a'] },
  { id: 'ps3',     name: 'PlayStation 3',     short: 'PS3',      fam: 'playstation', w: 135, h: 170, d: 12, kind: 'keep',  media: 'bd',     spineArt: true,  mini: ['#24272e', '#0c0c0e'] },
  { id: 'ps4',     name: 'PlayStation 4',     short: 'PS4',      fam: 'playstation', w: 135, h: 170, d: 12, kind: 'keep',  media: 'bd',     spineArt: true,  mini: ['#1e4ea8', '#003791'] },
  { id: 'ps5',     name: 'PlayStation 5',     short: 'PS5',      fam: 'playstation', w: 135, h: 170, d: 12, kind: 'keep',  media: 'bd',     spineArt: true,  mini: ['#2456b0', '#ffffff'] },
  { id: 'xbox',    name: 'Xbox',              short: 'Xbox',     fam: 'xbox',        w: 135, h: 190, d: 14, kind: 'keep',  media: 'dvd',    spineArt: false, mini: ['#1a1a1a', '#4fae22'] },
  { id: 'x360',    name: 'Xbox 360',          short: '360',      fam: 'xbox',        w: 135, h: 190, d: 14, kind: 'keep',  media: 'dvd',    spineArt: true,  mini: ['#2f8f33', '#e6e9ec'] },
  { id: 'xone',    name: 'Xbox One',          short: 'One',      fam: 'xbox',        w: 135, h: 170, d: 12, kind: 'keep',  media: 'bd',     spineArt: true,  mini: ['#1c7c1c', '#107c10'] },
  { id: 'snes',    name: 'Super Nintendo',    short: 'SNES',     fam: 'nintendo',    w: 180, h: 128, d: 38, kind: 'box',   media: 'snes',   spineArt: true,  mini: ['#8a8a96', '#3d3d44'] },
  { id: 'gb',      name: 'Game Boy',          short: 'GB',       fam: 'nintendo',    w: 118, h: 124, d: 30, kind: 'box',   media: 'gb',     spineArt: true,  mini: ['#b8b8b0', '#5a5a64'], hidden: true },
  { id: 'gbc',     name: 'Game Boy Color',    short: 'GBC',      fam: 'nintendo',    w: 118, h: 124, d: 30, kind: 'box',   media: 'gbc',    spineArt: true,  mini: ['#b0a080', '#111111'] },
  { id: 'gba',     name: 'Game Boy Advance',  short: 'GBA',      fam: 'nintendo',    w: 128, h: 124, d: 32, kind: 'box',   media: 'gba',    spineArt: true,  mini: ['#8a8ad8', '#2c2a86'] },
  { id: 'ds',      name: 'Nintendo DS',       short: 'DS',       fam: 'nintendo',    w: 125, h: 137, d: 14, kind: 'keep',  media: 'ds',     spineArt: false, mini: ['#2b2b30', '#ececec'] },
  { id: '3ds',     name: 'Nintendo 3DS',      short: '3DS',      fam: 'nintendo',    w: 125, h: 137, d: 14, kind: 'keep',  media: '3ds',    spineArt: false, mini: ['#f3f3f3', '#d0021b'] },
  { id: 'wii',     name: 'Wii',               short: 'Wii',      fam: 'nintendo',    w: 135, h: 190, d: 14, kind: 'keep',  media: 'wii',    spineArt: false, mini: ['#f7f7f7', '#c9cdd1'] },
  { id: 'wiiu',    name: 'Wii U',             short: 'Wii U',    fam: 'nintendo',    w: 135, h: 190, d: 14, kind: 'keep',  media: 'wiiu',   spineArt: false, mini: ['#1c9bd1', '#009ac7'] },
  { id: 'switch',  name: 'Nintendo Switch',   short: 'Switch',   fam: 'nintendo',    w: 105, h: 170, d: 11, kind: 'keep',  media: 'switch', spineArt: false, mini: ['#e60012', '#e60012'] },
  { id: 'switch2', name: 'Nintendo Switch 2', short: 'Switch 2', fam: 'nintendo',    w: 105, h: 170, d: 11, kind: 'keep',  media: 'switch', spineArt: false, mini: ['#d8000f', '#111111'] },
  { id: 'pc',      name: 'PC',                short: 'PC',       fam: 'pc',          w: 135, h: 190, d: 14, kind: 'keep',  media: 'dvd',    spineArt: true,  mini: ['#1a1a1a', '#66c0f4'] },
];
window.CONSOLE_BY_ID = Object.fromEntries(window.CONSOLES.map(c => [c.id, c]));

/* Big-box PC games are cardboard, much bigger than a DVD case. */
window.BIGBOX = { w: 190, h: 235, d: 50 };

/* Where a PC copy activates — for the PC games still to come. */
window.LAUNCHERS = {
  steam:     { name: 'Steam',           bg: '#171a21', fg: '#66c0f4', glyph: '◉' },
  origin:    { name: 'Origin',          bg: '#f56c2d', fg: '#ffffff', glyph: '◎' },
  ea:        { name: 'EA app',          bg: '#ff4747', fg: '#ffffff', glyph: 'EA' },
  rockstar:  { name: 'Rockstar',        bg: '#fcaf17', fg: '#111111', glyph: 'R★' },
  battlenet: { name: 'Battle.net',      bg: '#148eff', fg: '#ffffff', glyph: '✦' },
  gog:       { name: 'GOG Galaxy',      bg: '#86328a', fg: '#ffffff', glyph: 'G' },
  ubisoft:   { name: 'Ubisoft Connect', bg: '#0070ff', fg: '#ffffff', glyph: 'U' },
  none:      { name: 'DRM-free disc',   bg: '#3a3a3a', fg: '#ffffff', glyph: '◌' },
};

window.REGIONS = {
  'PAL':    { name: 'PAL',    long: 'PAL — Europe & Australia' },
  'NTSC-U': { name: 'NTSC-U', long: 'NTSC-U — Americas' },
  'NTSC-J': { name: 'NTSC-J', long: 'NTSC-J — Japan' },
};

window.FORMATS = {
  'boxed':          'Boxed',
  'cartridge-only': 'Cartridge only',
  'digital':        'Digital copy',
};
