# Bruno's Games

The game collection site, a sibling of the record site (`brunovida.si/music`), with the same dark wood, Fraunces and Space Grotesk, and gold.

- **The shelf** (`index.html`): every game on a wooden bookcase, grouped by console, in that console's real case at its real size. Pick up any game to turn it round in 3D and open it to the disc or cartridge.
- **Design prototypes** (`prototypes/`): the four early designs, kept as they were.

## Running it

The shelf loads `data/games.json`, so open it through a web server rather than as a file:

```sh
python3 -m http.server 8000     # or: npx serve
# then open http://localhost:8000
```

There is no build step. A link like `index.html#ps2` opens straight onto one console.

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

None of these collections cover PS4, PS5, Switch, Switch 2, Xbox One or most Xbox 360 games. Those show a printed title card in the right case until they have a cover. To add a cover by hand:
1. Save the image as `covers/<console>/<name>.jpg`.
2. Set `"cover": { "file": "covers/…", "source": "manual" }` on the game.

The script never touches covers marked `manual`. A source with an API key, such as IGDB or TheGamesDB, would fill these consoles automatically. It needs a small server to keep the key private, which can come with the PHP side of the site.

## Files

- `index.html`, `css/site.css`, `js/app.js`: the shelf page, the filter and the 3D view
- `css/cases.css`, `js/cases.js`: each console's case, spine, back, disc and cartridge
- `js/consoles.js`: the consoles with their real case sizes, the regions and the PC launchers
- `data/games.json`: the collection
- `covers/`: box art, one folder per console
- `tools/`: the cover fetcher
- `prototypes/`, `assets/`: the four design prototypes
- `fonts/`: the same self-hosted fonts as the record site
