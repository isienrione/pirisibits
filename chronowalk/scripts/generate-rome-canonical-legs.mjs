#!/usr/bin/env node
/**
 * Rome canonical walking legs generator / capturer.
 *
 * Modes:
 *   (default)              Validate + report the committed package. NO network.
 *   --scaffold-only        Write temporary straight-line fallbacks for missing
 *                          legs only. Preserves existing valid Mapbox legs.
 *                          NO network.
 *   --fetch-mapbox         ONE-TIME capture: Mapbox walking Directions for
 *                          legs that are not yet valid real walking routes.
 *                          Max = number of incomplete canonical legs (≤21).
 *   --force                With --fetch-mapbox, re-fetch even valid legs
 *                          (still only the canonical set — never more).
 *
 * Token loading (never printed / never committed):
 *   process.env.VITE_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN
 *   or chronowalk/.env / .env.local (same keys)
 *
 * Usage examples:
 *   node scripts/generate-rome-canonical-legs.mjs
 *   node scripts/generate-rome-canonical-legs.mjs --scaffold-only
 *   node scripts/generate-rome-canonical-legs.mjs --fetch-mapbox
 *
 * DO NOT run --fetch-mapbox unless explicitly approved (paid Directions calls).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  GEOMETRY_KIND_MAPBOX_WALKING,
  GEOMETRY_KIND_TEMPORARY,
  LEG_SOURCE_AUTHORED_STOPS,
  LEG_SOURCE_MAPBOX,
  assessCanonicalWalkingPackage,
  haversineMeters,
  isRealWalkingLeg,
  normalizeLineStringGeometry,
  validateCanonicalWalkingLeg,
} from '../src/navigation/canonicalWalkingLegValidation.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(root, 'src/content/rome/canonicalWalkingLegs.json')
const reportPath = join(root, 'src/content/rome/canonicalWalkingLegs.report.json')

const args = new Set(process.argv.slice(2))
const FETCH_MAPBOX = args.has('--fetch-mapbox')
const SCAFFOLD_ONLY = args.has('--scaffold-only')
const FORCE = args.has('--force')
const WRITE_REPORT = args.has('--write-report') || FETCH_MAPBOX || SCAFFOLD_ONLY

if (FETCH_MAPBOX && SCAFFOLD_ONLY) {
  console.error('Use either --fetch-mapbox or --scaffold-only, not both.')
  process.exit(2)
}

const PRODUCT_DEBT_REASON =
  'Temporary stop-coordinate fallback only — not a pedestrian street route. Replace via --fetch-mapbox.'

function readEnvFile(name) {
  const path = join(root, name)
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function loadMapboxToken() {
  const fileEnv = { ...readEnvFile('.env'), ...readEnvFile('.env.local') }
  const token =
    process.env.VITE_MAPBOX_TOKEN ||
    process.env.MAPBOX_ACCESS_TOKEN ||
    fileEnv.VITE_MAPBOX_TOKEN ||
    fileEnv.MAPBOX_ACCESS_TOKEN ||
    ''
  if (!token || /^your_mapbox/i.test(token) || /^pk\.your_mapbox/i.test(token)) {
    return null
  }
  return token
}

function loadExistingPackage() {
  if (!existsSync(outPath)) return null
  try {
    return JSON.parse(readFileSync(outPath, 'utf8'))
  } catch {
    return null
  }
}

const manifest = JSON.parse(
  readFileSync(join(root, 'src/content/rome/manifest.json'), 'utf8'),
)
const tourId = manifest.id ?? 'rome'
const sequences = manifest.journey?.sequences ?? {}
const waypoints = manifest.waypoints ?? {}
const transits = manifest.transits ?? {}

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

function buildTemporaryLeg(fromId, toId) {
  const from = waypointPoint(fromId)
  const to = waypointPoint(toId)
  if (!from || !to) return null

  const straightM = haversineMeters(from, to) ?? 0
  const distanceMeters = Math.max(20, Math.round(straightM * 1.3))
  const durationSeconds = Math.max(30, Math.round(distanceMeters / 1.25))
  const bearing = bearingLabel(from, to)
  const distLabel = formatDistance(distanceMeters)

  return {
    originStopId: fromId,
    destinationStopId: toId,
    fromId,
    toId,
    from: { lat: from.lat, lng: from.lng },
    to: { lat: to.lat, lng: to.lng },
    fromTitle: from.title,
    toTitle: to.title,
    distanceMeters,
    durationSeconds,
    distanceM: distanceMeters,
    durationSec: durationSeconds,
    geometry: {
      type: 'LineString',
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
    },
    geometryKind: GEOMETRY_KIND_TEMPORARY,
    source: LEG_SOURCE_AUTHORED_STOPS,
    productDebt: true,
    productDebtReason: PRODUCT_DEBT_REASON,
    validationStatus: 'temporary_fallback',
    steps: [
      {
        instruction: `Head ${bearing} toward ${to.title} — about ${distLabel}.`,
        distanceM: Math.round(distanceMeters * 0.85),
        durationSec: Math.round(durationSeconds * 0.85),
        type: 'depart',
        streetName: to.title,
      },
      {
        instruction: `Continue toward ${to.title}.`,
        distanceM: Math.round(distanceMeters * 0.15),
        durationSec: Math.round(durationSeconds * 0.15),
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
    ],
  }
}

function waypointSequence(seq) {
  return seq.filter((id) => waypoints[id]?.geofence)
}

/**
 * Build required walking legs from journey sequences.
 *
 * Transit items with travel_mode === 'ride' (e.g. t22 Castel → Via Appia encore)
 * are NOT collapsed into a walking leg — they become optionalRideTransitions.
 */
