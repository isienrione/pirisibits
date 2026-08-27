/**
 * Gate 2A.1 — semantic calibration record types.
 */

import type { ModeCode, ThemeCode } from '@/src/lib/city-graph/types'

export type FieldProvenance =
  | 'CANONICAL_CURATED'
  | 'AI_PROPOSED_UNVERIFIED'
  | 'AI_PROPOSED_UNVERIFIED_FROM_DEMO_DWELL'
  | 'AI_PROPOSED_UNVERIFIED_FROM_ROLE_HEURISTIC'
  | 'AI_PROPOSED_FROM_VISIT_TIME'
  | 'AI_PROPOSED_ROLE_HEURISTIC'
  | 'AI_PROPOSED_POLISH_PROXY'
  | 'DEMO_POI_MATCH'
  | 'CONTENT_HEURISTIC_AI_PROPOSED'
  | 'BINARY_THEME_EXPANSION'
  | 'UNKNOWN'
  | 'UNKNOWN_NOT_INFERRED'
  | 'ABSENT_IN_DEMO'
  | 'DEFAULT_FALSE_NO_EVIDENCE'
  | 'CURATOR_APPROVED'

export type ChronoWorthBlock = {
  proposed: number
  approved: number | null
  effective: number
  provenance: FieldProvenance | string
  formula?: string
  contributions?: Record<string, unknown>
  note?: string
}

export type VisitTimeBlock = {
  min: number
  typical: number
  max: number
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
  tier: string
  editorialRole: string | null
  thematicVector: Record<ThemeCode, number>
  derivedThemeTags: ThemeCode[]
  themeTagThreshold: number
  chronoWorth: ChronoWorthBlock
  visitTime: VisitTimeBlock
  structuralSuitability: Record<ModeCode, ModeSuitability>
  sensitiveMemory: { value: boolean; provenance: string; note?: string }
  accessibility: { status: 'KNOWN_STEP_FREE' | 'KNOWN_NOT_STEP_FREE' | 'UNKNOWN'; provenance: string }
  operational: { classification: string; daylightOnly: boolean | null; provenance: string }
  sources: Array<Record<string, unknown>>
  launchRuntimeDisposition?: string | null
  physicalRouteGenerationEligible?: boolean | null
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
  demoNameMatches: number
  records: SemanticCalibrationRecord[]
}
