#!/usr/bin/env node
/**
 * Regenerate src/content/rome/canonicalWalkingLegs.json from the Rome manifest.
 * Does NOT call Mapbox or any paid API — uses authored stop coordinates only.
 *
 * Usage: node scripts/generate-rome-canonical-legs.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(
  readFileSync(join(root, 'src/content/rome/manifest.json'), 'utf8'),
)
const tourId = manifest.id ?? 'rome'
const sequences = manifest.journey?.sequences ?? {}
const waypoints = manifest.waypoints ?? {}

function haversineM(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

function bearingLabel(from, to) {
  const CARDINALS = [
    'north',
    'northeast',
    'east',
    'southeast',
    'south',
    'southwest',
    'west',
    'northwest',
  ]
  const lat1 = (from.lat * Math.PI) / 180
  const lat2 = (to.lat * Math.PI) / 180
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180
  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  return CARDINALS[Math.round(bearing / 45) % 8]
}

function formatDistance(m) {
  const meters = Math.round(m)
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function waypointPoint(id) {
  const w = waypoints[id]
  const g = w?.geofence
  if (!g || g.lat == null || g.lng == null) return null
  return {
    id,
    title: w.title || w.name || id,
    lat: g.lat,
    lng: g.lng,
  }
}

function buildLeg(fromId, toId) {
  const from = waypointPoint(fromId)
  const to = waypointPoint(toId)
  if (!from || !to) return null
  const straightM = haversineM(from, to)
  const distanceM = Math.max(20, Math.round(straightM * 1.3))
  const durationSec = Math.max(30, Math.round(distanceM / 1.25))
  const bearing = bearingLabel(from, to)
  const distLabel = formatDistance(distanceM)
  const steps = [
    {
      instruction: `Head ${bearing} toward ${to.title} — about ${distLabel}.`,
      distanceM: Math.round(distanceM * 0.85),
      durationSec: Math.round(durationSec * 0.85),
      type: 'depart',
      streetName: to.title,
    },
    {
      instruction: `Continue toward ${to.title}.`,
      distanceM: Math.round(distanceM * 0.15),
      durationSec: Math.round(durationSec * 0.15),
      type: 'continue',
      streetName: to.title,
    },
    {
      instruction: `Arrive at ${to.title}.`,
      distanceM: 0,
      durationSec: 0,
      type: 'arrive',
      streetName: to.title,
    },
  ]
  const coordinates = []
  const segments = 8
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    coordinates.push([
      from.lng + (to.lng - from.lng) * t,
      from.lat + (to.lat - from.lat) * t,
    ])
  }
  return {
    fromId,
    toId,
    from: { lat: from.lat, lng: from.lng },
    to: { lat: to.lat, lng: to.lng },
    fromTitle: from.title,
    toTitle: to.title,
    distanceM,
    durationSec,
    geometry: { type: 'LineString', coordinates },
    steps,
  }
}

function waypointSequence(seq) {
  return seq.filter((id) => waypoints[id]?.geofence)
}

const legsByKey = new Map()
const routeSummaries = []

for (const [pathKey, seq] of Object.entries(sequences)) {
  const stopIds = waypointSequence(seq)
  const pathLegs = []
  for (let i = 0; i < stopIds.length - 1; i += 1) {
    const fromId = stopIds[i]
    const toId = stopIds[i + 1]
    const key = `${fromId}->${toId}`
    if (!legsByKey.has(key)) {
      const leg = buildLeg(fromId, toId)
      if (leg) legsByKey.set(key, leg)
    }
    if (legsByKey.has(key)) pathLegs.push(key)
  }
  routeSummaries.push({ pathKey, stopIds, legKeys: pathLegs })
}

const package_ = {
  version: 'rome-canonical-legs-v1',
  tourId,
  cityId: 'rome',
  generatedAt: new Date().toISOString().slice(0, 10),
  source: 'authored-stop-coordinates',
  note:
    'Milestone 1 offline fallback. Geometry is stop-to-stop guidance (not Mapbox street routing). Online Mapbox Directions remains preferred when available.',
  routes: routeSummaries,
  legs: Object.fromEntries(legsByKey),
}

const outPath = join(root, 'src/content/rome/canonicalWalkingLegs.json')
writeFileSync(outPath, `${JSON.stringify(package_, null, 2)}\n`)
console.log(`Wrote ${outPath} (${legsByKey.size} legs)`)
