#!/usr/bin/env npx tsx
/**
 * Gate 2B — emit provisional Santiago Launch30 narrative graph artifact.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildLaunch30NarrativeGraph } from '../../src/engine/narrative/propose-narrative-edges'

const ROOT = resolve(__dirname, '../..')
const OUT = resolve(ROOT, 'src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json')

function main() {
  const graph = buildLaunch30NarrativeGraph(ROOT)
  mkdirSync(resolve(ROOT, 'src/data/santiago/narrative'), { recursive: true })
  writeFileSync(OUT, JSON.stringify(graph, null, 2) + '\n', 'utf8')
  console.log(
    JSON.stringify(
      {
        out: 'src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json',
        nodes: graph.nodeCount,
        edges: graph.edgeCount,
        runtimeEligible: graph.runtimeEligibleEdgeCount,
        pendingEvidence: graph.nonRuntimePendingEvidenceCount,
        avgOut: graph.qa.averageOutgoingDegree,
        isolated: graph.qa.isolatedNarrativeNodes,
        relationTypes: graph.qa.relationTypeDistribution,
      },
      null,
      2,
    ),
  )
}

main()
