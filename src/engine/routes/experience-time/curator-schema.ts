/**
 * Gate 2E.4 — curator-facing experience-time calibration schema.
 * Flow: AI proposal → founder verification/correction → approved value.
 */

export type CuratorExperienceTimeFields = {
  stgoId: string
  /** Default / core visit mode for ChronoWalk */
  defaultCoreVisitMode:
    | 'PASS_THROUGH'
    | 'EXTERIOR_CORE'
    | 'INTERIOR_CORE'
    | 'EXTENDED_VISIT'
    | 'UNKNOWN'
    | null
  coreDwellTypicalMin: number | null
  coreDwellMin: number | null
  coreDwellMax: number | null
  optionalExtension: boolean | null
  extensionVisitMode: 'OPTIONAL_INTERIOR' | 'EXTENDED_VISIT' | 'UNKNOWN' | null
  extensionDwellTypicalMin: number | null
  interiorExterior: 'INTERIOR' | 'EXTERIOR' | 'BOTH' | 'UNKNOWN' | null
  ticketDependent: boolean | null
  openingHoursDependent: boolean | null
  accessOverheadMin: number | null
  passThroughCapable: boolean | null
  stopRole: 'REQUIRED_STOP' | 'ENROUTE_DISCOVERY' | 'OPTIONAL_EXTENSION' | 'UNKNOWN' | null
  authoredContentMin: number | null
  stationaryDwellMin: number | null
  walkCompatibleContentMin: number | null
  contentMayOverlapMovement: boolean | null
}

export type CuratorCalibrationWorkflowState =
  | 'EMPTY'
  | 'AI_PROPOSED_UNVERIFIED'
  | 'FOUNDER_CORRECTED'
  | 'CURATOR_APPROVED'
  | 'FIELD_VERIFIED'

export type CuratorExperienceTimeRecord = {
  fields: CuratorExperienceTimeFields
  workflow: {
    state: CuratorCalibrationWorkflowState
    aiProposal: Partial<CuratorExperienceTimeFields> | null
    founderCorrection: Partial<CuratorExperienceTimeFields> | null
    approved: Partial<CuratorExperienceTimeFields> | null
    decisionDate: string | null
    decisionSource: 'AI' | 'FOUNDER' | 'CURATOR' | 'FIELD' | null
  }
  provenanceRequired: true
  notes?: string | null
}

export const CURATOR_EXPERIENCE_TIME_FIELD_LIST = [
  'defaultCoreVisitMode',
  'coreDwellTypicalMin',
  'coreDwellMin',
  'coreDwellMax',
  'optionalExtension',
  'extensionVisitMode',
  'extensionDwellTypicalMin',
  'interiorExterior',
  'ticketDependent',
  'openingHoursDependent',
  'accessOverheadMin',
  'passThroughCapable',
  'stopRole',
  'authoredContentMin',
  'stationaryDwellMin',
  'walkCompatibleContentMin',
  'contentMayOverlapMovement',
] as const

/** Empty curator shell — founder should not fill everything from scratch; AI proposes first. */
export function emptyCuratorExperienceTimeRecord(stgoId: string): CuratorExperienceTimeRecord {
  return {
    fields: {
      stgoId,
      defaultCoreVisitMode: null,
      coreDwellTypicalMin: null,
      coreDwellMin: null,
      coreDwellMax: null,
      optionalExtension: null,
      extensionVisitMode: null,
      extensionDwellTypicalMin: null,
      interiorExterior: null,
      ticketDependent: null,
      openingHoursDependent: null,
      accessOverheadMin: null,
      passThroughCapable: null,
      stopRole: null,
      authoredContentMin: null,
      stationaryDwellMin: null,
      walkCompatibleContentMin: null,
      contentMayOverlapMovement: null,
    },
    workflow: {
      state: 'EMPTY',
      aiProposal: null,
      founderCorrection: null,
      approved: null,
      decisionDate: null,
      decisionSource: null,
    },
    provenanceRequired: true,
    notes: 'AI proposal → founder verification/correction → approved value. UNKNOWN stays UNKNOWN.',
  }
}
