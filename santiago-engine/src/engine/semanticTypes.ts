/**
 * Gate 2A.1 / 2A.1R — semantic calibration record types.
 */

import type { ModeCode, ThemeCode } from '@/src/lib/city-graph/types'

export type FieldProvenance =
  | 'FOUNDER_PRECALIBRATED'
  | 'CANONICAL_CURATED'
  | 'AI_PROPOSED_UNVERIFIED'
  | 'AI_PROPOSED_UNVERIFIED_FROM_DEMO_DWELL'
  | 'AI_PROPOSED_UNVERIFIED_FROM_ROLE_HEURISTIC'
  | 'AI_PROPOSED_UNVERIFIED_FROM_TIER_HEURISTIC'
  | 'AI_PROPOSED_UNVERIFIED_PRESERVED_FROM_GATE_2A1'
  | 'AI_PROPOSED_FROM_VISIT_TIME'
  | 'AI_PROPOSED_ROLE_HEURISTIC'
  | 'AI_PROPOSED_POLISH_PROXY'
  | 'AI_PROPOSED_FROM_POLISH_AND_FLAGS'
  | 'DEMO_POI_MATCH'
  | 'CONTENT_HEURISTIC_AI_PROPOSED'
  | 'BINARY_THEME_EXPANSION'
  | 'DERIVED_CONVENIENCE'
  | 'UNKNOWN'
  | 'UNKNOWN_NOT_INFERRED'
  | 'UNKNOWN_ABSENT_FROM_SOURCE_PRESENT_FLAG_KEYS'
  | 'ABSENT_IN_DEMO'
  | 'DEFAULT_FALSE_NO_EVIDENCE'
  | 'CURATOR_APPROVED'

export type ChronoWorthBlock = {
  proposed: number | null
  approved: number | null
  effective: number | null
  status?: string
  provenance: FieldProvenance | string
  formula?: string
  contributions?: Record<string, unknown>
  note?: string
}

export type VisitTimeBlock = {
  min: number | null
  typical: number | null
  max: number | null
  unit: 'minutes'
  includesTravelTime: false
  approved: null | { min: number; typical: number; max: number }
  provenance: FieldProvenance | string
  source?: string
}

export type ModeSuitability =
  | { value: number; provenance: string; status?: string }
  | { value: number | null; status: string; provenance: string }

export type SemanticCalibrationRecord = {
  stgoId: string
  displayName: string
  legacySlug?: string | null
  demoPoiIdMatched?: string | null
  tier: string | null
  tierProvenance?: string
  editorialRole: string | null
  thematicVector: Record<ThemeCode, number | null>
  thematicVectorProvenance?: string
  structuralMetrics?: Record<string, number | null>
  structuralMetricsProvenance?: string
  flags?: Record<string, { value: boolean | null; status: string; provenance: string }>
  derivedThemeTags: ThemeCode[]
  themeTagThreshold: number
  chronoWorth: ChronoWorthBlock
  visitTime: VisitTimeBlock
  structuralSuitability: Record<ModeCode, ModeSuitability>
  sensitiveMemory: { value: boolean | null; status?: string; provenance: string; note?: string }
  accessibility: { status: 'KNOWN_STEP_FREE' | 'KNOWN_NOT_STEP_FREE' | 'UNKNOWN'; provenance: string }
  operational: { classification: string; daylightOnly: boolean | null; provenance: string; openingHours?: null }
  sources?: Array<Record<string, unknown>>
  sourceProvenance?: Record<string, unknown>
  launchRuntimeDisposition?: string | null
  physicalRouteGenerationEligible?: boolean | null
  physicalStatus?: string | null
  founderNodeBadges?: string[]
  canonicalName?: string | null
  shortName?: string | null
  coordinates?: Record<string, unknown> | null
  legacyAlias?: { alias: string; status: string } | null
  identityCorrection?: Record<string, unknown> | null
  launchCorpus?: boolean
}

export type SemanticCalibrationFile = {
  schemaVersion: string
  gate: string
  status: string
  curatorApproved: boolean
  canonicalTaxonomy: ThemeCode[]
  notes: string[]
  chronoWorthFormula: Record<string, unknown>
  recordCount: number
  demoNameMatches?: number
  founderVectorRestored?: number
  binarySyntheticReplaced?: number
  sourceDataset?: string
  canonicalSemanticArtifact?: string
  sensitiveMemorySourceList?: Array<{ stgoId: string; name: string }>
  records: SemanticCalibrationRecord[]
}
