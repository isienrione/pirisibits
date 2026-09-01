/**
 * Gate 2E.1 — build geo segments with canonical geometry lookup for Route Lab map.
 */

import type { RouteStopV01 } from '@/src/engine/routes/route-types'
import {
  loadWalkGeometryIndex,
  lookupWalkGeometry,
  type GeometryLookupResult,
} from '@/src/dev/route-lab/geometryIndex'

export type RouteLabGeoSegment = GeometryLookupResult & {
  transitionDurationMin: number
  transitionDistanceM: number | null
  label: string
}

export function buildGeoSegmentsForRoute(
  stops: RouteStopV01[],
  index = loadWalkGeometryIndex(),
): RouteLabGeoSegment[] {
  const out: RouteLabGeoSegment[] = []
  for (let i = 1; i < stops.length; i += 1) {
    const prev = stops[i - 1]!
    const cur = stops[i]!
    const mode = cur.arrivalMode === 'METRO' ? 'METRO' : 'WALK'
    const lookup = lookupWalkGeometry(prev.stgoId, cur.stgoId, index, mode)
    const label =
      lookup.geometryStatus === 'CANONICAL_GEOMETRY'
        ? 'Canonical Mapbox walk geometry'
        : lookup.geometryStatus === 'METRO_NO_GEOMETRY'
          ? 'Metro segment — no walk geometry'
          : 'GEOMETRY NOT STORED — adjacency/time evidence only'
    out.push({
      ...lookup,
      transitionDurationMin: cur.transitionTimeMin,
      transitionDistanceM: cur.transition?.distanceM ?? lookup.distanceM,
      label,
    })
  }
  return out
}

/** GeoJSON FeatureCollection for map rendering. */
export function geoSegmentsToFeatureCollection(segments: RouteLabGeoSegment[]) {
  const features: Array<{
    type: 'Feature'
    properties: Record<string, unknown>
    geometry: { type: 'LineString'; coordinates: [number, number][] }
  }> = []

  for (const s of segments) {
    if (s.geometry?.coordinates?.length) {
      features.push({
        type: 'Feature',
        properties: {
          from: s.fromStgoId,
          to: s.toStgoId,
          status: s.geometryStatus,
          kind: 'canonical',
        },
        geometry: { type: 'LineString', coordinates: s.geometry.coordinates },
      })
    } else if (s.geometryStatus !== 'METRO_NO_GEOMETRY') {
      // diagnostic straight connector between POI coords added client-side
      features.push({
        type: 'Feature',
        properties: {
          from: s.fromStgoId,
          to: s.toStgoId,
          status: s.geometryStatus,
          kind: 'diagnostic',
          label: 'GEOMETRY NOT STORED',
        },
        geometry: { type: 'LineString', coordinates: [] },
      })
    }
  }

  return { type: 'FeatureCollection' as const, features }
}
