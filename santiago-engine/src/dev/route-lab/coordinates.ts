/**
 * Gate 2E — POI coordinate index for Route Lab map (read-only).
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export type PoiCoordinate = {
  stgoId: string
  lat: number
  lng: number
  displayName: string | null
  commune: string | null
  launchCorpus: boolean
}

export function loadPoiCoordinates(root: string): Map<string, PoiCoordinate> {
  const raw = JSON.parse(
    readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
  )
  const out = new Map<string, PoiCoordinate>()
  for (const n of raw.nodes || []) {
    const coord = n.poiCoordinate || n.experiencePointCoordinate || n.entranceCoordinate
    if (!coord?.lat || !coord?.lng) continue
    out.set(n.stgoId, {
      stgoId: n.stgoId,
      lat: coord.lat,
      lng: coord.lng,
      displayName: n.displayName ?? n.canonicalName ?? null,
      commune: n.commune ?? null,
      launchCorpus: Boolean(n.launchCorpus),
    })
  }
  return out
}

export function projectCoordinates(
  points: Array<{ lat: number; lng: number }>,
  width: number,
  height: number,
  padding = 24,
): Array<{ x: number; y: number }> {
  if (!points.length) return []
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latSpan = Math.max(maxLat - minLat, 0.001)
  const lngSpan = Math.max(maxLng - minLng, 0.001)
  return points.map((p) => ({
    x: padding + ((p.lng - minLng) / lngSpan) * (width - padding * 2),
    y: padding + (1 - (p.lat - minLat) / latSpan) * (height - padding * 2),
  }))
}
