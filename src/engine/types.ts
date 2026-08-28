/**
 * Gate 2A — Engine V0.1 node-utility / eligibility types.
 * Gate 2B narrative types live under src/engine/narrative/ (provisional).
 * Route composition remains non-operational until later gates.
 */

import type { ModeCode, ThemeCode } from '@/src/lib/city-graph/types'
import type { DiscoveryPostureCode } from '@/src/engine/taxonomy'
import type { ExplorerRhythm, InterestId, MobilityArchetypeId } from '@/src/data/algorithm'

export type EvidenceState = 'PRESENT' | 'PARTIAL' | 'MISSING' | 'UNKNOWN'

export type EligibilityReasonCode =
  | 'NOT_LAUNCH_CORPUS'
  | 'RUNTIME_EXCLUDED'
  | 'PHYSICAL_INELIGIBLE'
  | 'EDITORIALLY_DISABLED'
  | 'EXPLICIT_ACCESSIBILITY_INCOMPATIBLE'
  | 'EXPLICIT_SENSITIVE_MEMORY_WITHOUT_OPT_IN'
  | 'EXPLICIT_DAYLIGHT_ONLY_AT_NIGHT'
  | 'ALREADY_VISITED_HARD'
  | 'HARD_TIME_IMPOSSIBLE'

export type EligibilityWarningCode =
  | 'ACCESSIBILITY_UNKNOWN'
  | 'VISIT_DURATION_UNKNOWN'
  | 'OPENING_HOURS_UNKNOWN'
  | 'CHRONOWORTH_MISSING'
  | 'STRUCTURAL_MODE_DATA_SPARSE'
  | 'SENSITIVE_THEME_WITHOUT_OPT_IN'
  | 'STAGED_PHYSICAL_ENDPOINT'
  | 'FRICTION_FIELDS_UNKNOWN'
  | 'DAYLIGHT_CLOCK_UNSPECIFIED'

export type EligibilityReason = {
  code: EligibilityReasonCode
  message: string
  evidenceState?: EvidenceState
}

export type EligibilityWarning = {
  code: EligibilityWarningCode
  message: string
  evidenceState?: EvidenceState
}

export type EligibilityResult = {
  eligible: boolean
  hardFailures: EligibilityReason[]
  warnings: EligibilityWarning[]
}

/** Soft preferences vs hard constraints on the traveler. */
export type TravelerModel = {
  interests: InterestId[]
  /** ThemeCode weights 0–1 (soft). */
  themeWeights: Record<ThemeCode, number>
  discoveryPosture: DiscoveryPostureCode
  rhythm: ExplorerRhythm
  timeBudgetMinutes: number
  /** Soft express preference (M1). */
  expressPreference: boolean
  /** HARD when true: require known step-free compatibility; UNKNOWN ≠ fail. */
  stepFreeRequired: boolean
  /** Soft high-comfort preference (M5). */
  highComfort: boolean
  /** Soft family posture (M3). */
  familyContext: boolean
  /** Soft night posture (M4). */
  nightContext: boolean
  memorySitesOptIn: boolean
  walkChunkMinutes: number
  useMetro: boolean
  mobilityArchetype: MobilityArchetypeId | 'M1' | null
  startingStgoId: string | null
  stayDays: number
  locationEnabled: boolean
}

export type EvaluationContext = {
  /** Optional wall-clock; used only for daylight checks when node has explicit daylight flag. */
  now?: Date
  remainingTimeBudgetMinutes?: number
  alreadyVisitedStgoIds?: string[]
  /** When true, already-visited is a hard exclusion rather than soft demotion. */
  hardExcludeVisited?: boolean
  /** Launch-only candidate generation (Gate 2A default). */
  launchCorpusOnly?: boolean
}

export type ScoreComponent = {
  key: 'editorial' | 'interests' | 'structural' | 'discovery' | 'context'
  value: number
  max: number
  available: boolean
  provenance: string
  details?: Record<string, number | string | boolean | null>
}

export type NodeUtilityResult = {
  nodeId: string
  displayName: string | null
  eligible: boolean
  utility: number
  /** Traveler-specific fit only (interests + structural + discovery). Not ChronoWorth. */
  yourMatch: number
  chronoWorthEffective: number | null
  components: {
    editorial: ScoreComponent
    interests: ScoreComponent
    structural: ScoreComponent
    discovery: ScoreComponent
    context: ScoreComponent
  }
  matchedThemes: ThemeCode[]
  themeContributions: Partial<Record<ThemeCode, number>>
  structuralModesConsidered: ModeCode[]
  hardFailures: EligibilityReason[]
  warnings: EligibilityWarning[]
  provenance: {
    chronoWorth: EvidenceState
    themes: EvidenceState
    modes: EvidenceState
    editorialRole: EvidenceState
    visitDuration: EvidenceState
    accessibility: EvidenceState
    openingHours: EvidenceState
  }
}

export type CandidatePoolItem = NodeUtilityResult & {
  rank: number
  disposition: string | null
}

export type CandidatePool = {
  gate: '2A'
  travelerSummary: {
    interests: InterestId[]
    discoveryPosture: DiscoveryPostureCode
    stepFreeRequired: boolean
    timeBudgetMinutes: number
  }
  evaluatedLaunchCount: number
  eligibleCount: number
  excludedIds: string[]
  backlogLeakCount: number
  candidates: CandidatePoolItem[]
}

/** Placeholders — remaining future gates. Must remain non-operational here. */
export type ArcQualityPlaceholder = never
export type RouteCompositionPlaceholder = never

/** Engine-facing node slice (city-agnostic shape over Santiago JSON). */
export type EngineNodeRecord = {
  stgoId: string
  displayName: string | null
  canonicalName: string | null
  launchCorpus: boolean
  themes: ThemeCode[]
  modes: ModeCode[]
  editorialRole: string | null
  tier: string | null
  chronoWorth: number | null
  launchRuntimeDisposition?: string | null
  physicalRouteGenerationEligible?: boolean | null
  launchPhysicalReadiness?: string | null
  /** Optional Gate 2A.1 continuous semantic fields (preferred over binary themes). */
  thematicVector?: Partial<Record<import('@/src/lib/city-graph/types').ThemeCode, number | null>> | null
  chronoWorthProposed?: number | null
  chronoWorthApproved?: number | null
  chronoWorthEffective?: number | null
  chronoWorthProvenance?: string | null
  visitDurationMinutes?: number | null
  timeCostMinutes?: number | null
  visitTimeMin?: number | null
  visitTimeTypical?: number | null
  visitTimeMax?: number | null
  structuralSuitability?: Partial<
    Record<import('@/src/lib/city-graph/types').ModeCode, { value: number | null; status?: string; provenance?: string }>
  > | null
  isSensitiveMemorySite?: boolean | null
  sensitiveMemory?: boolean | null
  daylightOnly?: boolean | null
  daylight_only?: boolean | null
  stepFree?: boolean | null
  step_free_certified?: boolean | null
  accessibility?: string | null
  openingHours?: unknown
  editoriallyDisabled?: boolean | null
  sanCristobalStaging?: { routingEndpoint?: string; summitImplied?: boolean } | null
  tierNormalized?: string | null
}
