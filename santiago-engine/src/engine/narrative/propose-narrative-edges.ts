/**
 * Gate 2B — offline sparse narrative edge proposal from structured metadata.
 * No invented historical causality. UNKNOWN ≠ 0.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  GATE_2B_SOURCE_CHECKPOINT,
  MAX_OUTGOING_EDGES_PER_NODE,
  RUNTIME_EDGE_SCORE_FLOOR,
  THEME_CONTRAST_MAX_SIM,
  THEME_SIMILARITY_ECHO,
  THEME_SIMILARITY_SETUP,
} from '@/src/engine/narrative/narrative-constants'
import {
  compareNarrativeScores,
  scoreNarrativeEdge,
  themeSimilarity,
  topThemes,
  type NarrativeScoreNodeView,
} from '@/src/engine/narrative/narrative-edge-score'
import type {
  NarrativeConfidence,
  NarrativeEdge,
  NarrativeGraphArtifact,
  NarrativeGraphQa,
  NarrativeNodeSummary,
  NarrativeProvenance,
  NarrativeRelationType,
} from '@/src/engine/narrative/narrative-types'
import { loadEditorialCalibration } from '@/src/engine/loadCalibration'
import type { SemanticCalibrationRecord } from '@/src/engine/semanticTypes'
import type { ThemeCode } from '@/src/lib/city-graph/types'
import { THEME_CODES } from '@/src/engine/taxonomy'

const ROOT = resolve(__dirname, '../../..')

type WalkLink = { distanceM: number; durationMin: number; source: 'PEDESTRIAN_ADJACENCY' | 'COORDINATE_HAVERSINE' }

function isNum(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v)
}

function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const la1 = toRad(a.lat)
  const la2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

function poiLatLng(rec: SemanticCalibrationRecord): { lat: number; lng: number } | null {
  const c = rec.coordinates as
    | {
        poiCoordinate?: { lat?: number; lng?: number }
        experiencePoint?: { lat?: number; lng?: number }
      }
    | undefined
  const poi = c?.poiCoordinate
  if (isNum(poi?.lat) && isNum(poi?.lng)) return { lat: poi!.lat!, lng: poi!.lng! }
  const exp = c?.experiencePoint
  if (isNum(exp?.lat) && isNum(exp?.lng)) return { lat: exp!.lat!, lng: exp!.lng! }
  return null
}

function availability(
  vector: Record<string, number | null> | undefined,
  keys: string[],
): 'COMPLETE' | 'PARTIAL' | 'UNKNOWN' {
  if (!vector) return 'UNKNOWN'
  const known = keys.filter((k) => isNum(vector[k])).length
  if (known === 0) return 'UNKNOWN'
  if (known < keys.length) return 'PARTIAL'
  return 'COMPLETE'
}

function mapProvenance(raw: string | undefined): NarrativeProvenance {
  const s = String(raw || 'UNKNOWN')
  if (s === 'CURATOR_APPROVED') return 'CURATOR_APPROVED'
  if (s === 'FOUNDER_EDITED') return 'FOUNDER_EDITED'
  if (s === 'FOUNDER_PRECALIBRATED') return 'FOUNDER_PRECALIBRATED'
  if (s.includes('AI_PROPOSED')) return 'AI_PROPOSED_UNVERIFIED'
  if (s === 'UNKNOWN' || s.includes('UNKNOWN')) return 'UNKNOWN'
  return 'AI_PROPOSED_UNVERIFIED'
}

function loadLaunchCorpusIds(root = ROOT): string[] {
  const corpus = JSON.parse(
    readFileSync(resolve(root, 'src/data/santiago/santiago_launch_corpus.v0.1.json'), 'utf8'),
  )
  const ids = (corpus.ids || corpus.stgoIds || []) as string[]
  if (ids.length !== 30) throw new Error(`Launch corpus must be 30, got ${ids.length}`)
  return [...ids].sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]))
}

function loadWalkIndex(root = ROOT): Map<string, WalkLink> {
  const adj = JSON.parse(
    readFileSync(resolve(root, 'src/data/santiago/santiago_pedestrian_adjacency.v0.2.json'), 'utf8'),
  )
  const map = new Map<string, WalkLink>()
  for (const e of adj.edges || []) {
    const a = e.fromPoiId as string
    const b = e.toPoiId as string
    const link: WalkLink = {
      distanceM: Number(e.distanceM),
      durationMin: Number(e.durationMin ?? e.durationS / 60),
      source: 'PEDESTRIAN_ADJACENCY',
    }
    map.set(`${a}>${b}`, link)
    map.set(`${b}>${a}`, link)
  }
  return map
}

function loadEnginePoiCoords(root = ROOT): Map<string, { lat: number; lng: number }> {
  const eng = JSON.parse(
    readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
  )
  const map = new Map<string, { lat: number; lng: number }>()
  for (const n of eng.nodes || []) {
    const poi = n.poiCoordinate || n.experiencePointCoordinate
    if (poi && isNum(poi.lat) && isNum(poi.lng)) {
      map.set(n.stgoId, { lat: poi.lat, lng: poi.lng })
    }
  }
  return map
}

function resolveNodeLatLng(
  rec: SemanticCalibrationRecord,
  engineCoords: Map<string, { lat: number; lng: number }>,
): { lat: number; lng: number } | null {
  return poiLatLng(rec) || engineCoords.get(rec.stgoId) || null
}

function resolveSpatialLink(
  from: SemanticCalibrationRecord,
  to: SemanticCalibrationRecord,
  walkIndex: Map<string, WalkLink>,
  engineCoords: Map<string, { lat: number; lng: number }>,
): WalkLink | undefined {
  const key = `${from.stgoId}>${to.stgoId}`
  const existing = walkIndex.get(key)
  if (existing) return existing
  const a = resolveNodeLatLng(from, engineCoords)
  const b = resolveNodeLatLng(to, engineCoords)
  if (!a || !b) return undefined
  const distanceM = Math.round(haversineM(a, b) * 10) / 10
  return {
    distanceM,
    durationMin: Math.round((distanceM / 80) * 10) / 10,
    source: 'COORDINATE_HAVERSINE',
  }
}

function toView(rec: SemanticCalibrationRecord): NarrativeScoreNodeView {
  const sm = rec.structuralMetrics || {
    heritage_depth: null,
    anchor_density: null,
    micro_reveal: null,
    polish: null,
  }
  return {
    stgoId: rec.stgoId,
    displayName: rec.displayName,
    tier: rec.tier,
    editorialRole: rec.editorialRole,
    thematicVector: rec.thematicVector,
    structuralMetrics: {
      heritage_depth: sm.heritage_depth ?? null,
      anchor_density: sm.anchor_density ?? null,
      micro_reveal: sm.micro_reveal ?? null,
      polish: sm.polish ?? null,
    },
    thematicAvailability: availability(rec.thematicVector, [...THEME_CODES]),
    structuralAvailability: availability(sm as Record<string, number | null>, [
      'heritage_depth',
      'anchor_density',
      'micro_reveal',
      'polish',
    ]),
  }
}

function toNodeSummary(rec: SemanticCalibrationRecord): NarrativeNodeSummary {
  const sm = (rec.structuralMetrics || {}) as Record<string, number | null>
  return {
    stgoId: rec.stgoId,
    displayName: rec.displayName,
    canonicalName: rec.canonicalName ?? rec.displayName,
    tier: rec.tier,
    editorialRole: rec.editorialRole,
    thematicVectorProvenance: String(rec.thematicVectorProvenance || 'UNKNOWN'),
    structuralMetricsProvenance: String(rec.structuralMetricsProvenance || 'UNKNOWN'),
    thematicAvailability: availability(rec.thematicVector, [...THEME_CODES]),
    structuralAvailability: availability(sm, [
      'heritage_depth',
      'anchor_density',
      'micro_reveal',
      'polish',
    ]),
    physicalStatus: rec.physicalStatus ?? null,
    physicalRouteGenerationEligible: rec.physicalRouteGenerationEligible ?? null,
    launchCorpus: true,
    inventoryProvenance: rec.stgoId === 'STGO_104' ? 'FOUNDER_EXTENSION' : 'ORIGINAL_103_SEED',
    legacyAliasAuditOnly: rec.legacyAlias?.alias ?? null,
  }
}

type ProposalSeed = {
  relationType: NarrativeRelationType
  reason: string
  hooks: string[]
  antiTags: string[]
  prerequisites: string[]
  questionOpened: string | null
  questionResolved: string | null
  hasEditorialCausalEvidence: boolean
  forceNonRuntime?: boolean
  nonRuntimeReason?: string
  semanticLimitations?: string[]
}

function proposeRelationTypes(
  from: NarrativeScoreNodeView,
  to: NarrativeScoreNodeView,
  walk: WalkLink | undefined,
): ProposalSeed[] {
  const out: ProposalSeed[] = []
  const sim = themeSimilarity(from.thematicVector, to.thematicVector)
  const fromThemes = topThemes(from.thematicVector, 3)
  const toThemes = topThemes(to.thematicVector, 3)
  const shared = fromThemes.filter((t) => toThemes.includes(t))
  const fromTier = `${from.tier || ''} ${from.editorialRole || ''}`.toLowerCase()
  const toTier = `${to.tier || ''} ${to.editorialRole || ''}`.toLowerCase()
  const unknownSem =
    from.thematicAvailability === 'UNKNOWN' || to.thematicAvailability === 'UNKNOWN'

  if (unknownSem) {
    // Identity/spatially-supported proposals only — no invented thematic profile.
    if (walk && walk.distanceM <= 1200) {
      out.push({
        relationType: 'material_transition',
        reason:
          'Spatially proximate Launch30 pair; thematic continuity unavailable because one or both nodes still have UNKNOWN semantics.',
        hooks: ['spatial_proximity', 'identity_only'],
        antiTags: ['unknown_semantics'],
        prerequisites: [],
        questionOpened: null,
        questionResolved: null,
        hasEditorialCausalEvidence: false,
        semanticLimitations: [
          'UNKNOWN thematic/structural profile present — not coerced to zero',
          'Edge limited to identity/spatial support until founder calibration',
          walk.source === 'COORDINATE_HAVERSINE'
            ? 'Spatial legibility from coordinate distance (physical edges pending enrichment)'
            : 'Spatial legibility from pedestrian adjacency',
        ],
      })
    }
    return out
  }

  if (sim != null && sim >= THEME_SIMILARITY_ECHO && shared.length) {
    out.push({
      relationType: 'thematic_echo',
      reason: `Strong thematic continuity (${shared.join(', ')}) with structured vector overlap.`,
      hooks: shared.map((t) => `theme_${t}`),
      antiTags: shared.map((t) => `theme_${t}`),
      prerequisites: [],
      questionOpened: null,
      questionResolved: null,
      hasEditorialCausalEvidence: false,
    })
  }

  if (sim != null && sim >= THEME_SIMILARITY_SETUP && shared.length) {
    out.push({
      relationType: 'sets_up',
      reason: `Shared thematic spine (${shared.join(', ')}) can set up a later deepening without claiming historical causation.`,
      hooks: ['setup_theme', ...shared.map((t) => `theme_${t}`)],
      antiTags: ['setup_chain'],
      prerequisites: [],
      questionOpened: `what_else_in_${shared[0]}`,
      questionResolved: null,
      hasEditorialCausalEvidence: false,
    })
    out.push({
      relationType: 'deepens_context',
      reason: `Continuing ${shared[0]} context from ${from.stgoId} into ${to.stgoId} using calibrated theme overlap.`,
      hooks: ['deepen_theme'],
      antiTags: shared.map((t) => `theme_${t}`),
      prerequisites: shared[0] ? [`theme:${shared[0]}`] : [],
      questionOpened: null,
      questionResolved: `what_else_in_${shared[0]}`,
      hasEditorialCausalEvidence: false,
    })
  }

  const fp = from.structuralMetrics?.polish
  const tp = to.structuralMetrics?.polish
  const fh = from.structuralMetrics?.heritage_depth
  const th = to.structuralMetrics?.heritage_depth
  const fa = from.structuralMetrics?.anchor_density
  const ta = to.structuralMetrics?.anchor_density
  const tm = to.structuralMetrics?.micro_reveal

  if (
    (sim != null && sim <= THEME_CONTRAST_MAX_SIM) ||
    (isNum(fp) && isNum(tp) && Math.abs(fp - tp) >= 0.35) ||
    (isNum(fh) && isNum(th) && Math.abs(fh - th) >= 0.35)
  ) {
    out.push({
      relationType: 'contrast',
      reason: 'Useful structural/thematic contrast between calibrated profiles (not a historical opposition claim).',
      hooks: ['contrast_shift'],
      antiTags: ['contrast_shift'],
      prerequisites: [],
      questionOpened: null,
      questionResolved: null,
      hasEditorialCausalEvidence: false,
    })
  }

  if (
    (/anchor|canonical/.test(fromTier) && /micro/.test(toTier)) ||
    (isNum(tm) && tm >= 0.55)
  ) {
    out.push({
      relationType: 'reveal',
      reason: 'Anchor/pocket → micro-reveal transition supported by tier and/or micro_reveal metric.',
      hooks: ['micro_reveal'],
      antiTags: ['micro_reveal'],
      prerequisites: ['has_anchor'],
      questionOpened: 'hidden_detail',
      questionResolved: null,
      hasEditorialCausalEvidence: false,
    })
  }

  if (
    (/micro|pocket|thematic/.test(fromTier) && /anchor|canonical/.test(toTier)) ||
    (isNum(fa) && isNum(ta) && ta > fa + 0.15) ||
    (isNum(fh) && isNum(th) && th > fh + 0.15)
  ) {
    out.push({
      relationType: 'escalation',
      reason: 'Escalation toward denser heritage/anchor character using structural metrics and tier.',
      hooks: ['escalate_anchor'],
      antiTags: ['escalate_anchor'],
      prerequisites: [],
      questionOpened: null,
      questionResolved: null,
      hasEditorialCausalEvidence: false,
    })
  }

  if (
    (isNum(fp) && isNum(tp) && fp - tp >= 0.3) ||
    (isNum(fh) && fh >= 0.7 && (toThemes.includes('T5') || toThemes.includes('T7')))
  ) {
    out.push({
      relationType: 'relief',
      reason: 'Relief after high-polish/heritage intensity toward quieter or street-life texture.',
      hooks: ['relief_beat'],
      antiTags: ['relief_beat'],
      prerequisites: [],
      questionOpened: null,
      questionResolved: null,
      hasEditorialCausalEvidence: false,
    })
  }

  if (/anchor|canonical/.test(fromTier) && /pocket|thematic|micro/.test(toTier)) {
    out.push({
      relationType: 'material_transition',
      reason: 'Material scale shift from civic/architectural anchor grain to pocket/micro grain.',
      hooks: ['material_scale'],
      antiTags: ['material_scale'],
      prerequisites: [],
      questionOpened: null,
      questionResolved: null,
      hasEditorialCausalEvidence: false,
    })
  }

  if (
    (fromThemes.includes('T7') || fromThemes.includes('T2')) &&
    (toThemes.includes('T1A') || toThemes.includes('T9'))
  ) {
    out.push({
      relationType: 'social_transition',
      reason: 'Social texture shift from popular/culinary grain toward civic/high-craft framing.',
      hooks: ['social_texture'],
      antiTags: ['social_texture'],
      prerequisites: [],
      questionOpened: null,
      questionResolved: null,
      hasEditorialCausalEvidence: false,
    })
  }

  // Causal / resolve: only emit as NON_RUNTIME unless we have a structured setup tag pair.
  // We do not invent historical causation; withhold from runtime candidate scoring.
  if (shared.includes('T1B') && fromThemes.includes('T1A') && toThemes.includes('T1B')) {
    out.push({
      relationType: 'causal_followup',
      reason:
        'Potential civic→memory follow-up suggested by theme adjacency only — not verified historical causation.',
      hooks: ['memory_followup'],
      antiTags: ['memory_followup'],
      prerequisites: ['theme:T1A'],
      questionOpened: null,
      questionResolved: null,
      hasEditorialCausalEvidence: false,
      forceNonRuntime: true,
      nonRuntimeReason: 'NON_RUNTIME_PENDING_EDITORIAL_EVIDENCE',
      semanticLimitations: ['Unsupported causal claim withheld from runtime scoring'],
    })
  }

  // Spatial-only pairs with weak theme still get a soft material_transition if walkable.
  if (!out.length && walk && walk.distanceM <= 700) {
    out.push({
      relationType: 'material_transition',
      reason: 'Short walk adjacency with limited thematic overlap — spatial legibility only.',
      hooks: ['spatial_proximity'],
      antiTags: ['spatial_only'],
      prerequisites: [],
      questionOpened: null,
      questionResolved: null,
      hasEditorialCausalEvidence: false,
    })
  }

  return out
}

function confidenceFor(
  scoreTotal: number,
  provenance: NarrativeProvenance,
  limitations: string[] | undefined,
): NarrativeConfidence {
  if (limitations?.length || provenance === 'UNKNOWN' || provenance === 'AI_PROPOSED_UNVERIFIED') {
    if (scoreTotal >= 55) return 'MEDIUM'
    return 'LOW'
  }
  if (scoreTotal >= 62) return 'HIGH'
  if (scoreTotal >= 40) return 'MEDIUM'
  return 'LOW'
}

function buildEdge(
  fromRec: SemanticCalibrationRecord,
  toRec: SemanticCalibrationRecord,
  seed: ProposalSeed,
  walk: WalkLink | undefined,
): NarrativeEdge {
  const from = toView(fromRec)
  const to = toView(toRec)
  const score = scoreNarrativeEdge(
    from,
    to,
    {
      relationType: seed.relationType,
      spatialDistanceM: walk?.distanceM ?? null,
      prerequisites: seed.prerequisites,
      prerequisitesSatisfied: seed.prerequisites.length === 0,
      unresolvedPrerequisites: [],
      repetitionTags: seed.antiTags,
      repetitionTagsSeen: [],
      recentRelationTypes: [],
    },
    { hasEditorialCausalEvidence: seed.hasEditorialCausalEvidence },
  )

  let provenance = mapProvenance(
    [fromRec.thematicVectorProvenance, toRec.thematicVectorProvenance]
      .map(String)
      .find((p) => p.includes('AI_PROPOSED')) ||
      fromRec.thematicVectorProvenance ||
      'FOUNDER_PRECALIBRATED',
  )
  if (seed.forceNonRuntime) provenance = 'AI_PROPOSED_UNVERIFIED'

  const runtimeEligible =
    !seed.forceNonRuntime &&
    score.total >= RUNTIME_EDGE_SCORE_FLOOR &&
    seed.relationType !== 'causal_followup'

  const themesSupported = Array.from(
    new Set([...topThemes(from.thematicVector, 2), ...topThemes(to.thematicVector, 2)]),
  ) as ThemeCode[]

  const confidence = seed.forceNonRuntime
    ? 'LOW'
    : confidenceFor(score.total, provenance, seed.semanticLimitations)
  const whyLinked = seed.reason
  const whyThisRelationType = `Selected ${seed.relationType} from structured metadata (themes/tier/metrics/spatial), without inventing historical events.`

  return {
    edgeId: `NARR|${from.stgoId}|${to.stgoId}|${seed.relationType}`,
    from: from.stgoId,
    to: to.stgoId,
    relationType: seed.relationType,
    strength: score.total,
    themesSupported,
    narrativeHooksSupported: seed.hooks,
    reason: seed.reason,
    provenance,
    confidence,
    prerequisites: seed.prerequisites,
    antiRepetitionTags: seed.antiTags,
    optionalQuestionOpened: seed.questionOpened,
    optionalQuestionResolved: seed.questionResolved,
    runtimeEligible,
    runtimeExclusionReason: runtimeEligible
      ? null
      : seed.nonRuntimeReason ||
        (score.total < RUNTIME_EDGE_SCORE_FLOOR ? 'BELOW_RUNTIME_SCORE_FLOOR' : 'NOT_RUNTIME_ELIGIBLE'),
    physicalStatusFrom: fromRec.physicalStatus ?? null,
    physicalStatusTo: toRec.physicalStatus ?? null,
    physicalRouteGenerationEligibleFrom: fromRec.physicalRouteGenerationEligible ?? null,
    physicalRouteGenerationEligibleTo: toRec.physicalRouteGenerationEligible ?? null,
    narrativeDoesNotImplyPhysicalFeasibility: true,
    spatialDistanceM: walk?.distanceM ?? null,
    spatialDurationMin: walk?.durationMin ?? null,
    score,
    explainability: {
      whyLinked,
      whyThisRelationType,
      positiveFactors: score.positiveFactors,
      negativeFactors: score.negativeFactors,
      confidence,
      provenance,
      scoreBreakdown: score,
    },
    semanticLimitations: seed.semanticLimitations,
  }
}

function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

function buildQa(
  nodeIds: string[],
  edges: NarrativeEdge[],
  withheldCausal: number,
): NarrativeGraphQa {
  const outgoing = new Map<string, number>()
  nodeIds.forEach((id) => outgoing.set(id, 0))
  const rel: Record<string, number> = {}
  const conf: Record<string, number> = {}
  const prov: Record<string, number> = {}
  for (const e of edges) {
    outgoing.set(e.from, (outgoing.get(e.from) || 0) + 1)
    rel[e.relationType] = (rel[e.relationType] || 0) + 1
    conf[e.confidence] = (conf[e.confidence] || 0) + 1
    prov[e.provenance] = (prov[e.provenance] || 0) + 1
  }
  const degrees = nodeIds.map((id) => outgoing.get(id) || 0)
  const runtime = edges.filter((e) => e.runtimeEligible)
  const pending = edges.filter((e) => e.runtimeExclusionReason === 'NON_RUNTIME_PENDING_EDITORIAL_EVIDENCE')
  const isolated = nodeIds.filter((id) => {
    const out = outgoing.get(id) || 0
    const incoming = edges.filter((e) => e.to === id).length
    return out + incoming === 0
  })
  const top = [...runtime]
    .sort((a, b) =>
      compareNarrativeScores(
        { total: a.score.total, relationType: a.relationType, from: a.from, to: a.to },
        { total: b.score.total, relationType: b.relationType, from: b.from, to: b.to },
      ),
    )
    .slice(0, 10)
    .map((e) => ({
      edgeId: e.edgeId,
      from: e.from,
      to: e.to,
      relationType: e.relationType,
      total: e.score.total,
      summary: e.explainability.whyLinked.slice(0, 140),
    }))
  const bottom = runtime.length
    ? Math.min(...runtime.map((e) => e.score.total))
    : null

  return {
    averageOutgoingDegree: Math.round((degrees.reduce((a, b) => a + b, 0) / Math.max(1, nodeIds.length)) * 100) / 100,
    medianOutgoingDegree: median(degrees),
    relationTypeDistribution: rel,
    confidenceDistribution: conf,
    provenanceDistribution: prov,
    isolatedNarrativeNodes: isolated,
    withheldUnsupportedCausalEdges: withheldCausal,
    top10StrongestEdges: top,
    bottomRuntimeEligibleScore: bottom,
    runtimeEligibleEdgeCount: runtime.length,
    nonRuntimePendingEvidenceCount: pending.length,
  }
}

/**
 * Build provisional Launch30 narrative graph artifact (pure function + filesystem inputs).
 */
