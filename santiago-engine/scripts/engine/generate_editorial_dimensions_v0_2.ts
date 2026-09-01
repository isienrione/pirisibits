#!/usr/bin/env npx tsx
/**
 * Gate 2E.2A — derive proposed editorial dimensions V0.2 for all 104 Santiago nodes.
 *
 * Reads founder semantic calibration; emits AI-proposed / source-derived dimensions.
 * Does NOT fabricate tourism facts. UNKNOWN inputs remain UNKNOWN (never coerced to zero).
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { SemanticCalibrationRecord } from '../../src/engine/semanticTypes'
import type {
  EditorialDimensionKey,
  EditorialDimensionValue,
  EditorialDimensionsRecord,
  ProvenanceClass,
  ScoreConfidence,
} from '../../src/engine/scoring/v0.2/scoring-types'
import { clamp01, isKnown, round2 } from '../../src/engine/scoring/v0.2/utils'

const ROOT = resolve(__dirname, '../..')
const INPUT = resolve(ROOT, 'src/data/santiago/santiago_semantic_calibration.v0.1.json')
const OUTPUT = resolve(ROOT, 'src/data/santiago/curation/santiago_editorial_dimensions.proposed.v0.2.json')

const THEME_CODES = ['T1A', 'T1B', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'] as const
const REQUIRED: EditorialDimensionKey[] = [
  'essentiality',
  'discoveryDensity',
  'surprise',
  'orientationValue',
  'lingerValue',
]
const OPTIONAL: EditorialDimensionKey[] = [
  'visualPayoff',
  'storyDepth',
  'localness',
  'transitionValue',
  'senseOfPlace',
]

const TIER_ANCHOR: Record<string, number> = {
  canonical_anchor: 0.85,
  thematic_pocket: 0.25,
  micro_reveal: 0.15,
}
const TIER_POCKET: Record<string, number> = {
  canonical_anchor: 0.2,
  thematic_pocket: 0.8,
  micro_reveal: 0.55,
}

const ROLE_ESSENTIALITY: Record<string, number> = {
  anchor: 0.85,
  civic: 0.8,
  museum: 0.75,
  memory: 0.7,
  plaza: 0.55,
  architecture: 0.5,
  culture: 0.5,
  pocket: 0.35,
  barrio: 0.3,
  market: 0.4,
  nature: 0.35,
  viewpoint: 0.4,
  micro: 0.15,
}

const ROLE_POCKET_MICRO: Record<string, number> = {
  pocket: 0.85,
  micro: 0.75,
  barrio: 0.65,
  market: 0.6,
  plaza: 0.45,
  architecture: 0.4,
  culture: 0.35,
  nature: 0.35,
  viewpoint: 0.3,
  civic: 0.2,
  museum: 0.25,
  memory: 0.2,
  anchor: 0.15,
}

const ROLE_LINGER: Record<string, number> = {
  museum: 0.85,
  culture: 0.8,
  memory: 0.75,
  market: 0.7,
  pocket: 0.65,
  barrio: 0.6,
  architecture: 0.55,
  plaza: 0.45,
  civic: 0.4,
  anchor: 0.35,
  micro: 0.3,
  nature: 0.55,
  viewpoint: 0.4,
}

const ROLE_LOCAL: Record<string, number> = {
  market: 0.85,
  barrio: 0.8,
  micro: 0.7,
  pocket: 0.55,
  plaza: 0.35,
}

const ROLE_PLACE: Record<string, number> = {
  barrio: 0.85,
  nature: 0.75,
  plaza: 0.65,
  market: 0.6,
  pocket: 0.55,
  viewpoint: 0.5,
}

const ROLE_TRANSITION: Record<string, number> = {
  plaza: 0.75,
  barrio: 0.55,
  civic: 0.5,
  anchor: 0.35,
}

type BlendPart = { v: number | null; w: number; label: string }

function blend(parts: BlendPart[]): { value: number | null; known: number; total: number; labels: string[] } {
  let num = 0
  let den = 0
  let known = 0
  const labels: string[] = []
  for (const p of parts) {
    if (!isKnown(p.v)) continue
    known += 1
    num += clamp01(p.v!) * p.w
    den += p.w
    labels.push(p.label)
  }
  if (den <= 0) return { value: null, known: 0, total: parts.length, labels: [] }
  return { value: round2(num / den), known, total: parts.length, labels }
}

function metric(rec: SemanticCalibrationRecord, key: string): number | null {
  const v = rec.structuralMetrics?.[key]
  return isKnown(v) ? clamp01(v!) : null
}

function theme(rec: SemanticCalibrationRecord, code: string): number | null {
  const v = rec.thematicVector?.[code as keyof typeof rec.thematicVector]
  return isKnown(v) ? clamp01(v!) : null
}

function tierLookup(map: Record<string, number>, tier: string | null | undefined): number | null {
  if (!tier) return null
  return map[tier] ?? null
}

function roleLookup(map: Record<string, number>, role: string | null | undefined): number | null {
  if (!role) return null
  return map[role] ?? null
}

function themeTagCount(rec: SemanticCalibrationRecord): number | null {
  const tags = rec.derivedThemeTags ?? []
  if (!tags.length && rec.thematicVectorProvenance === 'UNKNOWN') return null
  return tags.length
}

function themeDiversity(rec: SemanticCalibrationRecord): number | null {
  const vals = THEME_CODES.map((c) => theme(rec, c)).filter(isKnown)
  if (!vals.length) return null
  return round2(Math.min(1, vals.length / 4))
}

function themePeak(rec: SemanticCalibrationRecord): number | null {
  const vals = THEME_CODES.map((c) => theme(rec, c)).filter(isKnown)
  if (!vals.length) return null
  return round2(Math.max(...vals))
}

function visitTypicalNorm(rec: SemanticCalibrationRecord): number | null {
  const t = rec.visitTime?.typical
  if (!isKnown(t)) return null
  return round2(clamp01(t! / 45))
}

function flagValue(rec: SemanticCalibrationRecord, key: string): number | null {
  const f = rec.flags?.[key]
  if (!f || f.status !== 'PRESENT') return null
  if (f.value === true) return 1
  if (f.value === false) return 0
  return null
}

function isFounderUnknownNode(rec: SemanticCalibrationRecord): boolean {
  const metrics = ['anchor_density', 'heritage_depth', 'micro_reveal', 'polish'] as const
  const metricsNull = metrics.every((k) => !isKnown(rec.structuralMetrics?.[k]))
  const themesNull = THEME_CODES.every((k) => !isKnown(rec.thematicVector?.[k as (typeof THEME_CODES)[number]]))
  return metricsNull && themesNull && rec.tier == null && rec.editorialRole == null
}

function provenanceFor(rec: SemanticCalibrationRecord): ProvenanceClass {
  if (isFounderUnknownNode(rec)) return 'UNKNOWN'
  if (rec.structuralMetricsProvenance === 'FOUNDER_PRECALIBRATED') return 'DERIVED_FROM_SOURCE'
  return 'AI_PROPOSED_UNVERIFIED'
}

function unknownDimension(label: string, rec: SemanticCalibrationRecord): EditorialDimensionValue {
  return {
    value: null,
    provenance: 'UNKNOWN',
    confidence: 'LOW',
    rationale: `No prior calibrated evidence exists for ${label} on ${rec.displayName} (${rec.stgoId}).`,
    whyNotHigher: 'UNKNOWN is not a numeric ceiling; no score has been founder-calibrated yet.',
    whyNotLower: 'UNKNOWN must not be coerced to zero or any incidental placeholder value.',
    evidenceLimitation:
      'Founder structural metrics, thematic vector, tier, and editorial role are all UNKNOWN for this node.',
    evidenceInputs: [],
    limitations: ['FOUNDER_CALIBRATION_REQUIRED', 'NO_STRUCTURAL_METRICS', 'NO_THEMATIC_VECTOR'],
    derivationMethod: 'DETERMINISTIC',
  }
}

function buildDimension(
  rec: SemanticCalibrationRecord,
  key: EditorialDimensionKey,
  label: string,
  parts: BlendPart[],
  opts?: {
    cap?: number
    extraLimitations?: string[]
    rationaleSuffix?: string
  },
): EditorialDimensionValue {
  const { value, known, total, labels } = blend(parts)
  const capped = value != null && opts?.cap != null ? round2(Math.min(value, opts.cap)) : value
  const coverage = total > 0 ? known / total : 0
  const confidence: ScoreConfidence = coverage >= 0.85 ? 'HIGH' : coverage >= 0.55 ? 'MEDIUM' : 'LOW'
  const prov = provenanceFor(rec)

  const inputSummary = labels.length ? labels.join(', ') : 'none'
  const rationale =
    capped == null
      ? `${label} UNAVAILABLE — insufficient known inputs (${inputSummary}).`
      : `${label}=${capped} derived deterministically from: ${inputSummary}.${opts?.rationaleSuffix ? ` ${opts.rationaleSuffix}` : ''}`

  const band = (v: number) => (v < 0.25 ? 'low' : v < 0.55 ? 'moderate' : v < 0.75 ? 'elevated' : 'high')

  return {
    value: capped,
    provenance: prov,
    confidence,
    rationale,
    whyNotHigher:
      capped == null
        ? 'Cannot justify a higher band without founder-supplied structural or thematic evidence.'
        : capped >= 0.95
          ? 'Already near ceiling; no additional founder evidence supports archetypal maximum.'
          : `Not in the top band because blended inputs (${inputSummary}) support a ${band(capped)} rather than archetypal weight.`,
    whyNotLower:
      capped == null
        ? 'UNKNOWN must not be treated as zero.'
        : capped <= 0.05
          ? 'Already at floor given conservative structural/thematic inputs.'
          : `Not lower because ${inputSummary} carry non-trivial calibrated weight for ${label}.`,
    evidenceLimitation:
      'Rationale reconstructs from founder calibration metadata only; no free-text field essays or on-site verification in-repo.',
    evidenceInputs: labels,
    limitations: [
      'AI_PROPOSED_DIMENSION',
      'NOT_CURATOR_APPROVED',
      ...(opts?.extraLimitations ?? []),
    ],
    derivationMethod: 'DETERMINISTIC',
  }
}

function deriveEssentiality(rec: SemanticCalibrationRecord): EditorialDimensionValue {
  if (isFounderUnknownNode(rec)) return unknownDimension('essentiality', rec)
  return buildDimension(rec, 'essentiality', 'Essentiality', [
    { v: metric(rec, 'anchor_density'), w: 0.35, label: 'structuralMetrics.anchor_density' },
    { v: metric(rec, 'heritage_depth'), w: 0.3, label: 'structuralMetrics.heritage_depth' },
    { v: tierLookup(TIER_ANCHOR, rec.tier), w: 0.2, label: `tier.${rec.tier ?? 'unknown'}` },
    { v: roleLookup(ROLE_ESSENTIALITY, rec.editorialRole), w: 0.15, label: `editorialRole.${rec.editorialRole ?? 'unknown'}` },
  ], {
    rationaleSuffix: 'Uses anchor/heritage/tier anchor signals — not inverse surprise.',
  })
}

function deriveSurprise(rec: SemanticCalibrationRecord): EditorialDimensionValue {
  if (isFounderUnknownNode(rec)) return unknownDimension('surprise', rec)
  const tierPocket = tierLookup(TIER_POCKET, rec.tier)
  const rolePocket = roleLookup(ROLE_POCKET_MICRO, rec.editorialRole)
  const roughness = metric(rec, 'polish') != null ? round2(1 - metric(rec, 'polish')!) : null
  const dim = buildDimension(rec, 'surprise', 'Surprise', [
    { v: metric(rec, 'micro_reveal'), w: 0.5, label: 'structuralMetrics.micro_reveal' },
    { v: tierPocket, w: 0.25, label: `tier.pocketSignal.${rec.tier ?? 'unknown'}` },
    { v: rolePocket, w: 0.15, label: `editorialRole.pocketMicroSignal.${rec.editorialRole ?? 'unknown'}` },
    { v: roughness, w: 0.1, label: 'inverse.structuralMetrics.polish' },
  ], {
    cap: 0.75,
    extraLimitations: ['CONSERVATIVE_CAP_0.75'],
    rationaleSuffix: 'Conservative pocket/micro-reveal blend; not derived as inverse essentiality.',
  })
  if (rec.tier === 'canonical_anchor' && dim.value != null) {
    dim.value = round2(Math.min(dim.value, 0.55))
    dim.limitations.push('ANCHOR_TIER_SURPRISE_DAMPING')
  }
  return dim
}

function deriveDiscoveryDensity(rec: SemanticCalibrationRecord): EditorialDimensionValue {
  if (isFounderUnknownNode(rec)) return unknownDimension('discoveryDensity', rec)
  const tagCount = themeTagCount(rec)
  const tagNorm = tagCount != null ? round2(Math.min(1, tagCount / 5)) : null
  return buildDimension(rec, 'discoveryDensity', 'Discovery density', [
    { v: metric(rec, 'micro_reveal'), w: 0.35, label: 'structuralMetrics.micro_reveal' },
    { v: metric(rec, 'polish'), w: 0.15, label: 'structuralMetrics.polish' },
    { v: tagNorm, w: 0.2, label: 'derivedThemeTags.countNormalized' },
    { v: tierLookup(TIER_POCKET, rec.tier), w: 0.2, label: `tier.pocketSignal.${rec.tier ?? 'unknown'}` },
    { v: roleLookup(ROLE_POCKET_MICRO, rec.editorialRole), w: 0.1, label: `editorialRole.pocketMicroSignal.${rec.editorialRole ?? 'unknown'}` },
  ])
}

function deriveOrientationValue(rec: SemanticCalibrationRecord): EditorialDimensionValue {
  if (isFounderUnknownNode(rec)) return unknownDimension('orientationValue', rec)
  const civicRole =
    rec.editorialRole === 'civic' || rec.editorialRole === 'plaza' || rec.editorialRole === 'anchor' ? 0.75 : null
  return buildDimension(rec, 'orientationValue', 'Orientation value', [
    { v: theme(rec, 'T1A'), w: 0.3, label: 'thematicVector.T1A' },
    { v: metric(rec, 'anchor_density'), w: 0.25, label: 'structuralMetrics.anchor_density' },
    { v: tierLookup(TIER_ANCHOR, rec.tier), w: 0.25, label: `tier.anchorSignal.${rec.tier ?? 'unknown'}` },
    { v: flagValue(rec, 'curbside_hub'), w: 0.1, label: 'flags.curbside_hub' },
    { v: civicRole, w: 0.1, label: `editorialRole.civicOrientation.${rec.editorialRole ?? 'unknown'}` },
  ])
}

function deriveLingerValue(rec: SemanticCalibrationRecord): EditorialDimensionValue {
  if (isFounderUnknownNode(rec)) return unknownDimension('lingerValue', rec)
  const visitProv = rec.visitTime?.provenance ?? 'UNKNOWN'
  const dim = buildDimension(rec, 'lingerValue', 'Linger value', [
    { v: metric(rec, 'heritage_depth'), w: 0.3, label: 'structuralMetrics.heritage_depth' },
    { v: visitTypicalNorm(rec), w: 0.25, label: 'visitTime.typicalNormalized' },
    { v: metric(rec, 'polish'), w: 0.15, label: 'structuralMetrics.polish' },
    { v: roleLookup(ROLE_LINGER, rec.editorialRole), w: 0.15, label: `editorialRole.lingerSignal.${rec.editorialRole ?? 'unknown'}` },
    { v: theme(rec, 'T1B'), w: 0.15, label: 'thematicVector.T1B' },
  ])
  if (visitTypicalNorm(rec) != null && String(visitProv).includes('AI_PROPOSED')) {
    dim.limitations.push('VISIT_TIME_AI_PROPOSED_INPUT')
  }
  return dim
}

function deriveVisualPayoff(rec: SemanticCalibrationRecord): EditorialDimensionValue | null {
  const t3 = theme(rec, 'T3')
  const t8 = theme(rec, 'T8')
  const t4 = theme(rec, 'T4')
  const polish = metric(rec, 'polish')
  const archRole = rec.editorialRole === 'architecture' || rec.editorialRole === 'viewpoint' ? 0.8 : null
  const supported =
    (t3 != null && t3 >= 0.45) ||
    (t8 != null && t8 >= 0.45) ||
    archRole != null ||
    (polish != null && polish >= 0.5 && t4 != null && t4 >= 0.3)
  if (!supported) return null
  return buildDimension(rec, 'visualPayoff', 'Visual payoff', [
    { v: t3, w: 0.4, label: 'thematicVector.T3' },
    { v: t8, w: 0.2, label: 'thematicVector.T8' },
    { v: polish, w: 0.25, label: 'structuralMetrics.polish' },
    { v: archRole, w: 0.15, label: `editorialRole.visualSignal.${rec.editorialRole ?? 'unknown'}` },
  ])
}

function deriveStoryDepth(rec: SemanticCalibrationRecord): EditorialDimensionValue | null {
  const t1b = theme(rec, 'T1B')
  const heritage = metric(rec, 'heritage_depth')
  const t6 = theme(rec, 'T6')
  const storyRole =
    rec.editorialRole === 'memory' || rec.editorialRole === 'museum' || rec.editorialRole === 'culture' ? 0.8 : null
  const supported =
    (t1b != null && t1b >= 0.45) ||
    (heritage != null && heritage >= 0.5) ||
    storyRole != null ||
    (t6 != null && t6 >= 0.45)
  if (!supported) return null
  return buildDimension(rec, 'storyDepth', 'Story depth', [
    { v: t1b, w: 0.35, label: 'thematicVector.T1B' },
    { v: heritage, w: 0.35, label: 'structuralMetrics.heritage_depth' },
    { v: storyRole, w: 0.2, label: `editorialRole.storySignal.${rec.editorialRole ?? 'unknown'}` },
    { v: t6, w: 0.1, label: 'thematicVector.T6' },
  ])
}

function deriveLocalness(rec: SemanticCalibrationRecord): EditorialDimensionValue | null {
  const t2 = theme(rec, 'T2')
  const t7 = theme(rec, 'T7')
  const polish = metric(rec, 'polish')
  const roughness = polish != null ? round2(1 - polish) : null
  const localRole = roleLookup(ROLE_LOCAL, rec.editorialRole)
  const supported =
    (t2 != null && t2 >= 0.45) ||
    (t7 != null && t7 >= 0.45) ||
    localRole != null ||
    (roughness != null && roughness >= 0.5 && t7 != null && t7 >= 0.3)
  if (!supported) return null
  return buildDimension(rec, 'localness', 'Localness', [
    { v: t2, w: 0.25, label: 'thematicVector.T2' },
    { v: t7, w: 0.3, label: 'thematicVector.T7' },
    { v: localRole, w: 0.25, label: `editorialRole.localSignal.${rec.editorialRole ?? 'unknown'}` },
    { v: roughness, w: 0.2, label: 'inverse.structuralMetrics.polish' },
  ])
}

function deriveTransitionValue(rec: SemanticCalibrationRecord): EditorialDimensionValue | null {
  const hub = flagValue(rec, 'curbside_hub')
  const transitionRole = roleLookup(ROLE_TRANSITION, rec.editorialRole)
  const supported = hub === 1 || transitionRole != null
  if (!supported) return null
  const heritage = metric(rec, 'heritage_depth')
  const lowHeritage = heritage != null ? round2(1 - heritage) : null
  return buildDimension(rec, 'transitionValue', 'Transition value', [
    { v: hub, w: 0.4, label: 'flags.curbside_hub' },
    { v: transitionRole, w: 0.3, label: `editorialRole.transitionSignal.${rec.editorialRole ?? 'unknown'}` },
    { v: metric(rec, 'anchor_density'), w: 0.15, label: 'structuralMetrics.anchor_density' },
    { v: lowHeritage, w: 0.15, label: 'inverse.structuralMetrics.heritage_depth' },
  ])
}

function deriveSenseOfPlace(rec: SemanticCalibrationRecord): EditorialDimensionValue | null {
  const t3 = theme(rec, 'T3')
  const t7 = theme(rec, 'T7')
  const placeRole = roleLookup(ROLE_PLACE, rec.editorialRole)
  const peak = themePeak(rec)
  const diversity = themeDiversity(rec)
  const supported =
    (t3 != null && t3 >= 0.4) ||
    (t7 != null && t7 >= 0.4) ||
    placeRole != null ||
    (peak != null && peak >= 0.7 && diversity != null && diversity >= 0.5)
  if (!supported) return null
  return buildDimension(rec, 'senseOfPlace', 'Sense of place', [
    { v: t3, w: 0.25, label: 'thematicVector.T3' },
    { v: t7, w: 0.25, label: 'thematicVector.T7' },
    { v: placeRole, w: 0.25, label: `editorialRole.placeSignal.${rec.editorialRole ?? 'unknown'}` },
    { v: metric(rec, 'polish'), w: 0.15, label: 'structuralMetrics.polish' },
    { v: peak, w: 0.1, label: 'thematicVector.peak' },
  ])
}

function deriveRecord(rec: SemanticCalibrationRecord): EditorialDimensionsRecord {
  const dimensions: Partial<Record<EditorialDimensionKey, EditorialDimensionValue>> = {
    essentiality: deriveEssentiality(rec),
    discoveryDensity: deriveDiscoveryDensity(rec),
    surprise: deriveSurprise(rec),
    orientationValue: deriveOrientationValue(rec),
    lingerValue: deriveLingerValue(rec),
  }

  if (!isFounderUnknownNode(rec)) {
    const opt: Partial<Record<EditorialDimensionKey, EditorialDimensionValue | null>> = {
      visualPayoff: deriveVisualPayoff(rec),
      storyDepth: deriveStoryDepth(rec),
      localness: deriveLocalness(rec),
      transitionValue: deriveTransitionValue(rec),
      senseOfPlace: deriveSenseOfPlace(rec),
    }
    for (const key of OPTIONAL) {
      const dim = opt[key]
      if (dim) dimensions[key] = dim
    }
  }

  return {
    stgoId: rec.stgoId,
    displayName: rec.displayName,
    dimensions,
  }
}

function main() {
  const source = JSON.parse(readFileSync(INPUT, 'utf8')) as {
    recordCount: number
    records: SemanticCalibrationRecord[]
  }

  if (source.recordCount !== 104 || source.records.length !== 104) {
    throw new Error(`Expected 104 calibration records, got ${source.records.length}`)
  }

  const records = source.records
    .slice()
    .sort((a, b) => parseInt(a.stgoId.split('_')[1]!, 10) - parseInt(b.stgoId.split('_')[1]!, 10))
    .map(deriveRecord)

  const payload = {
    schemaVersion: 'santiago-editorial-dimensions.proposed.v0.2',
    gate: '2E.2A',
    status: 'AI_PROPOSED_UNVERIFIED',
    curatorApproved: false,
    sourceCalibration: 'src/data/santiago/santiago_semantic_calibration.v0.1.json',
    recordCount: records.length,
    requiredDimensions: REQUIRED,
    optionalDimensions: OPTIONAL,
    notes: [
      'Dimensions are deterministically derived from founder structural metrics, thematic vector, tier, and editorialRole.',
      'UNKNOWN source inputs remain UNKNOWN — never coerced to zero.',
      'STGO_104 (founder extension) retains null dimensions until founder calibration.',
      'Optional dimensions appear only when thematic/structural/role evidence crosses conservative thresholds.',
      'Not curator-approved; for Gate 2E.2A parallel scoring experimentation only.',
    ],
    records,
  }

  mkdirSync(resolve(ROOT, 'src/data/santiago/curation'), { recursive: true })
  writeFileSync(OUTPUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')

  const stgo104 = records.find((r) => r.stgoId === 'STGO_104')
  const nullRequired104 = REQUIRED.every((k) => stgo104?.dimensions[k]?.value == null)
  const withOptional = records.filter((r) => OPTIONAL.some((k) => r.dimensions[k] != null)).length

  console.log(
    JSON.stringify(
      {
        output: 'src/data/santiago/curation/santiago_editorial_dimensions.proposed.v0.2.json',
        recordCount: records.length,
        stgo104NullRequired: nullRequired104,
        recordsWithOptionalDimensions: withOptional,
        schemaVersion: payload.schemaVersion,
      },
      null,
      2,
    ),
  )
}

main()
