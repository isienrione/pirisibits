/**
 * Gate 2E.4 — Experience-Time Model Contract V0.1 (parallel / non-production).
 *
 * PLACE ≠ EXPERIENCE AT PLACE.
 * UNKNOWN remains UNKNOWN — never fabricate dwell, mode, or on-path geometry.
 */

/** Canonical VisitMode taxonomy V0.1 */
export type VisitMode =
  | 'PASS_THROUGH'
  | 'EXTERIOR_CORE'
  | 'INTERIOR_CORE'
  | 'OPTIONAL_INTERIOR'
  | 'EXTENDED_VISIT'
  | 'UNKNOWN'

/**
 * Stop / discovery role — orthogonal to editorial importance and VisitMode.
 * Do not assign Launch30 classifications in this gate.
 */
export type ExperienceStopRole =
  | 'REQUIRED_STOP'
  | 'ENROUTE_DISCOVERY'
  | 'OPTIONAL_EXTENSION'
  | 'UNKNOWN'

/** Provenance for calibrated experience-time values (extends project conventions). */
export type ExperienceTimeProvenance =
  | 'AI_PROPOSED_UNVERIFIED'
  | 'PROVIDER_DERIVED'
  | 'CURATOR_APPROVED'
  | 'FIELD_VERIFIED'
  | 'FOUNDER_APPROVED'
  | 'LEGACY_SCALAR_DWELL'
  | 'UNKNOWN'

export type ExperienceTimeConfidence =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'UNKNOWN'

/**
 * Capability fields for content-time vs stationary-time (O2).
 * All nullable / UNKNOWN until curated — do not populate Launch30 in this gate.
 */
export type ContentTimeCapability = {
  /** Authored narrative / audio duration (minutes). */
  authoredContentMin: number | null
  /** Time that requires the traveler to be stationary. */
  stationaryDwellMin: number | null
  /** Content intentionally consumable while walking (minutes). */
  walkCompatibleContentMin: number | null
  /** Whether a full stop is required for this experience. */
  requiredStop: boolean | null
  /**
   * Declared concurrency: may authored content overlap movement?
   * UNKNOWN when not declared — never invent overlap percentages.
   */
  contentMayOverlapMovement: boolean | null
}

/**
 * Typed experience-time record for one (place, visitMode) experience.
 * Null / UNKNOWN fields are first-class — no fabricated defaults.
 */
export type ExperienceTimeProfile = {
  stgoId: string
  visitMode: VisitMode

  /** Minimum calibrated dwell for this mode (minutes). */
  dwellMin: number | null
  dwellTypical: number | null
  dwellMax: number | null

  accessOverheadMin: number | null

  openingHoursDependent: boolean | null
  ticketDependent: boolean | null

  /** True when this profile is an optional extension of a base experience. */
  canBeOptionalExtension: boolean | null

  /** Link to base experience profile id when this is an extension. */
  baseExperienceRef: string | null

  stopRole: ExperienceStopRole

  contentTime: ContentTimeCapability

  /**
   * On-path relative to a corridor: true | false | UNKNOWN.
   * UNKNOWN when canonical geometry evidence is insufficient.
   */
  onPath: boolean | null

  provenance: ExperienceTimeProvenance
  confidence: ExperienceTimeConfidence

  /** Stable id for this experience profile (not the place id alone). */
  experienceId: string

  notes?: string | null
}

/** Adapter marker for current scalar visitTime.typical compatibility. */
export type LegacyScalarDwellAdapter = {
  kind: 'LEGACY_SCALAR_DWELL'
  stgoId: string
  dwellTypical: number | null
  dwellMin: number | null
  dwellMax: number | null
  provenance: 'LEGACY_SCALAR_DWELL'
  sourceField: 'calibration.visitTime.typical'
  visitMode: 'UNKNOWN'
  experienceTimeStatus: 'LEGACY_ONLY'
}

export type ExperienceTimeStatus =
  | 'CALIBRATED'
  | 'EXPERIENCE_TIME_UNKNOWN'
  | 'LEGACY_ONLY'
  | 'PARTIAL'

/** Time-budget contract (G) — +8 min tolerance unchanged and not redefined here. */
export type RouteTimeBudgetBreakdown = {
  movementTimeMin: number | null
  coreExperienceTimeMin: number | null
  accessOverheadMin: number | null
  optionalExtensionTimeMin: number | null
  /** movement + core dwell + required access overhead */
  coreRouteTimeMin: number | null
  /** Explicitly requested extensions included when includeOptionalExtensions=true */
  totalWithRequestedExtensionsMin: number | null
  toleranceMin: 8
  unknownComponents: string[]
}

export type EffectiveMarginalTimeInput = {
  /** movement(A → X) minutes */
  movementAX: number | null
  /** movement(X → B) minutes */
  movementXB: number | null
  /** movement(A → B) minutes (direct, without X) */
  movementAB: number | null
  experienceDwellMin: number | null
  accessOverheadMin: number | null
  otherModeledBurdenMin?: number | null
}

export type EffectiveMarginalTimeResult = {
  marginalMovementMin: number | null
  experienceDwellMin: number | null
  accessOverheadMin: number | null
  otherModeledBurdenMin: number | null
  effectiveMarginalTimeMin: number | null
  formula: 'movement(A,X)+movement(X,B)-movement(A,B)+experienceDwell(X)+accessOverhead(X)+other'
  unknownReasons: string[]
}

export type ParallelRouteTimeEvaluation = {
  movementTimeMin: number | null
  coreDwellMin: number | null
  accessOverheadMin: number | null
  optionalExtensionMin: number | null
  coreRouteTimeMin: number | null
  totalWithExtensionsMin: number | null
  stops: Array<{
    stgoId: string
    experienceId: string | null
    visitMode: VisitMode
    role: ExperienceStopRole
    dwellMin: number | null
    accessOverheadMin: number | null
    countedInCore: boolean
    status: ExperienceTimeStatus
  }>
  unknownComponents: string[]
  productionComposerAffected: false
}

/** Traveler/context hints that may filter eligible modes (H) — architecture only. */
export type TravelerExperiencePreferences = {
  maxCoreBudgetMin?: number | null
  preferMuseumsInteriors?: boolean | null
  excludeTicketDependentInteriors?: boolean | null
  preferSlowDeepExploration?: boolean | null
  includeOptionalExtensions?: boolean | null
}

export const VISIT_MODE_TAXONOMY_V0_1: ReadonlyArray<{
  mode: VisitMode
  meaning: string
}> = [
  {
    mode: 'PASS_THROUGH',
    meaning:
      'Experience encountered essentially while moving along a corridor; low marginal movement when on-path. Does NOT imply zero dwell.',
  },
  {
    mode: 'EXTERIOR_CORE',
    meaning: 'Intentional exterior / facade / site stop forming part of the core ChronoWalk experience.',
  },
  {
    mode: 'INTERIOR_CORE',
    meaning: 'Intentional interior experience counted in the core route when selected as base.',
  },
  {
    mode: 'OPTIONAL_INTERIOR',
    meaning: 'Optional interior extension; reported separately unless traveler requests inclusion.',
  },
  {
    mode: 'EXTENDED_VISIT',
    meaning: 'Longer destination-style experience (deep/slow exploration).',
  },
  {
    mode: 'UNKNOWN',
    meaning: 'Mode not calibrated — must remain UNKNOWN; no fabricated assignment.',
  },
] as const