function collectCanonicalLegKeys() {
  const legsByKey = new Map()
  const routeSummaries = []
  const optionalRideByKey = new Map()

  for (const [pathKey, seq] of Object.entries(sequences)) {
    const stopIds = waypointSequence(seq)
    const pathLegs = []
    let lastWaypointId = null
    /** @type {null | { id: string, travel_mode?: string, eta_label?: string, title?: string, duration_s?: number }} */
    let pendingRide = null

    for (const id of seq) {
      if (waypoints[id]?.geofence) {
        if (lastWaypointId) {
          const key = `${lastWaypointId}->${id}`
          if (pendingRide) {
            if (!optionalRideByKey.has(key)) {
              optionalRideByKey.set(key, {
                originStopId: lastWaypointId,
                destinationStopId: id,
                fromId: lastWaypointId,
                toId: id,
                transitId: pendingRide.id,
                travelMode: pendingRide.travel_mode || 'ride',
                etaLabel: pendingRide.eta_label || null,
                title: pendingRide.title || null,
                durationSeconds: pendingRide.duration_s ?? null,
                reason:
                  'Authored as a non-walking / ride transition (optional encore). Not part of the offline walking-leg package.',
              })
            }
          } else {
            if (!legsByKey.has(key)) {
              legsByKey.set(key, { fromId: lastWaypointId, toId: id })
            }
            pathLegs.push(key)
          }
        }
        lastWaypointId = id
        pendingRide = null
        continue
      }

      const transit = transits[id]
      if (transit && transit.travel_mode === 'ride') {
        pendingRide = { id, ...transit }
      }
    }

    routeSummaries.push({ pathKey, stopIds, legKeys: pathLegs })
  }

  return {
    legsByKey,
    routeSummaries,
    expectedKeys: [...legsByKey.keys()],
    optionalRideTransitions: [...optionalRideByKey.values()],
  }
}

function cleanInstruction(instruction) {
  if (!instruction || typeof instruction !== 'string') return ''
  return instruction.replace(/\s+/g, ' ').trim()
}

