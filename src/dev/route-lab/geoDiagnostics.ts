/**
 * Gate 2E.1 — geographic QA indicators (presentation only, not engine scoring).
 */

import type { ArcQualityResult } from '@/src/engine/routes/arc-quality'
import type { RouteStopV01 } from '@/src/engine/routes/route-types'
import type { GeometryLookupResult } from '@/src/dev/route-lab/geometryIndex'
import type { PoiCoordinate } from '@/src/dev/route-lab/coordinates'

export type GeoSegmentEvidence = GeometryLookupResult & {
  transitionDurationMin: number
  transitionDistanceM: number | null
}

export type GeographicQaIndicators = {
  totalWalkingDistanceM: number | null
  boundingBox: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null
  extentKm: number | null
  transitionDistancesM: Array<{ from: string; to: string; distanceM: number | null; durationMin: number }>
  longestTransitionM: number | null
  longestTransitionLabel: string | null
  geometricReversalCount: number
  revisitedVicinityCount: number
  engineBacktrackingPenalty: number
  mapQaNotes: string[]
}

function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

export function computeGeographicQaIndicators(args: {
  stops: RouteStopV01[]
  segments: GeoSegmentEvidence[]
  coordinates: Map<string, PoiCoordinate>
  arcQuality: ArcQualityResult
}): GeographicQaIndicators {
  const { stops, segments, coordinates, arcQuality } = args
  const notes: string[] = []

  let totalWalk = 0
  let hasWalkDist = false
  const transitionDistancesM = segments.map((s) => {
    const dm = s.distanceM ?? s.transitionDistanceM
    if (s.geometryStatus !== 'METRO_NO_GEOMETRY' && dm != null) {
      totalWalk += dm
      hasWalkDist = true
    }
    return {
      from: s.fromStgoId,
      to: s.toStgoId,
      distanceM: dm,
      durationMin: s.durationMin ?? s.transitionDurationMin,
    }
  })

  const coords = stops
    .map((s) => coordinates.get(s.stgoId))
    .filter((c): c is PoiCoordinate => Boolean(c))

  let boundingBox: GeographicQaIndicators['boundingBox'] = null
  let extentKm: number | null = null
  if (coords.length) {
    const lats = coords.map((c) => c.lat)
    const lngs = coords.map((c) => c.lng)
    boundingBox = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    }
    extentKm =
      Math.round(
        (haversineM(
          { lat: boundingBox.minLat, lng: boundingBox.minLng },
          { lat: boundingBox.maxLat, lng: boundingBox.maxLng },
        ) /
          1000) *
          100,
      ) / 100
  }

  let longestTransitionM: number | null = null
  let longestTransitionLabel: string | null = null
  for (const t of transitionDistancesM) {
    if (t.distanceM != null && (longestTransitionM == null || t.distanceM > longestTransitionM)) {
      longestTransitionM = t.distanceM
      longestTransitionLabel = `${t.from}→${t.to}`
    }
  }

  let geometricReversalCount = 0
  const stopCoords = stops.map((s) => coordinates.get(s.stgoId)).filter(Boolean) as PoiCoordinate[]
  for (let i = 2; i < stopCoords.length; i += 1) {
    const b1 = bearing(stopCoords[i - 2]!, stopCoords[i - 1]!)
    const b2 = bearing(stopCoords[i - 1]!, stopCoords[i]!)
    if (angleDiff(b1, b2) >= 135) geometricReversalCount += 1
  }

  let revisitedVicinityCount = 0
  const vicinityM = 150
  for (let i = 0; i < stopCoords.length; i += 1) {
    for (let j = i + 2; j < stopCoords.length; j += 1) {
      if (stops[i]!.stgoId === stops[j]!.stgoId) continue
      if (haversineM(stopCoords[i]!, stopCoords[j]!) <= vicinityM) revisitedVicinityCount += 1
    }
  }

  const noGeom = segments.filter((s) => s.geometryStatus === 'GEOMETRY_NOT_STORED' || s.geometryStatus === 'NO_ADJACENCY')
  if (noGeom.length) notes.push(`${noGeom.length} segment(s) lack stored canonical geometry — shown as diagnostic connectors.`)

  if (geometricReversalCount > 0) notes.push(`${geometricReversalCount} sharp turn reversal(s) ≥135° between consecutive legs.`)
  if (revisitedVicinityCount > 0) notes.push(`${revisitedVicinityCount} later stop(s) revisit vicinity (≤${vicinityM}m) of an earlier stop.`)

  return {
    totalWalkingDistanceM: hasWalkDist ? Math.round(totalWalk) : null,
    boundingBox,
    extentKm,
    transitionDistancesM,
    longestTransitionM,
    longestTransitionLabel,
    geometricReversalCount,
    revisitedVicinityCount,
    engineBacktrackingPenalty: arcQuality.penalties.backtrackingPenalty,
    mapQaNotes: notes,
  }
}

export function stopSequenceLabel(stops: RouteStopV01[]): string {
  return stops.map((s) => s.stgoId).join(' → ')
}

export function shapeAmbiguityTags(tags: string[]): { ambiguous: boolean; tags: string[] } {
  const primary = tags.slice(0, 3)
  return { ambiguous: primary.length > 2, tags }
}
