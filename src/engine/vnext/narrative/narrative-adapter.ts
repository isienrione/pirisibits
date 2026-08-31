/**
 * Gate 2E.6 — Narrative graph → Experience adapter (no fabricated edges).
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { legacyCoreExperienceId } from '@/src/engine/vnext/place/legacy-adapter'

export type ExperienceNarrativeRelation = {
  fromExperienceId: string
  toExperienceId: string
  relationId: string | null
  relationType: string | null
  transferable: boolean
  provenance: string
  evidence: string
}

export function adaptNarrativeRelationsToExperiences(args: {
  root: string
  fromToPairs?: Array<{ fromStgoId: string; toStgoId: string; relationId?: string; relationType?: string }>
}): ExperienceNarrativeRelation[] {
  const pairs = args.fromToPairs ?? loadNarrativePairs(args.root)
  return pairs.map((p) => ({
    fromExperienceId: legacyCoreExperienceId(p.fromStgoId),
    toExperienceId: legacyCoreExperienceId(p.toStgoId),
    relationId: p.relationId ?? null,
    relationType: p.relationType ?? null,
    transferable: true,
    provenance: 'EXISTING_NARRATIVE_GRAPH',
    evidence: 'PLACE_LEVEL_RELATION_ADAPTED',
  }))
}

function loadNarrativePairs(root: string): Array<{ fromStgoId: string; toStgoId: string; relationId?: string; relationType?: string }> {
  const candidates = [
    resolve(root, 'src/data/santiago/narrative/narrative_edges.proposed.v0.1.json'),
    resolve(root, 'src/data/santiago/routes/narrative-edges.v0.1.json'),
  ]
  for (const path of candidates) {
    if (!existsSync(path)) continue
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8'))
      const edges = Array.isArray(raw) ? raw : raw.edges ?? raw.relations ?? []
      return edges
        .map((e: any) => ({
          fromStgoId: e.fromStgoId ?? e.from ?? e.source,
          toStgoId: e.toStgoId ?? e.to ?? e.target,
          relationId: e.id ?? e.relationId,
          relationType: e.type ?? e.relationType,
        }))
        .filter((e: any) => e.fromStgoId && e.toStgoId)
    } catch {
      /* try next */
    }
  }
  return []
}