function parseMapboxStep(step) {
  const streetName = step.name || step.ref || null
  const instruction =
    cleanInstruction(step.maneuver?.instruction) ||
    (streetName ? `Continue on ${streetName}` : 'Continue')
  return {
    instruction,
    streetName,
    distanceM: step.distance ?? 0,
    durationSec: step.duration ?? 0,
    type: step.maneuver?.type ?? 'continue',
    modifier: step.maneuver?.modifier ?? null,
  }
}

function buildWalkingDirectionsUrl(from, to, accessToken, destinationName) {
  const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const params = new URLSearchParams({
    geometries: 'geojson',
    overview: 'full',
    steps: 'true',
    banner_instructions: 'true',
    language: 'en',
    voice_units: 'metric',
    alternatives: 'false',
    walkway_bias: '-0.85',
    access_token: accessToken,
  })
  if (destinationName) {
    params.set('waypoint_names', `;${String(destinationName).slice(0, 120)}`)
  }
  return `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}?${params.toString()}`
}

/**
 * Single Mapbox walking request for one canonical leg.
 * Rejects empty / invalid / endpoint-far results (does not persist them).
 */
async function fetchMapboxWalkingLeg({ fromId, toId, accessToken }) {
  const from = waypointPoint(fromId)
  const to = waypointPoint(toId)
  if (!from || !to) {
    return { ok: false, reason: 'missing_stop_coordinates' }
  }

  const url = buildWalkingDirectionsUrl(from, to, accessToken, to.title)
  const response = await fetch(url)
  if (!response.ok) {
    return { ok: false, reason: `http_${response.status}` }
  }
  const data = await response.json()
  if (data?.code && data.code !== 'Ok') {
    return { ok: false, reason: String(data.code) }
  }
  const route = data?.routes?.[0]
  if (!route) return { ok: false, reason: 'empty_routes' }

  const geometry = normalizeLineStringGeometry(route.geometry)
  const leg0 = route.legs?.[0]
  const steps = (leg0?.steps ?? []).map(parseMapboxStep).filter((s) => s.instruction)
  const distanceMeters = Math.round(leg0?.distance ?? route.distance ?? 0)
  const durationSeconds = Math.round(leg0?.duration ?? route.duration ?? 0)

  const candidate = {
    originStopId: fromId,
    destinationStopId: toId,
    fromId,
    toId,
    from: { lat: from.lat, lng: from.lng },
    to: { lat: to.lat, lng: to.lng },
    fromTitle: from.title,
    toTitle: to.title,
    distanceMeters,
    durationSeconds,
    distanceM: distanceMeters,
    durationSec: durationSeconds,
    geometry,
    geometryKind: GEOMETRY_KIND_MAPBOX_WALKING,
    source: LEG_SOURCE_MAPBOX,
    productDebt: false,
    steps,
    generatedAt: new Date().toISOString(),
  }

  const validation = validateCanonicalWalkingLeg(candidate, {
    origin: from,
    destination: to,
    allowTemporary: false,
  })

  if (!validation.ok) {
    return {
      ok: false,
      reason: 'validation_failed',
      flags: validation.flags,
      report: validation.report,
    }
  }

  candidate.validationStatus = 'ok'
  candidate.geometryPointCount = validation.report.geometryPointCount
  candidate.stepCount = validation.report.stepCount
  return { ok: true, leg: candidate, report: validation.report }
}

function buildPackage({
  legs,
  routeSummaries,
  assessment,
  sourceNote,
  optionalRideTransitions,
}) {
  const debtKeys = assessment.reports
    .filter((r) => r.validationStatus === 'temporary_fallback')
    .map((r) => r.legKey)

  return {
    version: 'rome-canonical-legs-v1',
    tourId,
    cityId: 'rome',
    generatedAt: new Date().toISOString(),
    source: assessment.complete ? LEG_SOURCE_MAPBOX : LEG_SOURCE_AUTHORED_STOPS,
    geometryKindDefault: assessment.complete
      ? GEOMETRY_KIND_MAPBOX_WALKING
      : GEOMETRY_KIND_TEMPORARY,
    note: sourceNote,
    completeness: {
      expectedLegCount: assessment.legCount,
      realWalkingLegCount: assessment.realWalkingLegCount,
      temporaryFallbackLegCount: assessment.temporaryFallbackLegCount,
      invalidLegCount: assessment.invalidLegCount,
      complete: assessment.complete,
    },
    optionalRideTransitions,
    productDebt: {
      allLegsUseTemporaryFallbackGeometry:
        assessment.temporaryFallbackLegCount === assessment.legCount &&
        assessment.legCount > 0,
      legKeys: debtKeys,
      reason: PRODUCT_DEBT_REASON,
    },
    routes: routeSummaries,
    legs,
  }
}

