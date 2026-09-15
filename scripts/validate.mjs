#!/usr/bin/env node
// Validate festpacks: schedule sanity plus the events rules in docs/events.md.
//
//   node scripts/validate.mjs                 every packs/*/*/festpack.json
//   node scripts/validate.mjs <pack.json ...> just those
//   node scripts/validate.mjs --self-test     prove it rejects scripts/fixtures/bad-events.json
//
// Node only, no dependencies. Exit 1 on any error; warnings never fail.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const STATUSES = ['announced', 'tentative', 'cancelled']
const SLUG = /^[a-z0-9-]+$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const DAY_BEFORE = 3 // pre-parties and early entry
const DAY_AFTER = 1 // after-midnight sets on the last night

const isDate = (s) => typeof s === 'string' && DATE.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'))
const isTime = (s) => typeof s === 'string' && TIME.test(s)
const addDays = (date, n) => new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10)
const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))
// Minutes since 06:00: the night axis. A night runs 06:00–06:00; after-midnight sits at the end.
const onNight = (hhmm) => (minutes(hhmm) - 360 + 1440) % 1440
const expectedNight = (day, start) => (start && minutes(start) < 360 ? addDays(day, -1) : day)

export function validatePack(pack, label = 'pack') {
  const errors = []
  const warnings = []
  const err = (code, msg) => errors.push(`[${code}] ${msg}`)
  const warn = (code, msg) => warnings.push(`[${code}] ${msg}`)

  if (pack?.festpack !== '0.1') err('festpack', `festpack must be "0.1", got ${JSON.stringify(pack?.festpack)}`)
  const fest = pack?.festival ?? {}
  if (!isDate(fest.start) || !isDate(fest.end)) err('festival-dates', 'festival.start and festival.end must be ISO dates')
  const stageIds = new Set()
  for (const [i, s] of (pack?.stages ?? []).entries()) {
    if (typeof s?.id !== 'string' || !SLUG.test(s.id)) err('stage-id', `stages[${i}] id must match ${SLUG}`)
    else if (stageIds.has(s.id)) err('stage-dup', `stages[${i}] duplicate id "${s.id}"`)
    else stageIds.add(s.id)
  }
  const landmarkIds = new Set()
  for (const [i, l] of (pack?.map?.landmarks ?? []).entries()) {
    if (typeof l?.id !== 'string' || !SLUG.test(l.id)) err('landmark-id', `map.landmarks[${i}] id must match ${SLUG}`)
    else if (landmarkIds.has(l.id)) err('landmark-dup', `map.landmarks[${i}] duplicate id "${l.id}"`)
    else landmarkIds.add(l.id)
    if (l?.note !== undefined && typeof l.note !== 'string') err('landmark-note', `map.landmarks[${i}] note must be a string`)
  }

  // Schedule: the rules the format already implies.
  const artists = new Map() // lowercased -> pack spelling
  for (const [i, s] of (pack?.schedule ?? []).entries()) {
    const at = `schedule[${i}] (${JSON.stringify(s?.artist)} ${s?.day} ${s?.start ?? 'TBA'})`
    if (typeof s?.artist !== 'string' || !s.artist.trim()) err('set-artist', `${at}: artist must be a non-empty string`)
    else artists.set(s.artist.toLowerCase(), s.artist)
    if (!isDate(s?.day)) { err('set-day', `${at}: day must be an ISO date`); continue }
    if (s.stage !== null && s.stage !== undefined && !stageIds.has(s.stage)) err('set-stage', `${at}: stage "${s.stage}" is not in stages[]`)
    if (s.start != null && !isTime(s.start)) err('set-start', `${at}: start must be HH:MM or null`)
    if (s.end != null && !isTime(s.end)) err('set-end', `${at}: end must be HH:MM or null`)
    const start = isTime(s.start) ? s.start : null
    const end = isTime(s.end) ? s.end : null
    if (s.night !== undefined) {
      if (!isDate(s.night)) err('set-night', `${at}: night must be an ISO date`)
      else if (s.night !== expectedNight(s.day, start)) err('set-night', `${at}: night should be ${expectedNight(s.day, start)}, got ${s.night}`)
    } else if (start && minutes(start) < 360) {
      warn('set-night', `${at}: starts after midnight but has no night; consumers will bill it under ${s.day}`)
    }
    if (start && end) {
      if (onNight(end) <= onNight(start)) err('set-order', `${at}: end ${end} is not after start ${start}`)
      else if (minutes(end) < minutes(start) && s.end_day === undefined) warn('set-end-day', `${at}: runs past midnight without end_day`)
    }
    if (s.end_day !== undefined && (!isDate(s.end_day) || s.end_day !== addDays(s.day, 1))) err('set-end-day', `${at}: end_day must be the day after day`)
  }

  // Events.
  const events = pack?.events
  if (events !== undefined && !Array.isArray(events)) err('events', 'events must be an array when present')
  const ids = new Set()
  const lo = isDate(fest.start) ? addDays(fest.start, -DAY_BEFORE) : null
  const hi = isDate(fest.end) ? addDays(fest.end, DAY_AFTER) : null
  for (const [i, e] of (Array.isArray(events) ? events : []).entries()) {
    const at = `events[${i}]${typeof e?.id === 'string' ? ` "${e.id}"` : ''}`
    if (typeof e !== 'object' || e === null) { err('event', `${at}: must be an object`); continue }
    if (typeof e.id !== 'string' || !SLUG.test(e.id)) err('id', `${at}: id must match ${SLUG}`)
    else if (ids.has(e.id)) err('id-dup', `${at}: duplicate id`)
    else ids.add(e.id)
    if (typeof e.kind !== 'string' || !e.kind.trim()) err('kind', `${at}: kind must be a non-empty string`)
    if (typeof e.title !== 'string' || !e.title.trim()) err('title', `${at}: title must be a non-empty string`)

    const day = e.day === null ? null : e.day
    if (day !== null && !isDate(day)) err('day', `${at}: day must be an ISO date or null`)
    else if (day !== null && lo && hi && (day < lo || day > hi)) err('day-range', `${at}: day ${day} is outside ${lo}…${hi} (festival start-${DAY_BEFORE} … end+${DAY_AFTER})`)
    const start = e.start === null || e.start === undefined ? null : e.start
    if (start !== null && !isTime(start)) err('start', `${at}: start must be HH:MM or null`)
    if (start !== null && day === null) err('start-no-day', `${at}: start without a day`)
    const end = e.end === null || e.end === undefined ? null : e.end
    if (end !== null && !isTime(end)) err('end', `${at}: end must be HH:MM or null`)
    if (isTime(start) && isTime(end) && onNight(end) <= onNight(start)) err('end-order', `${at}: end ${end} is not after start ${start}`)
    if (end !== null && start === null) err('end-no-start', `${at}: end without a start`)

    const night = e.night === undefined ? null : e.night
    if (isTime(start) && isDate(day)) {
      if (night === null) err('night', `${at}: night is required when start is set (expected ${expectedNight(day, start)})`)
      else if (night !== expectedNight(day, start)) err('night', `${at}: night should be ${expectedNight(day, start)}, got ${night}`)
    } else if (night !== null) {
      if (!isDate(night)) err('night', `${at}: night must be an ISO date or null`)
      else if (day === null) err('night', `${at}: night set on an all-festival item`)
      else if (night !== day) err('night', `${at}: night should equal day ${day} when there is no start, got ${night}`)
    }

    const loc = e.location
    if (typeof loc !== 'object' || loc === null) err('location', `${at}: location is required`)
    else {
      if (typeof loc.text !== 'string' || !loc.text.trim()) err('location-text', `${at}: location.text must be non-empty`)
      if (loc.stage != null && !stageIds.has(loc.stage)) err('location-stage', `${at}: location.stage "${loc.stage}" is not in stages[]`)
      if (loc.landmark != null && !landmarkIds.has(loc.landmark)) err('location-landmark', `${at}: location.landmark "${loc.landmark}" is not in map.landmarks[]`)
    }
    if (e.host != null) {
      if (typeof e.host !== 'object') err('host', `${at}: host must be an object or null`)
      else if (typeof e.host.name !== 'string' || !e.host.name.trim()) err('host', `${at}: host.name must be non-empty`)
      else if (e.host.handle !== undefined && !/^@\S+$/.test(e.host.handle)) err('host', `${at}: host.handle must start with @`)
    }
    if (e.artist != null) {
      if (typeof e.artist !== 'string') err('artist', `${at}: artist must be a string or null`)
      else if (!artists.has(e.artist.toLowerCase())) warn('artist', `${at}: artist "${e.artist}" matches no schedule row`)
      else if (artists.get(e.artist.toLowerCase()) !== e.artist) warn('artist', `${at}: artist "${e.artist}" is spelled "${artists.get(e.artist.toLowerCase())}" in the schedule`)
    }
    if (e.series != null && (typeof e.series !== 'string' || !SLUG.test(e.series))) err('series', `${at}: series must match ${SLUG} or be null`)
    if (e.description !== undefined && typeof e.description !== 'string') err('description', `${at}: description must be a string`)
    if (!STATUSES.includes(e.status)) err('status', `${at}: status must be one of ${STATUSES.join(', ')}, got ${JSON.stringify(e.status)}`)
    const url = e.source?.url
    if (url != null && !/^https?:\/\/\S+$/.test(url)) err('source-url', `${at}: source.url must be an http(s) URL`)
    if (e.status === 'announced' && !url) err('source', `${at}: announced entries need source.url`)
    if (e.source?.seen != null && !isDate(e.source.seen)) err('source-seen', `${at}: source.seen must be an ISO date`)
  }
  return { label, errors, warnings, sets: pack?.schedule?.length ?? 0, events: Array.isArray(events) ? events.length : 0 }
}

