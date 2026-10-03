# Bruno's Games

The game collection site, with the same dark wood, Fraunces and Space Grotesk, and gold as the record site (`brunovida.si/music`). The two are separate sites.

- **The shelf** (`index.html`): every game on a wooden bookcase, grouped by console, in that console's real case at its real size. Loose cartridges stand on their own. The console filter at the top shows a drawing of each console.
- **The list**: the same games as a sortable table, like the record site's list. Switch between them with *Shelf* and *List*.
- **A game up close**: click a case on the shelf or a row in the list. As on the record site, it flies out to the middle of the page with its details beside it. Drag it to turn it round, or use *Front*, *Spine* and *Back*. *Open case* shows the disc, and *Take it out* lifts the cartridge out of its box. On a phone the details slide up from the bottom.
- **Design prototypes** (`prototypes/`): the four early designs, kept as they were.

## Running it

The shelf loads `data/games.json`, so open it through a web server rather than as a file:

```sh
python3 -m http.server 8000     # or: npx serve
# then open http://localhost:8000
```

There is no build step. A link like `index.html#ps2` opens straight onto one console, and `index.html#ps2-final-fantasy-x` opens one game.

## The collection: `data/games.json`

One entry per copy on the shelf:

| Field | Example | Notes |
|---|---|---|
| `id` | `"ps2-final-fantasy-x"` | console + title, unique |
| `console` | `"ps2"` | which shelf it sits on. Ids are in `js/consoles.js` |
| `title` | `"Final Fantasy X"` | the official title |
| `listedAs` | `"Nárnia"` | how it was written on the original list, when different |
| `edition` | `"Nintendo Switch 2 Edition"` | optional |
| `region` | `"PAL"` | `PAL`, `NTSC-U` or `NTSC-J` |
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

**PC games**: use `"console": "pc"` and add `"launcher"` (`steam`, `origin`, `ea`, `rockstar`, `battlenet`, `gog`, `ubisoft` or `none`). Add `"big": true` for a big-box release.

## Cases and cartridges

Each case is drawn at its real size from `js/consoles.js`, so a DS case is wider than it is tall and a PS3 case is shorter than a PS2 one. A cover scan always shows whole. It sits in the case at its own shape: under the blue header on a Blu-ray case, to the right of the hinge on a CD jewel case, and centred in the rest. Cardboard boxes (SNES, Game Boy) take the shape of their scan.

The cartridges and game cards (SNES, Game Boy, GBA, DS, 3DS, Switch, Switch 2) are drawn in `js/cases.js` with their real outlines and label areas. The label shows the box art without the console-name strip that Western boxes have down one side.

## Covers

`tools/fetch-covers.mjs` looks for box art for every game whose `cover` is `null`. It downloads it into `covers/`, resizes it, and writes the file and its colours back into `games.json`:

```sh
cd tools && npm install
node fetch-covers.mjs --dry      # show what it would match
node fetch-covers.mjs            # download
node fetch-covers.mjs --only ps2-the-sims   # redo one game
```

It uses free community collections on GitHub, region by region, and needs no keys:

- [libretro-thumbnails](https://github.com/libretro-thumbnails): PS1, PS2, Xbox, Wii, Wii U, DS, 3DS, Game Boy, GBC, GBA, SNES
- [aldostools/resources](https://github.com/aldostools/resources): PS3, by disc serial
- [xlenore/ps2-covers](https://github.com/xlenore/ps2-covers): PS2, by disc serial

If it picks the wrong one, or finds nothing, set `"coverMatch"` on the game:
- the libretro file name without `.png`, for example `"DreamWorks Shark Tale (Europe)"`
- a PS3 serial, for example `"BLES00229"`
- a PS2 serial, for example `"SLES-52047"`

None of these collections cover PS4, PS5, Switch, Switch 2, Xbox One or most Xbox 360 games. Those show a printed title card in the right case until they have a cover. The details of every game without a cover have a *Find the cover on Google Images* link that searches for the title, console and region. To add a cover by hand:
1. Save the image as `covers/<console>/<name>.jpg`.
2. Set `"cover": { "file": "covers/…", "source": "manual" }` on the game.
3. Run `node fetch-covers.mjs` in `tools/`. It measures the cover's shape, so it fits the case, and takes its colours for the spine. It does not change the image.

The script never replaces covers marked `manual`. A source with an API key, such as IGDB or TheGamesDB, would fill these consoles automatically. It needs a small server to keep the key private, which can come with the PHP side of the site.

## Files

- `index.html`, `css/site.css`, `js/app.js`: the page, the filter, the shelf, the list and the 3D view
- `css/cases.css`, `js/cases.js`: each console's case, spine, back, disc and cartridge
- `js/consoles.js`: the consoles with their real case sizes, the regions and the PC launchers
- `js/console-art.js`: the console drawings in the filter
- `data/games.json`: the collection
- `covers/`: box art, one folder per console
- `tools/`: the cover fetcher
- `prototypes/`, `assets/`: the four design prototypes
- `fonts/`: the same self-hosted fonts as the record site
