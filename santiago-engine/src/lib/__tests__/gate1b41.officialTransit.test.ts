import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MULTIMODAL_PHYSICAL_GRAPH_READY,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
} from '../city-graph/flags'

const root = resolve(__dirname, '../../..')

describe('Gate 1B.4.1 official DTPM GTFS transit correction', () => {
  it('keeps traveler routing disabled', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(MULTIMODAL_PHYSICAL_GRAPH_READY).toBe(true)
  })

  it('uses official DTPM GTFS as canonical runtime Metro without L7', () => {
    const lines = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/transit/santiago_metro_lines.v0.2.json'), 'utf8'),
    )
    const multi = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_multimodal_graph.v0.2.json'), 'utf8'),
    )
    const meta = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/transit/santiago_gtfs_feed_provenance.v0.1.json'), 'utf8'),
    )
    expect(meta.agencyId).toBe('M')
    expect(meta.sourceUrl).toContain('dtpm.cl')
    expect(meta.feedVersion).toBe('V166.20260704')
    expect(lines.lines.map((l: { lineId: string }) => l.lineId).sort()).toEqual(
      ['L1', 'L2', 'L3', 'L4', 'L4A', 'L5', 'L6'].sort(),
    )
    expect(multi.counts.l7RuntimePresent).toBe(false)
    expect(multi.canonicalTransitSource).toBe('dtpm_gtfs')
  })

  it('stores scheduled GTFS durations distinctly from observed/realtime and engine policy', () => {
    const times = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/transit/santiago_metro_scheduled_times.v0.1.json'), 'utf8'),
    )
    const multi = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_multimodal_graph.v0.2.json'), 'utf8'),
    )
    expect(times.durationLabel).toBe('SCHEDULED_GTFS_DURATION')
    expect(times.notRealtime).toBe(true)
    expect(times.segmentCount).toBeGreaterThan(100)
    for (const e of multi.metroRideEdges) {
      expect(e.scheduledDurationSeconds).toBeGreaterThan(0)
      expect(e.observedDurationSeconds).toBeNull()
      expect(e.durationLabel).toBe('SCHEDULED_GTFS_DURATION')
    }
    for (const e of multi.metroTransferEdges) {
      expect(e.physicalTransferDurationSeconds).toBeNull()
      expect(e.enginePolicyTransferPenaltySeconds).toBeGreaterThan(0)
    }
  })

  it('reconciles POI-Metro access to GTFS stations and preserves unresolved launch nodes', () => {
    const multi = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_multimodal_graph.v0.2.json'), 'utf8'),
    )
    const stations = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/transit/santiago_metro_stations.v0.2.json'), 'utf8'),
    )
    const ids = new Set(stations.stations.map((s: { stationId: string }) => s.stationId))
    expect(multi.poiMetroAccessUnresolved).toHaveLength(0)
    for (const e of multi.poiMetroAccessEdges) {
      expect(ids.has(e.stationId)).toBe(true)
      expect(String(e.stationId).startsWith('METRO_GTFS_')).toBe(true)
    }
    for (const blocked of ['STGO_05', 'STGO_23', 'STGO_33']) {
      expect(multi.poiMetroAccessEdges.some((e: { stgoId: string }) => e.stgoId === blocked)).toBe(false)
    }
  })

  it('never leaks secrets', () => {
    const raw = readFileSync(resolve(root, 'src/data/santiago/santiago_multimodal_graph.v0.2.json'), 'utf8')
    expect(raw).not.toMatch(/pk\.ey/)
    expect(raw).not.toMatch(/MAPBOX_ACCESS_TOKEN/)
  })
})
