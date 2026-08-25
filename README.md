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
- **schedule** — artist / stage / day / start / end (times `null` until the festival publishes them — honesty over guesses)
- **map** — stylized vector features (stage areas, camping, water, paths) as lat/lon polygons, plus point **landmarks** ("meet at the dino")
- **meta** — sources, license, last-verified date, completeness flags

Packs are hand-maintained for now; importers (Clashfinder with license respect, MusicBrainz) are welcome contributions.

## Packs

| Festival | Year | Lineup | Set times | Map |
|---|---|---|---|---|
| [Lost Lands](packs/lost-lands/2026/festpack.json) | 2026 | ✅ partial (headliners by day) | ⏳ not yet published | ⏳ awaiting official map |
| [Bass Canyon](packs/bass-canyon/2026/festpack.json) | 2026 | ✅ full (3 stages × 3 days) | ✅ full (82/88 sets; 6 unpublished slots left `null`) | ⏳ awaiting official map |

## Contributing

1. Copy an existing pack as a template.
2. Fill what you know; leave what you don't as `null` — a partial pack beats no pack, and wrong data is worse than missing data.
3. Cite sources in `meta.sources`.
4. PR it. Set times usually drop days before the festival — fast-turnaround PRs that week are the most valuable contributions of all.

## License

- **Pack data** (`packs/`): **CC0-1.0** (public domain — [packs/LICENSE](packs/LICENSE)). Use it in anything, no attribution required. Contributing a pack means dedicating it under CC0.
- **Schema & tooling** (everything else): **MIT** ([LICENSE](LICENSE)).
