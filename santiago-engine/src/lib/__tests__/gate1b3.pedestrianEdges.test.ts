import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PHYSICAL_ROUTE_GENERATION_ENABLED } from '../city-graph/flags'
import {
  WALK_CLASS_GREEN_MAX_MIN,
  WALK_CLASS_ORANGE_MAX_MIN,
  WALK_CLASS_YELLOW_MAX_MIN,
} from '../city-graph/physical-edge-constants'
import type { SantiagoEngineNodesFile, SantiagoPhysicalEdgesFile } from '../city-graph/types'

const root = resolve(__dirname, '../../..')

describe('Gate 1B.3 Santiago pedestrian edge graph', () => {
  it('keeps traveler route generation disabled', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
  })

  it('exposes inspectable walk classification thresholds', () => {
    expect(WALK_CLASS_GREEN_MAX_MIN).toBe(20)
    expect(WALK_CLASS_YELLOW_MAX_MIN).toBe(35)
    expect(WALK_CLASS_ORANGE_MAX_MIN).toBe(60)
  })

  it('builds provider-derived sparse pedestrian edges for eligible launch nodes', () => {
    const edges = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_physical_edges.v0.1.json'), 'utf8'),
    ) as SantiagoPhysicalEdgesFile
    const engine = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
    ) as SantiagoEngineNodesFile
    const nodeIds = new Set(engine.nodes.map((n) => n.stgoId))

    expect(edges.gate).toBe('1B.3')
    expect(edges.physicalRouteGenerationEnabled).toBe(false)
    expect(edges.referenceMatrixStatus).toBe('REFERENCE_MATRIX_NOT_PRESENT')
    expect(edges.eligibleStgoIds).not.toContain('STGO_05')
    expect(edges.eligibleStgoIds).not.toContain('STGO_23')
    expect(edges.eligibleStgoIds).not.toContain('STGO_33')

    const runtime = edges.edges.filter((e) => e.runtimeEligible)
    expect(runtime.length).toBeGreaterThan(0)
    expect(edges.counts.runtimeWalkEdges).toBe(runtime.length)

    for (const e of edges.edges) {
      expect(nodeIds.has(e.fromPoiId)).toBe(true)
      expect(nodeIds.has(e.toPoiId)).toBe(true)
      expect(e.mode).toBe('WALK')
      expect(e.provider).toBe('mapbox')
      expect(e.provenance.routingProfile).toBe('mapbox/walking')
      if (e.runtimeEligible) {
        expect(e.distanceM).toBeGreaterThan(0)
        expect(e.durationS).toBeGreaterThan(0)
        expect(['GREEN', 'YELLOW']).toContain(e.physicalClassification)
        expect(e.physicalCost.baseProvider).toBe('mapbox')
        expect(e.physicalCost.stepFree).toBeNull()
      }
    }
  })

  it('never leaks secrets and excludes blocked nodes from runtime graph', () => {
    const raw = readFileSync(resolve(root, 'src/data/santiago/santiago_physical_edges.v0.1.json'), 'utf8')
    expect(raw).not.toMatch(/pk\.ey/)
    expect(raw).not.toMatch(/MAPBOX_ACCESS_TOKEN/)
    const edges = JSON.parse(raw) as SantiagoPhysicalEdgesFile
    const runtime = edges.edges.filter((e) => e.runtimeEligible)
    for (const blocked of ['STGO_05', 'STGO_23', 'STGO_33']) {
      expect(runtime.some((e) => e.fromPoiId === blocked || e.toPoiId === blocked)).toBe(false)
    }
  })

  it('records STGO_32 funicular endpoint without thematic fields on edges', () => {
    const edges = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_physical_edges.v0.1.json'), 'utf8'),
    ) as SantiagoPhysicalEdgesFile
    const stgo32Edges = edges.edges.filter(
      (e) => e.fromPoiId === 'STGO_32' || e.toPoiId === 'STGO_32',
    )
    expect(stgo32Edges.length).toBeGreaterThan(0)
    for (const e of stgo32Edges) {
      if (e.fromPoiId === 'STGO_32') {
        expect(e.fromPoint.pointId).toBe('funicular')
      }
      if (e.toPoiId === 'STGO_32') {
        expect(e.toPoint.pointId).toBe('funicular')
      }
      expect(Object.keys(e)).not.toContain('themes')
      expect(Object.keys(e)).not.toContain('chronoWorth')
    }
  })
})
