# Bruno's Games

The game collection site: black, finely pinstriped pages with a blue accent and a dark wooden bookcase, set in Orbitron (the big display text) and Exo 2 (everything else). It started from the record site (`brunovida.si/music`); the two are separate sites.

- **The bar**: the console filter sits under the header, and the bar under it has the search and the sort (a dropdown in the site's own style) on the left and the views on the right, with how many games are showing on the line below, as on the record site. On a phone the search folds into a magnifying glass that opens across the bar.
- **The shelf** (`index.html`): every game on a wooden bookcase, grouped by console, in that console's real case at its real size. Loose cartridges stand on their own (a SNES cartridge at its real size beside the cases, the small cards larger so they can be seen); SNES cartridges stand on their side in a row, like books, with the title on their top label facing out, beside the one that faces out. The spines are drawn wider than real ones so their titles can be read. Each shelf is only a little taller than the tallest game on it. Like a real shelf, it is a bit messy: on most shelves the last game or two lean over onto the one before, and so do some at the end of a console before its bookend. The plate under each console is in its family's colour, as in the filter: red Nintendo, blue PlayStation, green Xbox. The console filter at the top shows a drawing of each console.
- **The grid**: every game face out, standing on one line at its real size, with its name under it. Going between *Shelf* and *Grid* carries every case on screen across, as the record site does between its floor and its grid: each case comes off the shelf and turns from its spine to its cover on the way, and turns back to its spine on the way home. Between the shelf and the rows each spine widens or narrows smoothly in the air to the width it lands at, and a case picked from the rows leaves at the row's spine width and narrows to its real depth as it turns (and widens again on the way home). A SNES cartridge standing on its side turns from its top label to its front the same way, as one solid cartridge, and so it does when it is picked off the shelf.
- **The rows**: each console on a strip of shelf of its own that scrolls sideways. The cases stand as on the shelf, their spines out (*Show* works as on the shelf), but taller and with each spine much wider than a real one, so they are easy to tap on a phone. Swipe a row to go along it, or with a mouse use the arrows that show at either end; a scroll down over a row still scrolls the page. Sorted any way but by console, the games stand on one long row.
- **The showcase**: one game at a time on a glossy stage, with the rest fanned out either side and the light behind it in the colour of its cover, as in `prototypes/3-showcase.html`. Drag, scroll sideways, use the arrows or the arrow keys to move along, or jump with the strip under it (a block per console). The game in the middle is picked up like anywhere else, and one to the side comes to the middle first. The cases fly across between the showcase and the other views, as between the shelf and the grid.
- **The list**: the same games as a sortable table, like the record site's list.
- **A game up close**: click a case on the shelf, in the grid or in the list. It lifts out of its place, which stays empty, and flies to the middle of the screen with its name above it and its details below. Drag it to turn it round, or use *Front*, *Spine* and *Back*. *Open case* shows the disc, and *Take it out* lifts the cartridge out of its box. The arrows at the bottom (or the arrow keys) go to the next and previous game. On a big screen the previous and next games stand smaller to the left and right; stepping, the game in the middle moves aside into the place beside the next one as that one comes in from its own, and a click on either one steps to it; closing flies it back into its place. On a phone held sideways the details stand beside it.
- **The Sims collection** (`sims.html`): every Sims game and pack, on the same bookcase, in the same grid and list, grouped by game (The Sims, The Sims 2, The Sims Stories, The Sims 3, The Sims Medieval, The Sims 4, SimCity, MySims) rather than by console. Its *Checklist* view sorts them by game and pack, with how much of each is there and the want list. A solid case is on disc, an outline is in the EA app.
- **Grand Theft Auto** (`gta.html`): every GTA copy on the bookcase, grouped by game. Its *Checklist* goes era by era, one row per game with its copies on every platform and a dashed outline at the real case size for each version still to find. Those outlines are the want list at the bottom.
- **Design prototypes** (`prototypes/`): the four early designs, kept as they were.
- **Style prototypes** (`prototypes/styles/`): eleven looks for the same site, none of them live yet. `prototypes/styles/index.html` is a gallery of them with a screenshot of each, and every style has a full preview of the site in its own folder (`prototypes/styles/neon/`, with its own `sims.html` and `gta.html`). Each look is one stylesheet, `prototypes/styles/<name>.css`, loaded after the site's own CSS: `neon` (Neon Arcade), `hud` (Holo Vault), `pixel` (Pixel Quest), `dashboard` (Next-Gen Home), `museum` (Hall of Fame), `atomic` (Atomic Purple), `comic` (Game Mag), `console` (Super Console), `glitch` (Glitch City), `leonida` (Leonida, after GTA VI's Vice City) and `datacore` (Data Core). The top of each names the Google Fonts it needs. The previews are copies of the site's pages, so after changing `index.html`, `sims.html` or `gta.html`, run `node tools/style-previews.mjs` to rebuild them.

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
| `sortAs` | `"Rock Band"` | optional: where it files when sorted by title, when that isn't its title. Titles already file without a leading The, A or An (The Sims under S), so this is only for the rest: LEGO Rock Band and The Beatles: Rock Band with the Rock Band games, Disney's Tarzan under T. Games that file under the same name stand in the order they came out |
| `edition` | `"Nintendo Switch 2 Edition"` | optional |
| `region` | `"AUS"` | the region code on the box: `AUS`, `EUR`, `HOL` (Netherlands), `USA` or `JPN`. When it isn't known, just `PAL`, `NTSC-U` or `NTSC-J` |
| `released` | `"2001-07-19"` | first release on that console. Can be `"2001-07"` or `"2001"` |
| `dateSource` | `"manual"` | `libretro-database`, or `manual` (from memory, worth checking) |
| `publisher`, `developer`, `genre` | | |
| `format` | `"boxed"` | `boxed`, `cartridge-only` (stands loose on the shelf) or `digital` (an outline) |
| `kinect` | `true` | optional: a Kinect game, drawn in a purple case |
| `platinum` | `true` | PS2 and PS3: a Platinum copy. On the PS2, the silver band across its cover and a silver spine. On the PS3 it comes in a silver case instead of the clear one, and its `cover` should be the Platinum insert (yellow, with the Platinum band). Every PS2 game has it, `false` until set |
| `caseColor` | `"#d8000f"` | optional: a case in another colour than its console's usual one (a red Wii case, a white Wii U one). It colours the plastic and the spine, and the spine's writing turns light or dark to suit. PS2 cases are blue by default; give the black ones `"#121212"` (only the plastic changes, the white paper spine stays) |
| `cartColor` | `"#f2c318"` | optional: a cartridge in its own colour (a yellow Pokémon Yellow, a black Game Boy Color cartridge). It colours the plastic all round; Game Boy and Game Boy Color cartridges are grey without it |
| `steelbook` | `true` | optional: a SteelBook (tin case). Drawn as metal with rounded corners and no plastic rim, its art to the edge, and a metal spine tinted in the cover's colour. Its `cover` is the tin's own art, not the box's, and `cover.back` (any game can have one) is a picture of its back, shown on the back of the case |
| `caseStyle` | `"ps4"` | optional: drawn in another console's case (a PS4 disc on the PS5 shelf) |
| `note` | `"No guitar controller"` | shown under the details |
| `fav` | `true` | optional: faces out on the shelf in "One cover per console" |
| `check` | | something still to confirm. Not shown on the site |
| `cover` | `{ "file": "covers/ps2/final-fantasy-x.jpg", … }` | the box art, or `null`. `"plain": true` marks a picture that is only the game's key art, not that console's box (the PS5 and Switch 2 pictures from Wikipedia): the case keeps its real size, the console's band is printed across the top and the art fills the rest |
| `colors` | `["#fcfcfc", …]` | taken from the cover. Some spines use them |

