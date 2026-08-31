/**
 * Gate 2E.6 — Place / Experience / ContentModule executable types.
 */

import type {
  ExperienceStopRole,
  ExperienceTimeProvenance,
  VisitMode,
} from '@/src/engine/routes/experience-time/types'
import type { FieldProvenanceStatus, PerFieldProvenanceBlock } from '@/src/engine/routes/experience-time/vnext/per-field-provenance'
import { emptyPerFieldProvenance } from '@/src/engine/routes/experience-time/vnext/per-field-provenance'

export type StructuralRole = 'ANCHOR' | 'POCKET' | 'MICRO_REVEAL' | 'UNKNOWN'

export type NarrativeRoleCapability =
  | 'ORIENT'
  | 'SETUP'
  | 'DEVELOP'
  | 'BRIDGE'
  | 'CONTRAST'
  | 'ESCALATE'
  | 'REVEAL'
  | 'PAYOFF'
  | 'RELIEF'
  | 'RESOLVE'
  | 'LAND'

export type ContentModuleType =
  | 'CORE'
  | 'THEMATIC_DEPTH'
  | 'NARRATIVE_LENS'
  | 'MICRO_REVEAL'
  | 'OPTIONAL_DEPTH'
  | 'TRANSITION'

export type OptionalStatus = 'CORE_COMPATIBILITY' | 'REQUIRED' | 'OPTIONAL' | 'UNKNOWN'

export type ExperienceTimeProfileVNext = {
  movementTimeMin: number | null
  stationaryDwellMin: number | null
  requiredAccessOverheadMin: number | null
  walkCompatibleContentMin: number | null
  optionalExtensionTimeMin: number | null
  authoredContentMin: number | null
  unknown: boolean
  provenance: ExperienceTimeProvenance
}

export type ExperienceConstraintSet = {
  openingConstraintsRef: string | null
  ticketConstraintsRef: string | null
  stepFreeKnown: boolean | null
  openingHoursKnown: boolean | null
  unknownConstraints: string[]
}

export type ExperienceProvenance = {
  record: ExperienceTimeProvenance | 'LEGACY_ADAPTER'
  fields: PerFieldProvenanceBlock
  legacyAdapter: boolean
}

export type PlaceRecord = {
  placeId: string
  stgoId: string | null
  canonicalName: string
  coordinates: { lat: number; lng: number } | null
  networkSnapRefs: string[]
  physicalFacts: Record<string, unknown>
  accessFacts: Record<string, unknown>
  adminMetadata: Record<string, unknown>
  fieldProvenance: PerFieldProvenanceBlock
  routable: boolean
}

export type ExperienceRecord = {
  experienceId: string
  placeId: string | null
  corridorRef: string | null
  displayName: string
  visitMode: VisitMode
  stopRole: ExperienceStopRole
  structuralRoleFit: Partial<Record<StructuralRole, number | null>>
  narrativeRoleCapabilities: NarrativeRoleCapability[]
  experienceTimeProfile: ExperienceTimeProfileVNext
  openingConstraints: ExperienceConstraintSet
  ticketConstraints: ExperienceConstraintSet
  optionalStatus: OptionalStatus
  parentExperienceId: string | null
  mutualExclusionGroup: string | null
  compatibilityOverride: boolean
  contentModuleIds: string[]
  provenance: ExperienceProvenance
  /** Visible flag when produced by legacy adapter. */
  LEGACY_EXPERIENCE_ADAPTER: boolean
  sourceStgoId: string | null
}

export type ContentModuleRecord = {
  contentModuleId: string
  experienceId: string
  moduleType: ContentModuleType
  themes: string[]
  narrativeHooks: string[]
  familiarityApplicability: string[]
  authoredContentMin: number | null
  walkCompatibleContentMin: number | null
  requiredStationaryMin: number | null
  provenance: ExperienceTimeProvenance
  /** Transition modules may bind A→B or narrative relation. */
  transitionFromExperienceId?: string | null
  transitionToExperienceId?: string | null
  narrativeRelationId?: string | null
}

export function emptyTimeProfile(): ExperienceTimeProfileVNext {
  return {
    movementTimeMin: null,
    stationaryDwellMin: null,
    requiredAccessOverheadMin: null,
    walkCompatibleContentMin: null,
    optionalExtensionTimeMin: null,
    authoredContentMin: null,
    unknown: true,
    provenance: 'UNKNOWN',
  }
}

export function emptyConstraintSet(): ExperienceConstraintSet {
  return {
    openingConstraintsRef: null,
    ticketConstraintsRef: null,
    stepFreeKnown: null,
    openingHoursKnown: null,
    unknownConstraints: ['OPENING_HOURS_UNKNOWN', 'TICKET_UNKNOWN'],
  }
}

export function defaultExperienceProvenance(legacy: boolean): ExperienceProvenance {
  return {
    record: legacy ? 'LEGACY_ADAPTER' : 'UNKNOWN',
    fields: emptyPerFieldProvenance(),
    legacyAdapter: legacy,
  }
}

export type FieldProvenance = FieldProvenanceStatus