export function buildLaunch30NarrativeGraph(root = ROOT): NarrativeGraphArtifact {
  const launchIds = loadLaunchCorpusIds(root)
  if (launchIds.includes('STGO_23')) throw new Error('STGO_23 must not be in Launch30')
  if (!launchIds.includes('STGO_33') || !launchIds.includes('STGO_104')) {
    throw new Error('Launch30 must include STGO_33 and STGO_104')
  }

  const cal = loadEditorialCalibration(root)
  const byId = new Map(cal.records.map((r) => [r.stgoId, r]))
  const records = launchIds.map((id) => {
    const r = byId.get(id)
    if (!r) throw new Error(`Missing editorial calibration for ${id}`)
    return r
  })

  const r33 = byId.get('STGO_33')!
  if (/funicular/i.test(r33.displayName)) {
    throw new Error('STGO_33 active name must not include Funicular')
  }

  const walk = loadWalkIndex(root)
  const engineCoords = loadEnginePoiCoords(root)
  const candidates: NarrativeEdge[] = []
  let withheldCausal = 0

  for (const from of records) {
    for (const to of records) {
      if (from.stgoId === to.stgoId) continue
      const link = resolveSpatialLink(from, to, walk, engineCoords)
      const seeds = proposeRelationTypes(toView(from), toView(to), link)
      for (const seed of seeds) {
        if (seed.forceNonRuntime && seed.relationType === 'causal_followup') {
          withheldCausal += 1
        }
        // Prefer spatially supported or thematically strong pairs — skip remote weak pairs.
        const sim = themeSimilarity(from.thematicVector, to.thematicVector)
        const spatiallyClose = link && link.distanceM <= 1600
        const thematicallyUseful = sim != null && sim >= 0.35
        const structuralInteresting = seed.relationType !== 'thematic_echo'
        if (!spatiallyClose && !thematicallyUseful && !structuralInteresting) continue
        if (!spatiallyClose && sim != null && sim < 0.25 && seed.relationType === 'material_transition') continue
        candidates.push(buildEdge(from, to, seed, link))
      }
    }
  }

  // Always retain a capped set of non-runtime pending-evidence causal edges for QA visibility.
  const pendingCausal = candidates
    .filter((e) => e.runtimeExclusionReason === 'NON_RUNTIME_PENDING_EDITORIAL_EVIDENCE')
    .sort((a, b) =>
      compareNarrativeScores(
        { total: a.score.total, relationType: a.relationType, from: a.from, to: a.to },
        { total: b.score.total, relationType: b.relationType, from: b.from, to: b.to },
      ),
    )
    .slice(0, 12)

  // Per-from keep best edges by score (sparse).
  const byFrom = new Map<string, NarrativeEdge[]>()
  for (const e of candidates) {
    if (e.runtimeExclusionReason === 'NON_RUNTIME_PENDING_EDITORIAL_EVIDENCE') continue
    const list = byFrom.get(e.from) || []
    list.push(e)
    byFrom.set(e.from, list)
  }
  const edges: NarrativeEdge[] = []
  for (const id of launchIds) {
    const list = (byFrom.get(id) || []).sort((a, b) =>
      compareNarrativeScores(
        { total: a.score.total, relationType: a.relationType, from: a.from, to: a.to },
        { total: b.score.total, relationType: b.relationType, from: b.from, to: b.to },
      ),
    )
    const kept: NarrativeEdge[] = []
    for (const e of list) {
      if (kept.length >= MAX_OUTGOING_EDGES_PER_NODE) break
      if ([...kept].some((k) => k.to === e.to && k.score.total >= e.score.total)) continue
      kept.push(e)
    }
    edges.push(...kept)
  }
  // Merge pending causal (non-runtime) without displacing runtime sparsity budget.
  for (const e of pendingCausal) {
    if (!edges.some((x) => x.edgeId === e.edgeId)) edges.push(e)
  }

  edges.sort((a, b) =>
    compareNarrativeScores(
      { total: a.score.total, relationType: a.relationType, from: a.from, to: a.to },
      { total: b.score.total, relationType: b.relationType, from: b.from, to: b.to },
    ),
  )

  const nodes = records.map(toNodeSummary)
  const qa = buildQa(
    launchIds,
    edges,
    withheldCausal,
  )

  return {
    schemaVersion: 'santiago-launch30-narrative-graph.proposed.v0.1',
    gate: '2B',
    status: 'PROPOSED',
    calibrationStatus: 'PROVISIONAL',
    calibrationApproved: false,
    engineUsingProvisionalEditorialCalibration: true,
    physicalRouteGenerationEnabled: false,
    sourceCheckpointSha: GATE_2B_SOURCE_CHECKPOINT,
    launchCorpusArtifact: 'src/data/santiago/santiago_launch_corpus.v0.1.json',
    editorialCalibrationArtifact:
      'src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json',
    nodeCount: nodes.length,
    edgeCount: edges.length,
    runtimeEligibleEdgeCount: qa.runtimeEligibleEdgeCount,
    nonRuntimePendingEvidenceCount: qa.nonRuntimePendingEvidenceCount,
    nodes,
    edges,
    qa,
    notes: [
      'PROVISIONAL narrative graph built from proposed editorial calibration.',
      'EDITORIAL_CALIBRATION_CURATOR_APPROVED remains false.',
      'Narrative desirability does not imply physical feasibility.',
      'STGO_104 UNKNOWN semantics are not coerced to zero.',
      'Unsupported causal edges are non-runtime pending editorial evidence.',
      'Gate 2C route composition is not started.',
    ],
  }
}