function printReport(assessment) {
  console.log('[canonical-legs] Validation report')
  console.log(
    `  expected=${assessment.legCount} real=${assessment.realWalkingLegCount} temporary=${assessment.temporaryFallbackLegCount} invalid=${assessment.invalidLegCount} complete=${assessment.complete}`,
  )
  for (const row of assessment.reports) {
    console.log(
      `  ${row.legKey}: status=${row.validationStatus} dist=${row.distanceMeters ?? '-'}m dur=${row.durationSeconds ?? '-'}s points=${row.geometryPointCount ?? 0} steps=${row.stepCount ?? 0} source=${row.source ?? '-'} kind=${row.geometryKind ?? '-'} flags=${(row.flags || []).join('|') || 'none'}`,
    )
  }
}

async function main() {
  const { legsByKey, routeSummaries, expectedKeys, optionalRideTransitions } =
    collectCanonicalLegKeys()
  const existing = loadExistingPackage()
  const legs = { ...(existing?.legs ?? {}) }

  // Drop non-walking ride transitions from the walking legs map (e.g. w21→w22).
  const optionalRideKeys = new Set(
    optionalRideTransitions.map((t) => `${t.originStopId}->${t.destinationStopId}`),
  )
  for (const key of optionalRideKeys) {
    delete legs[key]
  }

  // Ensure every required walking key has at least a temporary scaffold in memory
  // when scaffolding or when missing (never invent network traffic).
  for (const [key, { fromId, toId }] of legsByKey) {
    if (!legs[key]) {
      const scaffold = buildTemporaryLeg(fromId, toId)
      if (scaffold) legs[key] = scaffold
    }
  }

  // Remove any stale walking legs that are no longer in the required set
  // (preserve only expected + do not keep ride transitions as walking debt).
  for (const key of Object.keys(legs)) {
    if (!legsByKey.has(key)) delete legs[key]
  }

  let externalRequests = 0
  const fetchResults = []

  if (SCAFFOLD_ONLY) {
    for (const [key, { fromId, toId }] of legsByKey) {
      if (isRealWalkingLeg(legs[key]) && !FORCE) continue
      const scaffold = buildTemporaryLeg(fromId, toId)
      if (scaffold) legs[key] = scaffold
    }
  }

  if (FETCH_MAPBOX) {
    const token = loadMapboxToken()
    if (!token) {
      console.error(
        '[canonical-legs] Refusing --fetch-mapbox: no VITE_MAPBOX_TOKEN / MAPBOX_ACCESS_TOKEN in env or .env.local (token never printed).',
      )
      process.exit(1)
    }

    const toFetch = []
    for (const [key, meta] of legsByKey) {
      const current = legs[key]
      if (!FORCE && isRealWalkingLeg(current)) {
        fetchResults.push({ legKey: key, action: 'skip_valid_existing' })
        continue
      }
      toFetch.push({ key, ...meta })
    }

    if (toFetch.length > expectedKeys.length) {
      console.error('[canonical-legs] Safety abort: would exceed canonical leg count.')
      process.exit(2)
    }

    console.log(
      `[canonical-legs] Will request Mapbox walking Directions for ${toFetch.length} leg(s) (canonical set size ${expectedKeys.length}).`,
    )

    for (const item of toFetch) {
      externalRequests += 1
      if (externalRequests > expectedKeys.length) {
        console.error('[canonical-legs] Safety abort: request budget exceeded.')
        process.exit(2)
      }
      try {
        const result = await fetchMapboxWalkingLeg({
          fromId: item.fromId,
          toId: item.toId,
          accessToken: token,
        })
        if (result.ok) {
          legs[item.key] = result.leg
          fetchResults.push({
            legKey: item.key,
            action: 'fetched',
            ...result.report,
          })
        } else {
          // Keep prior temporary fallback; do not write invalid geometry.
          if (!legs[item.key]) {
            legs[item.key] = buildTemporaryLeg(item.fromId, item.toId)
          } else if (!isRealWalkingLeg(legs[item.key])) {
            // refresh temporary metadata only
            const scaffold = buildTemporaryLeg(item.fromId, item.toId)
            if (scaffold) legs[item.key] = scaffold
          }
          fetchResults.push({
            legKey: item.key,
            action: 'rejected',
            reason: result.reason,
            flags: result.flags ?? [],
          })
          console.warn(
            `[canonical-legs] Rejected ${item.key}: ${result.reason}${(result.flags || []).length ? ` (${result.flags.join(',')})` : ''}`,
          )
        }
      } catch (error) {
        fetchResults.push({
          legKey: item.key,
          action: 'error',
          reason: error?.name === 'AbortError' ? 'timeout' : 'network_error',
        })
        console.warn(`[canonical-legs] Failed ${item.key}: network/error (details omitted)`)
      }
    }
  }

  const assessment = assessCanonicalWalkingPackage(
    { routes: routeSummaries, legs },
    expectedKeys,
  )

  const sourceNote = assessment.complete
    ? 'Offline Rome stop→stop package captured from Mapbox Directions (walking). Runtime reads this JSON only — no Directions API at runtime.'
    : 'Offline Rome stop→stop package is INCOMPLETE: one or more legs still use temporary straight-line fallback (product debt). Run with --fetch-mapbox after explicit approval to capture real walking geometry. Temporary geometry is not pedestrian street routing.'

  printReport(assessment)
  if (optionalRideTransitions.length) {
    console.log(
      `[canonical-legs] optional ride transitions (not walking completeness): ${optionalRideTransitions
        .map((t) => `${t.originStopId}->${t.destinationStopId} via ${t.transitId}`)
        .join(', ')}`,
    )
  }

  if (!FETCH_MAPBOX && !SCAFFOLD_ONLY) {
    console.log(
      '[canonical-legs] Report-only mode (no write, no network). Use --scaffold-only or --fetch-mapbox to update the package.',
    )
    console.log(
      `[canonical-legs] Next approved capture command would make ${assessment.temporaryFallbackLegCount + assessment.invalidLegCount + assessment.missingLegKeys.length} external request(s) (≤${expectedKeys.length}).`,
    )
    if (WRITE_REPORT) {
      writeFileSync(
        reportPath,
        `${JSON.stringify({ generatedAt: new Date().toISOString(), assessment, fetchResults, optionalRideTransitions }, null, 2)}\n`,
      )
    }
    process.exit(assessment.complete ? 0 : 0)
  }

  const package_ = buildPackage({
    legs,
    routeSummaries,
    assessment,
    sourceNote,
    optionalRideTransitions,
  })
  writeFileSync(outPath, `${JSON.stringify(package_, null, 2)}\n`)
  writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        externalRequests,
        fetchResults,
        optionalRideTransitions,
        assessment,
      },
      null,
      2,
    )}\n`,
  )

  console.log(
    `[canonical-legs] Wrote ${outPath} (complete=${assessment.complete}; externalRequests=${externalRequests})`,
  )
  if (externalRequests > 0) {
    console.log(
      `[canonical-legs] Made ${externalRequests} Mapbox Directions request(s). Token was not printed.`,
    )
  }
}

main().catch((error) => {
  console.error('[canonical-legs] Fatal:', error?.message || error)
  process.exit(1)
})
