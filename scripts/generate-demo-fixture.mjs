#!/usr/bin/env node
/**
 * DEMO_ONLY fixture generator.
 * Reads existing Rome sources. Does not invent coordinates, titles, or times.
 * Runtime React Native must import the generated JSON — never node:fs.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = resolve(root, 'chronowalk/src/content/rome/manifest.json')
const factsPath = resolve(root, 'docs/core_a/ROME_ROUTE_MASTER_FACTS.json')
const outPath = resolve(root, 'apps/traveler/src/demo/generated/mobileFixture.json')

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const facts = JSON.parse(readFileSync(factsPath, 'utf8'))

const TRANSCRIPT_WALK = {
  w13_w14: { minutes: 9, sourceId: 'manifest.transits.t10.transcript' },
  w16_w17: { minutes: 8, sourceId: 'manifest.transits.t12.transcript' },
}

function walkMinutes(fromId, toId) {
  const pair = facts.walkMinutesByPlacePair.find(
    (edge) =>
      (edge.from === fromId && edge.to === toId) || (edge.from === toId && edge.to === fromId),
  )
  if (pair) {
    return { minutes: pair.minutes, sourceId: `${facts.sourceId}#${pair.from}-${pair.to}` }
  }
  const key = `${fromId}_${toId}`
  const reverse = `${toId}_${fromId}`
  if (TRANSCRIPT_WALK[key]) return TRANSCRIPT_WALK[key]
  if (TRANSCRIPT_WALK[reverse]) return TRANSCRIPT_WALK[reverse]
  return null
}

function stripStage(text) {
  if (!text) return null
  return text
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280)
}

function archiveStill(waypoint, side) {
  const reconstruction = waypoint.reconstruction ?? {}
  const nowImage = waypoint.now_image ?? {}
  const uri = reconstruction[side] ?? waypoint.photo ?? null
  if (!uri) {
    return {
      uri: null,
      caption: reconstruction.caption ?? null,
      credit: nowImage.credit ?? null,
      license: nowImage.license ?? null,
      source: nowImage.source ?? null,
      provenance: 'pending-curation',
    }
  }
  return {
    uri,
    caption: reconstruction.caption ?? null,
    credit: nowImage.credit ?? null,
    license: nowImage.license ?? null,
    source: nowImage.source ?? null,
    provenance: nowImage.source ? 'sourced' : 'pending-curation',
  }
}

function place(id, treatment, extras = {}) {
  const waypoint = manifest.waypoints[id]
  if (!waypoint) throw new Error(`Missing waypoint ${id}`)
  const geofence = waypoint.geofence
  const visit = facts.visitMinutes[id] ?? null
  return {
    id,
    kind: 'experience',
    treatment,
    title: waypoint.title,
    spoilerSafeTitle: extras.spoilerSafeTitle ?? waypoint.title,
    lookCue: extras.lookCue ?? waypoint.arrivalLine ?? null,
    arrivalLine: waypoint.arrivalLine ?? null,
    approachLine: waypoint.approachLine ?? null,
    firstSpokenLine: stripStage(waypoint.chapters?.[0]?.transcript) ?? stripStage(waypoint.transcript),
    coordinate: geofence
      ? {
          lat: geofence.lat,
          lng: geofence.lng,
          precision: 'geofence-center',
          sourceId: `manifest.waypoints.${id}.geofence`,
        }
      : null,
    arrivalRadiusM: geofence?.radius_m ?? null,
    experienceMin: visit?.low ?? null,
    experienceMinRange: visit,
    walkingMin: null,
    archive: {
      now: archiveStill(waypoint, 'now'),
      then: archiveStill(waypoint, 'then'),
      caption: waypoint.reconstruction?.caption ?? null,
    },
    mystery: extras.mystery ?? { isMystery: false, hint: null, detourCostMin: null },
    zone: waypoint.zone ?? null,
    act: waypoint.act ?? null,
    provenance: 'sourced',
    sourceId: `manifest.waypoints.${id}`,
  }
}

function walk(fromId, toId) {
  const walking = walkMinutes(fromId, toId)
  const from = manifest.waypoints[fromId]
  const to = manifest.waypoints[toId]
  return {
    id: `walk:${fromId}:${toId}`,
    kind: 'walk',
    treatment: 'walk',
    title: walking
      ? `${from.title} → ${to.title}`
      : `${from.title} → ${to.title}`,
    spoilerSafeTitle: `${from.title} → ${to.title}`,
    lookCue: to.approachLine ?? null,
    arrivalLine: null,
    approachLine: to.approachLine ?? null,
    firstSpokenLine: null,
    coordinate: null,
    arrivalRadiusM: null,
    experienceMin: null,
    experienceMinRange: null,
    walkingMin: walking?.minutes ?? null,
    walkingProvenance: walking ? 'sourced' : 'NEEDS_FIELD_QA',
    archive: { now: null, then: null, caption: null },
    mystery: { isMystery: false, hint: null, detourCostMin: null },
    zone: null,
    act: null,
    provenance: walking ? 'sourced' : 'NEEDS_FIELD_QA',
    sourceId: walking?.sourceId ?? `undocumented-walk:${fromId}:${toId}`,
  }
}

function timeReport(targetBudgetMin, items) {
  const experienceMin = items.reduce((sum, item) => sum + (item.experienceMin ?? 0), 0)
  const walkingKnown = items.filter((item) => item.kind === 'walk' && item.walkingMin != null)
  const walkingUnknown = items.filter((item) => item.kind === 'walk' && item.walkingMin == null)
  const walkingMin = walkingKnown.reduce((sum, item) => sum + item.walkingMin, 0)
  const bufferMin = 10
  const totalEstimatedMin = experienceMin + walkingMin + bufferMin
  const budgetDeltaMin = totalEstimatedMin - targetBudgetMin
  const walkingMinComplete = walkingUnknown.length === 0
  let timeFit = 'unknown'
  if (walkingMinComplete) {
    if (Math.abs(budgetDeltaMin) <= 10) timeFit = 'fit'
    else if (budgetDeltaMin < 0) timeFit = 'under'
    else timeFit = 'over'
  }
  const notes = []
  if (!walkingMinComplete) {
    notes.push('Some walking minutes are unpublished in Route Master / manifest; they are omitted, not estimated.')
  }
  notes.push('Visit minutes use the low end of Route Master typical ranges.')
  notes.push('Buffer is a demo constant (10 min), not a City Engine output.')
  return {
    targetBudgetMin,
    experienceMin,
    walkingMin,
    bufferMin,
    totalEstimatedMin,
    budgetDeltaMin,
    timeFit,
    walkingMinComplete,
    notes,
  }
}

const mysteryHint =
  'A different room, in a different part of the city... and that room still exists.'

const routes = {
  60: {
    id: 'demo-rome-60',
    title: 'Forum threshold',
    itemPlan: [
      ['exp', 'w03', 'discovery'],
      ['walk', 'w03', 'w06'],
      ['exp', 'w06', 'micro'],
    ],
  },
  120: {
    id: 'demo-rome-120',
    title: 'Afternoon in the valley',
    itemPlan: [
      ['exp', 'w01', 'hero'],
      ['walk', 'w01', 'w03'],
      ['exp', 'w03', 'discovery'],
      ['walk', 'w03', 'w06'],
      ['exp', 'w06', 'micro'],
      ['walk', 'w06', 'w07'],
      ['exp', 'w07', 'micro'],
      ['walk', 'w07', 'w08'],
      ['exp', 'w08', 'reveal'],
      ['exp', 'w20', 'mystery'],
    ],
  },
  180: {
    id: 'demo-rome-180',
    title: 'Arena to hill',
    itemPlan: [
      ['exp', 'w01', 'hero'],
      ['walk', 'w01', 'w02'],
      ['exp', 'w02', 'discovery'],
      ['exp', 'w04', 'hero'],
      ['walk', 'w03', 'w06'],
      ['exp', 'w03', 'discovery'],
      ['exp', 'w06', 'micro'],
    ],
  },
}

function materialize(plan, budget) {
  const items = plan.itemPlan.map((step) => {
    if (step[0] === 'walk') return walk(step[1], step[2])
    const id = step[1]
    const treatment = step[2]
    if (treatment === 'mystery') {
      return place(id, 'mystery', {
        spoilerSafeTitle: 'A room the Forum does not contain',
        lookCue: mysteryHint,
        mystery: {
          isMystery: true,
          hint: mysteryHint,
          detourCostMin: walkMinutes('w14', 'w20')?.minutes ?? null,
        },
      })
    }
    return place(id, treatment)
  })
  const time = timeReport(budget, items)
  const why = [
    {
      id: 'time-budget',
      kind: 'time',
      statement: `Drafted against your ${budget} minutes using published visit lows and documented walks only.`,
      sourceId: facts.sourceId,
    },
    {
      id: 'sequence',
      kind: 'sequence',
      statement: 'Stops stay on the existing Rome walking sequence from the production manifest.',
      sourceId: 'manifest.journey.sequences.a',
    },
  ]
  const losingAlt = facts.losingAlternative
    ? {
        id: 'alt-historica',
        kind: 'alternative-lost',
        statement: `${facts.losingAlternative.title} was not chosen: ${facts.losingAlternative.description}`,
        sourceId: facts.losingAlternative.sourceId,
      }
    : null
  if (losingAlt) why.push(losingAlt)
  return {
    id: plan.id,
    demoOnly: true,
    title: plan.title,
    honestyLine: `Borrador para tus ${budget} minutos — DEMO_ONLY, not a City Engine decision.`,
    items,
    time,
    why,
    losingAlternative: losingAlt,
  }
}

const fixture = {
  demoOnly: true,
  generatedAt: new Date().toISOString(),
  cityId: 'rome',
  sourceId: 'chronowalk/src/content/rome/manifest.json',
  secondarySourceId: facts.sourceId,
  cityName: manifest.name,
  mysterySpoilerSafeTitle: 'A room the Forum does not contain',
  mysteryTrueTitle: manifest.waypoints.w20.title,
  mysteryHint,
  mysteryRevealId: 'w20',
  bifurcation: {
    dominant: {
      id: 'continue-forum',
      title: 'Stay in the valley',
      impact: 'Keeps the remaining Forum stops from the 120-minute draft.',
    },
    alternatives: [
      {
        id: 'skip-to-largo',
        title: 'Take the later room now',
        impact: 'Removes remaining Forum micros and makes the mystery the next experience.',
      },
      {
        id: 'close-day',
        title: 'End after this stop',
        impact: 'Drops everything after the current cursor. No penalty language.',
      },
    ],
    stay: { id: 'stay', title: 'Follow the plan' },
  },
  routes: {
    60: materialize(routes[60], 60),
    120: materialize(routes[120], 120),
    180: materialize(routes[180], 180),
  },
  units: Object.fromEntries(
    ['w01', 'w02', 'w03', 'w04', 'w06', 'w07', 'w08', 'w10', 'w11_12', 'w13', 'w14', 'w15', 'w16', 'w17', 'w18', 'w19', 'w20', 'w21', 'w22', 'enc_circus']
      .filter((id) => manifest.waypoints[id])
      .map((id) => [id, place(id, 'discovery')]),
  ),
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, `${JSON.stringify(fixture, null, 2)}\n`)
console.log(`Wrote ${outPath}`)