function allPacks() {
  const out = []
  const packs = join(ROOT, 'packs')
  for (const fest of readdirSync(packs)) {
    const d = join(packs, fest)
    if (!statSync(d).isDirectory()) continue
    for (const year of readdirSync(d)) {
      const f = join(d, year, 'festpack.json')
      try { if (statSync(f).isFile()) out.push(f) } catch { /* no pack there */ }
    }
  }
  return out.sort()
}

function report(r) {
  const rel = r.label.startsWith(ROOT) ? r.label.slice(ROOT.length + 1) : r.label
  if (r.errors.length) {
    console.log(`FAIL ${rel}: ${r.errors.length} error${r.errors.length === 1 ? '' : 's'}`)
    for (const e of r.errors) console.log(`  ${e}`)
  } else {
    console.log(`ok   ${rel} (${r.sets} sets, ${r.events} events)`)
  }
  if (r.warnings.length) {
    console.log(`  ${r.warnings.length} warning${r.warnings.length === 1 ? '' : 's'}:`)
    for (const w of r.warnings) console.log(`  warn ${w}`)
  }
}

function selfTest() {
  const fixture = join(ROOT, 'scripts', 'fixtures', 'bad-events.json')
  const r = validatePack(JSON.parse(readFileSync(fixture, 'utf8')), fixture)
  report(r)
  // Every rule the fixture is built to trip, by code. The fixture's own
  // `expect` array lists them so the two files stay in step.
  const expected = JSON.parse(readFileSync(fixture, 'utf8')).expect
  const missed = expected.filter((code) => !r.errors.some((e) => e.startsWith(`[${code}]`)))
  const missedWarn = (JSON.parse(readFileSync(fixture, 'utf8')).expectWarnings ?? []).filter((code) => !r.warnings.some((w) => w.startsWith(`[${code}]`)))
  const good = validatePack({
    festpack: '0.1',
    festival: { start: '2026-09-18', end: '2026-09-20' },
    stages: [{ id: 'crater', name: 'The Crater' }],
    schedule: [{ artist: 'Late Act', stage: 'crater', day: '2026-09-19', start: '00:30', end: '01:30', night: '2026-09-18' }],
    map: { landmarks: [{ id: 'triceratops', name: 'Triceratops', lat: null, lon: null, note: 'outside The Crater' }] },
    events: [
      { id: 'mg-late-act-fri', kind: 'meet-greet', title: 'Late Act meet & greet', day: '2026-09-19', start: '01:45', end: '02:15', night: '2026-09-18', location: { text: 'the triceratops', stage: 'crater', landmark: 'triceratops' }, host: { name: 'Late Act', handle: '@lateact', platform: 'instagram' }, artist: 'Late Act', series: null, status: 'announced', source: { url: 'https://example.com/p/1', seen: '2026-09-15' } },
      { id: 'sq-all-weekend', kind: 'side-quest', title: 'Egg hunt', day: null, start: null, end: null, night: null, location: { text: 'everywhere', stage: null, landmark: null }, host: null, artist: null, series: null, status: 'tentative', source: { url: null } },
      { id: 'mu-tba-sat', kind: 'meetup', title: 'Time TBD', day: '2026-09-19', start: null, night: '2026-09-19', location: { text: 'somewhere' }, status: 'announced', source: { url: 'https://example.com/p/2' } },
    ],
    meta: {},
  }, 'good-inline-pack')
  console.log()
  report(good)
  const ok = missed.length === 0 && missedWarn.length === 0 && good.errors.length === 0 && good.warnings.length === 0
  if (missed.length) console.log(`self-test: fixture should have tripped ${missed.join(', ')}`)
  if (missedWarn.length) console.log(`self-test: fixture should have warned ${missedWarn.join(', ')}`)
  if (good.errors.length || good.warnings.length) console.log('self-test: the good inline pack should be clean')
  console.log(ok ? `self-test: ok (${r.errors.length} errors and ${r.warnings.length} warnings caught, ${expected.length} rules covered)` : 'self-test: FAILED')
  return ok
}

const args = process.argv.slice(2)
if (args.includes('--self-test')) {
  process.exit(selfTest() ? 0 : 1)
} else {
  const files = args.length ? args.map((a) => resolve(a)) : allPacks()
  let failed = 0
  for (const f of files) {
    let pack
    try { pack = JSON.parse(readFileSync(f, 'utf8')) } catch (e) { console.log(`FAIL ${f}: ${e.message}`); failed++; continue }
    const r = validatePack(pack, f)
    report(r)
    if (r.errors.length) failed++
  }
  console.log(failed ? `\n${failed} of ${files.length} pack${files.length === 1 ? '' : 's'} failed` : `\nall ${files.length} pack${files.length === 1 ? '' : 's'} ok`)
  process.exit(failed ? 1 : 0)
}
