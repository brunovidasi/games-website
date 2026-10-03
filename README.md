# Bruno's Games

Design prototypes for a games collection site, a sibling of the music one
(`brunovida.si/music`), with the same dark wood, Fraunces + Space Grotesk and gold.
No build step and no server needed: open `prototypes/index.html` in a browser.

## The prototypes

| | | |
|---|---|---|
| 1 | **Shelf** — `prototypes/1-shelf.html` | A wooden bookcase, every game spine-out, grouped by console with brass labels. Favourites face-out like a shop (or all spines, or all face-out). |
| 2 | **Display wall** — `prototypes/2-wall.html` | Every cover face-out on an acrylic stand, grouped by console, true to size or all the same height. Covers tilt toward the mouse. |
| 3 | **Showcase** — `prototypes/3-showcase.html` | A 3D carousel, one game at a time, with a console timeline to scrub. Drag, scroll, arrow keys. |
| 4 | **Stacks** — `prototypes/4-stacks.html` | Towers of cases lying on the floor, one per console, with a messiness slider. |

All four share:

- **Console filter** on top, grouped PlayStation / Xbox / Nintendo / PC. Click a console,
  click a family name for the whole family, shift-click to pick several. Each chip's
  icon is the shape and colour of that console's case.
- **PC launchers**: pick PC and a second row appears to filter by where it activates
  (Steam, Origin, EA app, Rockstar, Battle.net, GOG, Ubisoft). Covers carry a
  "Requires Steam" strip, and spines carry a launcher badge.
- Search, status (completed / playing / backlog / on hold) and sort. The filter lives
  in the URL hash, so it carries over between prototypes.
- **Detail view**: click a game and it flies off the shelf in 3D. Drag to turn it
  round (front, spine, back), and open the case to see the disc, cartridge and manual.
  For cardboard boxes (SNES, Game Boy, big-box PC) the cartridge slides out of the top.
  ← → steps through games, space opens, Esc closes.

## Files

- `assets/data.js`: consoles with their real case sizes in mm, the PC launchers, and the mock games.
- `assets/cases.js` + `cases.css`: draw a game's front, spine, back and 3D box for its console.
  The cover art is generated from each game's colours and a motif, as a placeholder until real
  scans are used.
- `assets/ui.js` + `ui.css`: the shared shell (header, filter, tooltip, detail view).
- `fonts/`: the same self-hosted fonts as the music site.
