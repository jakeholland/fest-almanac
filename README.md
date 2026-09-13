# fest-almanac

**An open almanac of music festivals: lineups, set times, stages, and venue maps — as data.**

Every festival, every year, one **festpack**: a JSON bundle any app or device can load. Phone apps, festival badges, off-grid gadgets, spreadsheets — the almanac doesn't care what reads it.

> Born to feed [Firefly](https://github.com/jakeholland/firefly), an off-grid festival friend-compass — but deliberately independent. If your project needs festival data, it's yours too.

## Why

There is no open, multi-festival source of set times and venue geometry. Clashfinder has community set-time grids (hosted, CC BY-NC), iBurn has a beautiful per-year data pipeline (one festival), the conference world has schedule.xml (never adopted by music festivals). fest-almanac fills the gap: **per-festival, per-year packs, maintained by the people who go.**

## The festpack format

One `festpack.json` per festival per year. Draft v0.1 — see [`schema/festpack.schema.json`](schema/festpack.schema.json):

- **festival** — name, slug, year, dates, timezone, venue location
- **stages** — id, display name, color
- **schedule** — artist / stage / day / start / end (times `null` until the festival publishes them — honesty over guesses). `day`, `start`, and `end` are plain ISO — calendar dates and `HH:MM` clock times, never hours past 24. Two optional fields disambiguate sets that cross midnight: `night` — the festival night a set is billed under (equal to `day`, except a set that starts after midnight belongs to the *previous* day's night; consumers should group lineups by `night`, not `day`) — and `end_day` — the calendar date of `end` when it differs from `day` (a set that starts before midnight and runs past it).
- **map** — stylized vector features (stage areas, camping, water, paths) as lat/lon polygons, plus point **landmarks** ("meet at the dino")
- **meta** — sources, license, last-verified date, completeness flags

Packs are hand-maintained for now; importers (Clashfinder with license respect, MusicBrainz) are welcome contributions.

## Packs

| Festival | Year | Lineup | Set times | Map |
|---|---|---|---|---|
| [Lost Lands](packs/lost-lands/2026/festpack.json) | 2026 | ✅ partial (headliners by day) | ✅ full (222/222 starts; 221 end times from the official app) | ✅ stylized (all six festival-ground stages pinned on imagery; Grove approx.; entrance, first aid, glamping approx.; venue extent, treeline unverified; campgrounds unplaced) |
| [Bass Canyon](packs/bass-canyon/2026/festpack.json) | 2026 | ✅ full (3 stages × 3 days) | ✅ full (82/88 sets; 6 unpublished slots left `null`) | ⏳ awaiting official map |
| [Sacred Acre](packs/sacred-acre/2026/festpack.json) | 2026 | ✅ full (3 stages × 3 days) | ✅ full (39/39 sets; start times only) | ✅ stylized (venue + roads from borough records; camping parcels inferred; River Stage approx. point; rest unplaced) |
| [Nocturnal Wonderland](packs/nocturnal-wonderland/2026/festpack.json) | 2026 | ✅ full (5 stages × 2 days) | ✅ full (86/86 sets) | ⏳ awaiting official map |
| [Wakaan](packs/wakaan/2026/festpack.json) | 2026 | ✅ full (62 acts; days unannounced) | ⏳ none (expected week of Oct 1) | ⏳ awaiting official map |
| [BOO Seattle](packs/boo-seattle/2026/festpack.json) | 2026 | ✅ full (24/day; stages unannounced) | ⏳ none (expected ~Oct 26–29) | ⏳ awaiting official map |
| [EDC Orlando](packs/edc-orlando/2026/festpack.json) | 2026 | ✅ full (36/day; stages unannounced) | ⏳ none (expected late Oct) | ⏳ awaiting official map |
| [Cyclops Cove](packs/cyclops-cove/2026/festpack.json) | 2026 | ✅ full (per-day; stages unannounced) | ⏳ none (expected late Nov) | ⏳ awaiting official map |

## Contributing

1. Copy an existing pack as a template.
2. Fill what you know; leave what you don't as `null` — a partial pack beats no pack, and wrong data is worse than missing data.
3. Cite sources in `meta.sources`.
4. PR it. Set times usually drop days before the festival — fast-turnaround PRs that week are the most valuable contributions of all.

## Sourcing rules — what's clean, what isn't

Packs are **CC0**, so everything in them must be either a fact or public-domain.
The line is **fact vs. expression**:

**Fair game — facts, from any official source.**
Set times, lineup, who-plays-where-when, and the *position* of a stage or
landmark are all facts, not copyrightable. Read them off whatever the festival
publishes — the set-times **poster**, a graphic schedule, a lineup graphic, an
app screenshot. Reading a fact off a copyrighted image doesn't copy the image.
Cross-check two sources where you can; where a fact isn't published, leave it
`null` (a wrong time is worse than a missing one).

**Also fair game — a graphic/poster map as a *positional reference*.**
Use the official illustrated map to learn *relative topology* — which shape is
the pond, that Wompy Woods sits past it, where a stage falls relative to the
main field. That layout is fact.

**Not fair game — the artwork or the compilation itself.**
- Don't trace the illustrated map's linework into `polygon` coordinates, and
  don't redistribute the poster/map image. For real geometry, trace
  **public-domain aerials** (USGS/NAIP for the US) and use the graphic map only
  to disambiguate which feature is which.
- Don't bulk-extract a festival app's or vendor's schedule API (Aloompa,
  DoStuff, etc.), even though the times it returns are facts — the *method*
  breaks the vendor's ToS and taints the pack's provenance. Read the published
  human-facing source instead.
- OSM data is **ODbL**, incompatible with CC0 — don't trace or import it.
  Clashfinder grids are **CC BY-NC** — importable only with license respect
  (which CC0 can't provide), so treat them as a cross-check, not a source.

When in doubt: is this a *fact I read*, or an *expression I copied*? The first
is clean; the second isn't.

## License

- **Pack data** (`packs/`): **CC0-1.0** (public domain — [packs/LICENSE](packs/LICENSE)). Use it in anything, no attribution required. Contributing a pack means dedicating it under CC0.
- **Schema & tooling** (everything else): **MIT** ([LICENSE](LICENSE)).
