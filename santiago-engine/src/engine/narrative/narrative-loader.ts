/**
 * Gate 2B — load provisional Santiago Launch30 narrative graph artifact.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { NarrativeEdge, NarrativeGraphArtifact } from '@/src/engine/narrative/narrative-types'

const ROOT = resolve(__dirname, '../../..')
const REL = 'src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json'

export function loadLaunch30NarrativeGraph(root = ROOT): NarrativeGraphArtifact {
  const raw = JSON.parse(readFileSync(resolve(root, REL), 'utf8')) as NarrativeGraphArtifact
  if (raw.gate !== '2B') throw new Error('narrative graph gate mismatch')
  if (raw.calibrationStatus !== 'PROVISIONAL') throw new Error('narrative graph must remain PROVISIONAL')
  if (raw.calibrationApproved !== false) throw new Error('calibrationApproved must be false')
  if (raw.engineUsingProvisionalEditorialCalibration !== true) {
    throw new Error('engineUsingProvisionalEditorialCalibration must be true')
  }
  if (raw.physicalRouteGenerationEnabled !== false) {
    throw new Error('physicalRouteGenerationEnabled must remain false')
  }
  if (raw.nodeCount !== 30 || raw.nodes.length !== 30) {
    throw new Error(`expected 30 narrative nodes, got ${raw.nodeCount}`)
  }
  return raw
}

export function narrativeEdgesFrom(fromId: string, graph?: NarrativeGraphArtifact): NarrativeEdge[] {
  const g = graph ?? loadLaunch30NarrativeGraph()
  return g.edges.filter((e) => e.from === fromId)
}

export function runtimeEligibleEdges(graph?: NarrativeGraphArtifact): NarrativeEdge[] {
  const g = graph ?? loadLaunch30NarrativeGraph()
  return g.edges.filter((e) => e.runtimeEligible)
}