To add a game, copy an entry, change it, and set `cover` and `colors` to `null`. Then fetch its cover (below).

**PC games**: use `"console": "pc"` and add `"launcher"` (`steam`, `origin`, `ea`, `rockstar`, `battlenet`, `gog`, `ubisoft` or `none`). Add `"big": true` for a big-box release, `"mac": true` when it plays on a Mac too, and `"alsoDigital": true` for a disc that is also in the launcher's library.

**The Sims page** takes every game with a `"series"` (`"The Sims"`, `"The Sims 2"`, `"The Sims Stories"`, `"The Sims 3"`, `"The Sims Medieval"`, `"The Sims 4"`, `"SimCity"` or `"MySims"`), on any console. `"pack"` says what it is (`Base game`, `Collection`, `Expansion Pack`, `Game Pack`, `Stuff Pack`, `Kit`, `World` or `Extra`) and `"packCode"` gives The Sims 4's numbering (`EP01`, `GP04`, `SP12`). Serial keys are never kept here.

**The GTA page** reads `data/gta.json`: the eras, and in each its games with `copies` (ids from `games.json`) and `missing` (console ids, plus `psp` and `xsx` for Xbox Series X|S). When a missing version comes home, add it to `games.json` and move its id from `missing` to `copies`.

**The Sims want list** is `data/sims-wants.json`: the games and packs not in the collection yet, with the same `series`, `pack` and `packCode`, plus `platform` and an optional `note`. When one comes home, delete it there and add it to `games.json`.

## Cases and cartridges

Each case is drawn at its console's real height from `js/consoles.js`, so a DS case is shorter than a PS2 one and a PS3 case sits between them. A PS3 case is clear plastic with a faint blue tint, with the moulded strip across its top above the cover (the Blu-ray Disc logo and PLAYSTATION 3 raised in it), as on the real ones; the strip carries on over the top of the spine. The case is built around its cover scan: it takes its width from the scan, so the scan always shows whole and fills the front, with just the case's rim and hinge round it. Cardboard boxes (SNES, Game Boy) simply are their scan. A game without a scan gets its case's real width.

The cartridges and game cards (SNES, Game Boy, GBA, DS, 3DS, Switch, Switch 2) are drawn in `js/cases.js` with their real outlines and label areas. The label shows the box art without the console-name strip that Western boxes have down one side.

