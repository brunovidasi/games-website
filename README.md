# Bruno's Games

The game collection site, with the same dark wood, Fraunces and Space Grotesk, and gold as the record site (`brunovida.si/music`). The two are separate sites.

- **The shelf** (`index.html`): every game on a wooden bookcase, grouped by console, in that console's real case at its real size. Loose cartridges stand on their own. The console filter at the top shows a drawing of each console.
- **The grid**: every game face out, standing on one line at its real size, with its name under it. Going between *Shelf* and *Grid* carries every case on screen across, as the record site does between its floor and its grid: each case comes off the shelf and turns from its spine to its cover on the way, and turns back to its spine on the way home.
- **The list**: the same games as a sortable table, like the record site's list.
- **A game up close**: click a case on the shelf, in the grid or in the list. It lifts out of its place, which stays empty, and flies to the middle of the screen with its name above it and its details below. Drag it to turn it round, or use *Front*, *Spine* and *Back*. *Open case* shows the disc, and *Take it out* lifts the cartridge out of its box. The arrows at the bottom (or the arrow keys) go to the next and previous game; closing flies it back into its place. On a phone held sideways the details stand beside it.
- **The Sims collection** (`sims.html`): every Sims game and pack, on the same bookcase, in the same grid and list, grouped by game (The Sims, The Sims 2, The Sims Stories, The Sims 3, The Sims Medieval, The Sims 4, SimCity, MySims) rather than by console. Its *Checklist* view sorts them by game and pack, with how much of each is there and the want list. A solid case is on disc, an outline is in the EA app.
- **Grand Theft Auto** (`gta.html`): every GTA copy on the bookcase, grouped by game. Its *Checklist* goes era by era, one row per game with its copies on every platform and a dashed outline at the real case size for each version still to find. Those outlines are the want list at the bottom.
- **Design prototypes** (`prototypes/`): the four early designs, kept as they were.

## Running it

The shelf loads `data/games.json`, so open it through a web server rather than as a file:

```sh
python3 -m http.server 8000     # or: npx serve
# then open http://localhost:8000
```

There is no build step. A link like `index.html#ps2` opens straight onto one console, and `index.html#ps2-final-fantasy-x` opens one game. On the collection pages a section's name opens the checklist there: `gta.html#want-list`.

The collection pages are the same shelf (`js/app.js`): each sets `window.SHELF_PAGE` with its games, how they group, its header and its checklist (see the top of `js/app.js`).

## The collection: `data/games.json`

One entry per copy on the shelf:

| Field | Example | Notes |
|---|---|---|
| `id` | `"ps2-final-fantasy-x"` | console + title, unique |
| `console` | `"ps2"` | which shelf it sits on. Ids are in `js/consoles.js` |
| `title` | `"Final Fantasy X"` | the official title |
| `listedAs` | `"Nárnia"` | how it was written on the original list, when different |
| `edition` | `"Nintendo Switch 2 Edition"` | optional |
| `region` | `"AUS"` | the region code on the box: `AUS`, `EUR`, `HOL` (Netherlands), `USA` or `JPN`. When it isn't known, just `PAL`, `NTSC-U` or `NTSC-J`. The region filter groups them by PAL, NTSC-U and NTSC-J |
| `released` | `"2001-07-19"` | first release on that console. Can be `"2001-07"` or `"2001"` |
| `dateSource` | `"manual"` | `libretro-database`, or `manual` (from memory, worth checking) |
| `publisher`, `developer`, `genre` | | |
| `format` | `"boxed"` | `boxed`, `cartridge-only` (stands loose on the shelf) or `digital` (an outline) |
| `caseStyle` | `"ps4"` | optional: drawn in another console's case (a PS4 disc on the PS5 shelf) |
| `note` | `"No guitar controller"` | shown under the details |
| `fav` | `true` | optional: faces out on the shelf in "One cover per console" |
| `check` | | something still to confirm. Not shown on the site |
| `cover` | `{ "file": "covers/ps2/final-fantasy-x.jpg", … }` | the box art, or `null` |
| `colors` | `["#fcfcfc", …]` | taken from the cover. Some spines use them |

To add a game, copy an entry, change it, and set `cover` and `colors` to `null`. Then fetch its cover (below).

**PC games**: use `"console": "pc"` and add `"launcher"` (`steam`, `origin`, `ea`, `rockstar`, `battlenet`, `gog`, `ubisoft` or `none`). Add `"big": true` for a big-box release, `"mac": true` when it plays on a Mac too, and `"alsoDigital": true` for a disc that is also in the launcher's library.

**The Sims page** takes every game with a `"series"` (`"The Sims"`, `"The Sims 2"`, `"The Sims Stories"`, `"The Sims 3"`, `"The Sims Medieval"`, `"The Sims 4"`, `"SimCity"` or `"MySims"`), on any console. `"pack"` says what it is (`Base game`, `Collection`, `Expansion Pack`, `Game Pack`, `Stuff Pack`, `Kit`, `World` or `Extra`) and `"packCode"` gives The Sims 4's numbering (`EP01`, `GP04`, `SP12`). Serial keys are never kept here.

