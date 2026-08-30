import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MULTIMODAL_PHYSICAL_GRAPH_READY,
  PHYSICAL_LAYER_V0_1_READY,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
} from '../city-graph/flags'

const root = resolve(__dirname, '../../..')

describe('Gate 1B.5 Santiago physical graph V0.1 freeze', () => {
  it('freezes physical layer ready while keeping traveler routing disabled', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(MULTIMODAL_PHYSICAL_GRAPH_READY).toBe(true)
    expect(PHYSICAL_LAYER_V0_1_READY).toBe(true)
  })

  it('promotes STGO_05 Terraza Neptuno and stages STGO_32 without summit implication', () => {
    const engine = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
    )
    const membership = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_launch_runtime_membership.v0.1.json'), 'utf8'),
    )
    const by = Object.fromEntries(engine.nodes.map((n: { stgoId: string }) => [n.stgoId, n]))
    expect(by.STGO_05.launchRuntimeDisposition).toBe('RUNTIME_READY')
    expect(by.STGO_05.runtimePhysicalEndpoint.pointId).toBe('terraza_neptuno')
    expect(by.STGO_32.launchRuntimeDisposition).toBe('RUNTIME_STAGED')
    expect(by.STGO_32.sanCristobalStaging.routingEndpoint).toBe('funicular')
    expect(by.STGO_32.sanCristobalStaging.summitImplied).toBe(false)
    expect(by.STGO_23.launchRuntimeDisposition).toBe('RUNTIME_EXCLUDED_RESEARCH')
    expect(by.STGO_23.launchCorpus).toBe(false)
    expect(by.STGO_33.launchRuntimeDisposition).toBe('ACTIVE_LAUNCH')
    expect(by.STGO_33.launchRuntimeDisposition).not.toBe('RUNTIME_EXCLUDED_SEMANTIC')
    expect(by.STGO_33.physicalRouteGenerationEligible).toBe(false)
    expect(by.STGO_33.launchPhysicalReadiness).toBe('PHYSICAL_ELIGIBLE_PENDING_REGRESSION')
    expect(by.STGO_33.displayName).toBe('Gárgola de Luciano K')
    expect(membership.runtimeReadyCount).toBe(27)
    expect(membership.runtimeStagedCount).toBe(1)
    expect(membership.runtimeExcludedCount).toBe(1)
    expect(membership.runtimeRoutingIds).toHaveLength(28)
    expect(membership.byDisposition.ACTIVE_LAUNCH).toEqual(
      expect.arrayContaining(['STGO_33', 'STGO_104']),
    )
  })

  it('preserves Gate 1B.3 provider edges and freezes sparse/multimodal v0.3 artifacts', () => {
    const provider = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_physical_edges.v0.1.json'), 'utf8'),
    )
    const adj = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_pedestrian_adjacency.v0.2.json'), 'utf8'),
    )
    const multi = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_multimodal_graph.v0.3.json'), 'utf8'),
    )
    const manifest = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_physical_graph_manifest.v0.1.json'), 'utf8'),
    )
    expect(provider.counts.runtimeWalkEdges).toBe(598)
    expect(adj.graphHealth.connectedComponentCount).toBe(1)
    expect(adj.graphHealth.directedStronglyConnected).toBe(true)
    expect(adj.eligibleStgoIds).toContain('STGO_05')
    expect(adj.eligibleStgoIds).not.toContain('STGO_23')
    expect(multi.physicalLayerV01Ready).toBe(true)
    expect(multi.physicalRouteGenerationEnabled).toBe(false)
    expect(multi.thematicNarrativeUsed).toBe(false)
    expect(multi.canonicalTransitSource).toBe('dtpm_gtfs')
    expect(multi.counts.l7RuntimePresent).toBe(false)
    expect(multi.poiMetroAccessEdges.some((e: { stgoId: string }) => e.stgoId === 'STGO_05')).toBe(true)
    expect(manifest.featureFlags.PHYSICAL_LAYER_V0_1_READY).toBe(true)
    expect(manifest.featureFlags.PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
  })

  it('keeps inventory policy and never leaks secrets', () => {
    const engine = JSON.parse(
      readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
    )
    const multi = readFileSync(resolve(root, 'src/data/santiago/santiago_multimodal_graph.v0.3.json'), 'utf8')
    const adj = readFileSync(resolve(root, 'src/data/santiago/santiago_pedestrian_adjacency.v0.2.json'), 'utf8')
    expect(engine.nodeCount).toBe(105)
    expect(engine.nodes.filter((n: { launchCorpus?: boolean }) => n.launchCorpus).length).toBe(30)
    expect(engine.nodes.filter((n: { launchCorpus?: boolean }) => !n.launchCorpus).length).toBe(75)
    expect(engine.physicalRouteGenerationEnabled).toBe(false)
    expect(multi).not.toMatch(/pk\.ey/)
    expect(multi).not.toMatch(/MAPBOX_ACCESS_TOKEN/)
    expect(adj).not.toMatch(/pk\.ey/)
  })
})
