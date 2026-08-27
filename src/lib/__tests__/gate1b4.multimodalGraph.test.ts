import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MULTIMODAL_PHYSICAL_GRAPH_READY,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
} from '../city-graph/flags'
import {
  ENGINE_POLICY_METRO_ENTRY_FRICTION_S,
  ENGINE_POLICY_METRO_HOP_FALLBACK_S,
  SPARSE_NEAREST_NEIGHBORS,
} from '../city-graph/physical-edge-constants'
import type {
  SantiagoEngineNodesFile,
  SantiagoMultimodalGraphFile,
  SantiagoPedestrianAdjacencyFile,
  SantiagoPhysicalEdgesFile,
} from '../city-graph/types'

const root = resolve(__dirname, '../../..')

describe('Gate 1B.4 Santiago multimodal physical graph', () => {
  it('keeps traveler routing disabled while multimodal substrate may be ready', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(MULTIMODAL_PHYSICAL_GRAPH_READY).toBe(true)
  })

  it('exposes inspectable sparse and engine-policy constants', () => {
    expect(SPARSE_NEAREST_NEIGHBORS).toBe(4)
    expect(ENGINE_POLICY_METRO_ENTRY_FRICTION_S).toBe(180)
    expect(ENGINE_POLICY_METRO_HOP_FALLBACK_S).toBe(120)
  })

  it('preserves Gate 1B.3 provider edges and sparsifies operational adjacency with provenance', () => {
    const provider = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_physical_edges.v0.1.json'), 'utf8'),
    ) as SantiagoPhysicalEdgesFile
    const adj = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_pedestrian_adjacency.v0.1.json'), 'utf8'),
    ) as SantiagoPedestrianAdjacencyFile
    expect(provider.counts.runtimeWalkEdges).toBe(598)
    expect(adj.sparseOperationalEdgeCount).toBeLessThan(598)
    expect(adj.graphHealth.connectedComponentCount).toBe(1)
    const providerIds = new Set(provider.edges.map((e) => e.edgeId))
    for (const e of adj.edges) {
      expect(providerIds.has(e.providerEdgeId)).toBe(true)
      expect(e.provenance.tracesToGate1B3ProviderEdge).toBe(true)
      expect(e.distanceM).toBeGreaterThan(0)
      expect(e.durationS).toBeGreaterThan(0)
    }
  })

  it('keeps Metro topology verified while observed segment times remain unresolved', () => {
    const multi = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_multimodal_graph.v0.1.json'), 'utf8'),
    ) as SantiagoMultimodalGraphFile
    expect(multi.gate).toBe('1B.4')
    expect(multi.thematicNarrativeUsed).toBe(false)
    expect(multi.physicalRouteGenerationEnabled).toBe(false)
    expect(multi.counts.metroStations).toBeGreaterThan(50)
    for (const e of multi.metroRideEdges) {
      expect(e.observedDurationSeconds).toBeNull()
      expect(e.enginePolicyHopCostSeconds).toBeGreaterThan(0)
    }
    for (const e of multi.metroTransferEdges) {
      expect(e.observedDurationSeconds).toBeNull()
    }
    expect(multi.sanCristobalStaging.routingEndpoint).toBe('funicular')
  })

  it('excludes unresolved launch nodes and preserves 104-node inventory (103 seed + STGO_104)', () => {
    const engine = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
    ) as SantiagoEngineNodesFile
    const adj = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_pedestrian_adjacency.v0.1.json'), 'utf8'),
    ) as SantiagoPedestrianAdjacencyFile
    const multi = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_multimodal_graph.v0.1.json'), 'utf8'),
    ) as SantiagoMultimodalGraphFile
    expect(engine.nodeCount).toBe(104)
    expect(engine.nodes.filter((n) => n.launchCorpus)).toHaveLength(30)
    expect(engine.nodes.filter((n) => !n.launchCorpus)).toHaveLength(74)
    const launchIds = engine.nodes.filter((n) => n.launchCorpus).map((n) => n.stgoId)
    expect(launchIds).toContain('STGO_104')
    expect(launchIds).toContain('STGO_33')
    expect(launchIds).not.toContain('STGO_23')
    expect(engine.nodes.find((n) => n.stgoId === 'STGO_33')?.launchRuntimeDisposition).not.toBe(
      'RUNTIME_EXCLUDED_SEMANTIC',
    )
    // Frozen Gate 1B.3/1B.4 physical edges: STGO_05/23/33 remain off this adjacency slice.
    for (const blocked of ['STGO_05', 'STGO_23', 'STGO_33']) {
      expect(adj.eligibleStgoIds).not.toContain(blocked)
      expect(multi.poiMetroAccessEdges.some((e) => e.stgoId === blocked)).toBe(false)
    }
    expect(multi.physicalRouteGenerationEnabled).toBe(false)
  })

  it('never leaks secrets', () => {
    const raw = readFileSync(resolve(root, 'src/data/santiago/santiago_multimodal_graph.v0.1.json'), 'utf8')
    expect(raw).not.toMatch(/pk\.ey/)
    expect(raw).not.toMatch(/MAPBOX_ACCESS_TOKEN/)
  })
})
