/**
 * Gate 2E.1 — read-only canonical walk geometry index from frozen physical edges.
 * Does not mutate physical graph.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export type LineStringGeometry = {
  type: 'LineString'
  coordinates: [number, number][]
}

export type GeometryLookupResult = {
  fromStgoId: string
  toStgoId: string
  key: string
  geometryStatus: 'CANONICAL_GEOMETRY' | 'GEOMETRY_NOT_STORED' | 'METRO_NO_GEOMETRY' | 'NO_ADJACENCY'
  geometry: LineStringGeometry | null
  distanceM: number | null
  durationMin: number | null
  edgeId: string | null
  source: 'physical_edges' | 'stgo05_extension' | 'adjacency_only' | null
}

type EdgeRow = {
  fromPoiId?: string
  toPoiId?: string
  edgeId?: string
  distanceM?: number
  durationMin?: number
  geometry?: LineStringGeometry | null
}

const ROOT = resolve(__dirname, '../../..')

function edgeKey(from: string, to: string): string {
  return `${from}>${to}`
}

/** Build directed geometry index from frozen provider artifacts. */
export function loadWalkGeometryIndex(root = ROOT): Map<string, Omit<GeometryLookupResult, 'fromStgoId' | 'toStgoId' | 'key'>> {
  const index = new Map<string, Omit<GeometryLookupResult, 'fromStgoId' | 'toStgoId' | 'key'>>()

  const ingest = (rows: EdgeRow[], source: 'physical_edges' | 'stgo05_extension') => {
    for (const e of rows) {
      const from = e.fromPoiId
      const to = e.toPoiId
      if (!from || !to) continue
      const key = edgeKey(from, to)
      const geom = e.geometry?.type === 'LineString' ? e.geometry : null
      index.set(key, {
        geometryStatus: geom ? 'CANONICAL_GEOMETRY' : 'GEOMETRY_NOT_STORED',
        geometry: geom,
        distanceM: e.distanceM ?? null,
        durationMin: e.durationMin ?? null,
        edgeId: e.edgeId ?? null,
        source,
      })
    }
  }

  const main = JSON.parse(
    readFileSync(resolve(root, 'src/data/santiago/santiago_physical_edges.v0.1.json'), 'utf8'),
  )
  ingest(main.edges || [], 'physical_edges')

  const extPath = resolve(root, 'src/data/santiago/santiago_physical_edges_stgo05_extension.v0.1.json')
  try {
    const ext = JSON.parse(readFileSync(extPath, 'utf8'))
    ingest(ext.edges || [], 'stgo05_extension')
  } catch {
    // optional extension
  }

  return index
}

export function lookupWalkGeometry(
  fromStgoId: string,
  toStgoId: string,
  index: Map<string, ReturnType<typeof loadWalkGeometryIndex> extends Map<string, infer V> ? V : never>,
  mode: 'WALK' | 'METRO' | 'START' = 'WALK',
): GeometryLookupResult {
  const key = edgeKey(fromStgoId, toStgoId)
  if (mode === 'METRO') {
    return {
      fromStgoId,
      toStgoId,
      key,
      geometryStatus: 'METRO_NO_GEOMETRY',
      geometry: null,
      distanceM: null,
      durationMin: null,
      edgeId: null,
      source: null,
    }
  }
  const hit = index.get(key)
  if (!hit) {
    return {
      fromStgoId,
      toStgoId,
      key,
      geometryStatus: 'NO_ADJACENCY',
      geometry: null,
      distanceM: null,
      durationMin: null,
      edgeId: null,
      source: null,
    }
  }
  return { fromStgoId, toStgoId, key, ...hit }
}
