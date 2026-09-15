# Events — meet & greets, meetups, workshops, side quests

A festpack's `schedule` is the sets. `events` is everything else with a time
and a place: an artist signing at the triceratops, a kandi trade under the
long-neck, a flow workshop in the campground, an egg hunt that runs all
weekend. Optional and additive — a pack without `events` is complete, and a
consumer that never reads it loses nothing.

Every entry is a **fact someone announced**, with the announcing post linked.
Fan sweeps are how you find them; the post is the citation.

## Shape

```jsonc
{
  "id": "mg-2dy4-sat",              // pack-unique, [a-z0-9-], stable across edits
  "kind": "meet-greet",             // see vocabulary below
  "title": "2DY4 meet & greet",
  "day": "2026-09-19",              // calendar date; null = the whole festival
  "start": "15:45",                 // HH:MM local; null = announced for the day, time TBD
  "end": null,                      // optional; consumers assume ~30 min
  "night": "2026-09-19",            // same rule as schedule; required when start is set
  "location": {
    "text": "the triceratops right outside The Crater",   // always present
    "stage": "crater",              // optional: nearest stage id, only when the host named one
    "landmark": "triceratops"       // optional: map.landmarks id
  },
  "host": { "name": "2DY4", "handle": "@2dy4music", "platform": "instagram" },
  "artist": "2DY4",                 // exact schedule artist string, only for the artist's own thing
  "series": null,                   // groups repeats across days
  "description": "Goodie bags, photos and a chat. Right after her Crater set.",
  "status": "announced",            // announced | tentative | cancelled
  "source": { "url": "https://www.instagram.com/p/DdKllWIj3zQ/", "seen": "2026-09-15" }
}
```

Ids follow `<kind prefix>-<host slug>-<day>`: `mg-` meet & greet, `mu-`
meetup, `ws-` workshop, `ac-` activity, `sq-` side quest; `wed`/`thu`/`fri`/
`sat`/`sun`, dropped for all-festival items. Never renumber: consumers key
picks and calendar entries on the id.

## Kinds

Open vocabulary. These six are the known ones; a pack may use another string,
and consumers must show an unknown kind plainly rather than drop it.

| kind | what it is |
|---|---|
| `meet-greet` | an artist meeting fans — run by the artist or their team |
| `meetup` | a fan or community gathering: a crew, a trade circle, a flow jam |
| `workshop` | someone teaching something: flow arts, gloving, kandi |
| `activity` | a one-off timed thing to do: a 5K, a giveaway, a chess game |
| `side-quest` | a hunt or game that runs across the grounds: hidden eggs, tokens, a bingo grid |
| `official` | put on by the festival itself |

Rules of thumb: who runs it decides `meet-greet` vs `meetup`; a timed giveaway
is an `activity`, an untimed hunt is a `side-quest`.

## Time

Same rules as `schedule`:

- **Local wall time**, `HH:MM`, in the pack's `festival.timezone`. Never hours
  past 24.
- **`night`** is the festival night the entry belongs to. It equals `day`,
  except that anything starting after midnight (before 06:00) belongs to the
  *previous* day's night. Required whenever `start` is set. A 12:00 AM gloving
  meetup on "Friday night" is `day: "2026-09-19"`, `start: "00:00"`,
  `night: "2026-09-18"`.
- **`start: null`** with a `day` means "announced for that day, no time yet".
  Legitimate and common. Set `night` to the day.
- **`day: null` with `start: null`** means it runs the whole festival — an egg
  hunt, a token trail. `night` is null too.
- **`end`** is optional. Leave it out when the host didn't say; consumers
  assume about half an hour. It may be earlier on the clock than `start` when
  the thing runs past midnight.
- **Never guess a time.** "Around 5" is `start: null`. A wrong meetup time
  strands people at a dinosaur.

`day` may fall up to three days before `festival.start` (pre-parties, early
entry) and one day after `festival.end` (after-midnight on the last night).

## Where

`location.text` is always present and is what a person reads: "the
stegosaurus between Wompy Woods and Subsidia". Add `location.stage` only when
the host named a stage as the reference, and `location.landmark` only when the
place is unambiguously one of `map.landmarks`. Don't infer either: a wrong pin
is worse than none.

When a host names a landmark the map lacks, add it to `map.landmarks` with
`lat`/`lon` null and a `note` saying where it is in words. Someone with a GPS
can place it later.

## Sourcing

- **Announced by the host or the organiser.** A fan account saying "I heard
  there's a Crankdat meet & greet" is a lead, not an entry.
- **`source.url` is the announcing post** and is required for anything
  `announced`. `source.seen` is when you last checked it.