The SNES, Game Boy, Game Boy Color, GBA, DS, 3DS, Switch and Switch 2 cartridges are traced from photos of real ones: the SNES cartridge's ridged sides, grip and screws, with the Nintendo seal and the SNES logo either side of the art on its label; the Game Boy's corner notch, raised logo and side rails; the GBA's ledge with the arch moulded across it and its label printed like a real one, the box art small in the middle with the seal and the code either side; the DS and 3DS cards' cut corner and white label with the console's logo across the top (and the tab sticking out of the top of the 3DS card's right side); and the Switch cards' red band over the art and code strip under it. Each cartridge is a solid: its front and back are its real thickness apart (20 mm for the SNES, 8 mm for the Game Boys, under 4 mm for the cards), with edges that follow its outline, so it turns in the close-up like the cases do. The SNES, Game Boy, Game Boy Color and GBA cartridges show the opening in their bottom edge with the gold edge connector inside. The backs follow photos of real ones: the DS and 3DS cards' long window of 17 contacts at the bottom under the moulded Nintendo logo and model number, the Switch cards' five windows of contacts, the GBA's raised panel with *MODEL NO. AGB-002* and its screw at the top, the SNES cartridge's moulded warning and corner holes. The Game Boy back (logo, MADE IN JAPAN, the screw) follows its usual layout; no photo of one could be checked. Its contacts show only in the bottom edge. In a DS, 3DS or Switch case the card sits in the moulded holder at the top of the inside. The PlayStation and Xbox drawings in the console filter are traced from pictures of the real consoles in the same way.

## Covers

`tools/fetch-covers.mjs` looks for box art for every game whose `cover` is `null`. It downloads it into `covers/`, resizes it, and writes the file and its colours back into `games.json`:

```sh
cd tools && npm install
node fetch-covers.mjs --dry      # show what it would match
node fetch-covers.mjs            # download
node fetch-covers.mjs --only ps2-the-sims   # redo one game
node fetch-covers.mjs --recheck  # after changing regions: swap in the right region's box
node fetch-covers.mjs --upgrade-wiki   # swap Wikipedia pictures on PS4, PS5, Switch, Switch 2 and Xbox for real box scans
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

None of these collections cover PS4, PS5, Switch, Switch 2, Xbox One or most Xbox 360 games. Those come from [TheGamesDB](https://thegamesdb.net), which has real box scans release by release: the script takes the scan of the copy's own region (a PAL copy gets a British or Australian box, with the console's band across the top), else an English one from elsewhere, and the plain release before a special edition. If it picks the wrong release, set `"tgdbId"` on the game to the number in that release's TheGamesDB address (`game.php?id=121209`). PC games it can't find on the wikis come from TheGamesDB too. A wide picture there (a photo of the box) is skipped. What TheGamesDB lacks takes the box on the game's Wikipedia page, which is often key art or another console's box, so look at what comes back. A picture wider than a box (a store icon, a banner) is skipped, `"coverMatch"` names the page, and `"wikiCover": false` stops a wrong one coming back. A game with no cover shows a printed title card in the right case. The details of every game without a cover have a *Find the cover on Google Images* link that searches for the title, console and region. To add a cover by hand:
1. Save the image as `covers/<console>/<name>.jpg`.
2. Set `"cover": { "file": "covers/…", "source": "manual" }` on the game.
3. Run `node fetch-covers.mjs` in `tools/`. It measures the cover's shape, so it fits the case, and takes its colours for the spine. It does not change the image.

The script never replaces covers marked `manual`. A source with an API key, such as IGDB or TheGamesDB, would fill these consoles automatically. It needs a small server to keep the key private, which can come with the PHP side of the site.

## Files

- `index.html`, `css/site.css`, `js/app.js`: the page, the filter, the shelf, the grid, the list, the shelf ⇄ grid flight and the spotlight
- `css/cases.css`, `js/cases.js`: each console's case, spine, back, disc and cartridge
- `js/consoles.js`: the consoles with their real case sizes, the regions and the PC launchers
- `js/console-art.js`: the console drawings in the filter
- `legacy/`: the console drawings and cartridges as they were before the PlayStation, Xbox and cartridge redraw (the in-between versions are in the git history) (`legacy/console-art.js`, `legacy/cases.js`), and `legacy/index.html`, which shows each old one beside the one on the site now. Nothing on the site loads them
- `css/collection.css`, `js/collection.js`: what the collection pages' checklists share: the cases on their stretches of shelf, the meters, the want cards
- `sims.html`, `css/sims.css`, `js/sims.js`: the Sims collection page
- `data/sims-wants.json`: the Sims want list
- `gta.html`, `css/gta.css`, `js/gta.js`, `data/gta.json`: the Grand Theft Auto page
- `data/games.json`: the collection
- `covers/`: box art, one folder per console
- `tools/`: the cover fetcher, and `style-previews.mjs`, which builds the style prototype previews
- `prototypes/`, `assets/`: the four design prototypes
- `prototypes/styles/`: the style prototypes, their previews and their gallery
- `fonts/`: the self-hosted fonts: Orbitron and Exo 2 for the site, Fraunces and Space Grotesk for what is printed on the cases