**The GTA page** reads `data/gta.json`: the eras, and in each its games with `copies` (ids from `games.json`) and `missing` (console ids, plus `psp` and `xsx` for Xbox Series X|S). When a missing version comes home, add it to `games.json` and move its id from `missing` to `copies`.

**The Sims want list** is `data/sims-wants.json`: the games and packs not in the collection yet, with the same `series`, `pack` and `packCode`, plus `platform` and an optional `note`. When one comes home, delete it there and add it to `games.json`.

## Cases and cartridges

Each case is drawn at its console's real height from `js/consoles.js`, so a DS case is shorter than a PS2 one and a PS3 case sits between them. The case is built around its cover scan: it takes its width from the scan, so the scan always shows whole and fills the front, with just the case's rim and hinge round it. Cardboard boxes (SNES, Game Boy) simply are their scan. A game without a scan gets its case's real width.

The cartridges and game cards (SNES, Game Boy, GBA, DS, 3DS, Switch, Switch 2) are drawn in `js/cases.js` with their real outlines and label areas. The label shows the box art without the console-name strip that Western boxes have down one side.

## Covers

`tools/fetch-covers.mjs` looks for box art for every game whose `cover` is `null`. It downloads it into `covers/`, resizes it, and writes the file and its colours back into `games.json`:

```sh
cd tools && npm install
node fetch-covers.mjs --dry      # show what it would match
node fetch-covers.mjs            # download
node fetch-covers.mjs --only ps2-the-sims   # redo one game
node fetch-covers.mjs --recheck  # after changing regions: swap in the right region's box
```

It uses free community collections on GitHub, region by region, and needs no keys:

- [libretro-thumbnails](https://github.com/libretro-thumbnails): PS1, PS2, Xbox, Wii, Wii U, DS, 3DS, Game Boy, GBC, GBA, SNES
- [aldostools/resources](https://github.com/aldostools/resources): PS3, by disc serial
- [xlenore/ps2-covers](https://github.com/xlenore/ps2-covers): PS2, by disc serial

If it picks the wrong one, or finds nothing, set `"coverMatch"` on the game:
- the libretro file name without `.png`, for example `"DreamWorks Shark Tale (Europe)"`
- a PS3 serial, for example `"BLES00229"`
- a PS2 serial, for example `"SLES-52047"`

PC games come from the box art on the game's page on [the Sims Wiki](https://sims.fandom.com), then Wikipedia, then libretro-thumbnails' DOS boxes (the first Grand Theft Auto). `"coverMatch"` names the page when the title doesn't find it. This needs `sims.fandom.com`, `static.wikia.nocookie.net`, `en.wikipedia.org` and `upload.wikimedia.org` to be reachable. In a Claude Code cloud session, run it as `NODE_USE_ENV_PROXY=1 node fetch-covers.mjs` so Node goes through the session's proxy.

None of these collections cover PS4, PS5, Switch, Switch 2, Xbox One or most Xbox 360 games. Those take the box on the game's Wikipedia page, which is often key art or another console's box, so look at what comes back. A picture wider than a box (a store icon, a banner) is skipped, `"coverMatch"` names the page, and `"wikiCover": false` stops a wrong one coming back. A game with no cover shows a printed title card in the right case. The details of every game without a cover have a *Find the cover on Google Images* link that searches for the title, console and region. To add a cover by hand:
1. Save the image as `covers/<console>/<name>.jpg`.
2. Set `"cover": { "file": "covers/…", "source": "manual" }` on the game.
3. Run `node fetch-covers.mjs` in `tools/`. It measures the cover's shape, so it fits the case, and takes its colours for the spine. It does not change the image.

The script never replaces covers marked `manual`. A source with an API key, such as IGDB or TheGamesDB, would fill these consoles automatically. It needs a small server to keep the key private, which can come with the PHP side of the site.

## Files

- `index.html`, `css/site.css`, `js/app.js`: the page, the filter, the shelf, the grid, the list, the shelf ⇄ grid flight and the spotlight
- `css/cases.css`, `js/cases.js`: each console's case, spine, back, disc and cartridge
- `js/consoles.js`: the consoles with their real case sizes, the regions and the PC launchers
- `js/console-art.js`: the console drawings in the filter
- `css/collection.css`, `js/collection.js`: what the collection pages' checklists share: the cases on their stretches of shelf, the meters, the want cards
- `sims.html`, `css/sims.css`, `js/sims.js`: the Sims collection page
- `data/sims-wants.json`: the Sims want list
- `gta.html`, `css/gta.css`, `js/gta.js`, `data/gta.json`: the Grand Theft Auto page
- `data/games.json`: the collection
- `covers/`: box art, one folder per console
- `tools/`: the cover fetcher
- `prototypes/`, `assets/`: the four design prototypes
- `fonts/`: the same self-hosted fonts as the record site