- **`description` is your own paraphrase**, at most a sentence or two: what
  happens, what to bring, the set it follows. Names of things (a "dino egg
  sprout") are fine; the post's wording is not. Facts are CC0, the post's text
  and images are the host's.
- **`host`** is the account as it presents itself: display name, `@handle`,
  platform. `null` when you genuinely don't know who is behind it.
- **`artist`** is the exact schedule artist string (the pack's spelling,
  `Tynan` not `TYNAN`), and only for the artist's own meet & greet or activity.
  A fan meetup timed to someone's set mentions the set in `description`
  instead.
- **Recurring things** get one entry per occurrence sharing a `series`, so a
  consumer can show "Bloom Rave Co. ×3" or one row per day as it likes.

## Status

- `announced` — the host said when and where. `source.url` required.
- `tentative` — teased without a time, a place, or a day; or the time is
  inferred from something like "during X's set".
- `cancelled` — the host pulled it. **Cancel, don't delete**: a consumer that
  cached the entry can then tell its user why it vanished. Keep the original
  time and place so the row still reads.

## One of each

```json
{
  "id": "mg-future-exit-fri", "kind": "meet-greet", "title": "Future Exit meet & greet",
  "day": "2026-09-18", "start": "19:15", "end": null, "night": "2026-09-18",
  "location": { "text": "the velociraptor, the wooden structure next to the Subsidia Stage", "stage": "subsidia", "landmark": "velociraptor" },
  "host": { "name": "Future Exit", "handle": "@futureexit", "platform": "instagram" },
  "artist": "Future Exit", "series": null,
  "description": "Stickers and photos right after his Subsidia set.",
  "status": "announced", "source": { "url": "https://www.instagram.com/p/DdPFgCzFDzc/", "seen": "2026-09-15" }
}
```

```json
{
  "id": "mu-bloom-rave-co-sat", "kind": "meetup", "title": "Bloom Rave Co. meetup",
  "day": "2026-09-19", "start": "16:00", "end": null, "night": "2026-09-19",
  "location": { "text": "by the left leg of the T-Rex, between Subsidia and the food vendors", "stage": null, "landmark": "t-rex" },
  "host": { "name": "Bloom Rave Co.", "handle": "@bloomraveco", "platform": "instagram" },
  "artist": null, "series": "bloom-rave-co",
  "description": "Kandi and trinket trading; bring mini dino eggs. Same spot Friday and Sunday.",
  "status": "announced", "source": { "url": "https://www.instagram.com/p/DdKjYsxAS1I/", "seen": "2026-09-15" }
}
```

```json
{
  "id": "ws-trippy-squid-raver-fri", "kind": "workshop", "title": "Flowstar workshop",
  "day": "2026-09-18", "start": "15:30", "end": "16:30", "night": "2026-09-18",
  "location": { "text": "the Discovery Center in the campgrounds", "stage": null, "landmark": "discovery-center" },
  "host": { "name": "Trippy Squid Raver", "handle": "@trippysquidraver", "platform": "instagram" },
  "artist": null, "series": null,
  "description": "An hour of flow-prop teaching before the gates.",
  "status": "announced", "source": { "url": "https://www.instagram.com/p/DdSX-WemXXj/", "seen": "2026-09-15" }
}
```

```json
{
  "id": "ac-the-social-function-sat", "kind": "activity", "title": "Raver Run Club 5K",
  "day": "2026-09-19", "start": "10:00", "end": null, "night": "2026-09-19",
  "location": { "text": "The Grove, in the campground", "stage": "grove", "landmark": null },
  "host": { "name": "The Social Function", "handle": "@thesocialfunction_", "platform": "instagram" },
  "artist": null, "series": null,
  "description": "Free community 5K, not affiliated with the festival. Sprouts for the first twenty.",
  "status": "announced", "source": { "url": "https://www.instagram.com/p/DdRDmonkeoT/", "seen": "2026-09-15" }
}
```

```json
{
  "id": "sq-great-dino-egg-hunt", "kind": "side-quest", "title": "Great Dino Egg Hunt",
  "day": null, "start": null, "end": null, "night": null,
  "location": { "text": "hidden across the festival grounds", "stage": null, "landmark": null },
  "host": { "name": "Bass Head Beads", "handle": "@bass.head.beads", "platform": "instagram" },
  "artist": null, "series": null,
  "description": "A hundred 3D-printed eggs hidden all weekend, with clues posted by @bass.head.beads and @kandiesworld.",
  "status": "announced", "source": { "url": "https://www.instagram.com/p/DdP94TPGtRk/", "seen": "2026-09-15" }
}
```

```json
{
  "id": "of-opening-ceremony-fri", "kind": "official", "title": "Opening ceremony",
  "day": "2026-09-18", "start": "13:45", "end": "14:00", "night": "2026-09-18",
  "location": { "text": "Prehistoric Stage", "stage": "prehistoric", "landmark": null },
  "host": { "name": "Lost Lands", "handle": "@lostlandsfestival", "platform": "instagram" },
  "artist": null, "series": null,
  "description": "The festival's own kickoff before the first Prehistoric set.",
  "status": "tentative", "source": { "url": "https://www.instagram.com/lostlandsfestival/", "seen": "2026-09-15" }
}
```

(The `official` example is illustrative — Lost Lands 2026 has no such entry
yet.)

## Checking your work

```
node scripts/validate.mjs                      # every pack
node scripts/validate.mjs packs/lost-lands/2026/festpack.json
node scripts/validate.mjs --self-test          # proves the validator catches the bad fixture
```

The validator fails on a duplicate or malformed id, a `day` outside the
window, a missing or wrong `night`, an `end` before `start`, an unresolved
`location.stage` or `location.landmark`, an `announced` entry with no
`source.url`, or a `status` outside the three values. It warns, without
failing, when `artist` matches no schedule row — spellings drift.
