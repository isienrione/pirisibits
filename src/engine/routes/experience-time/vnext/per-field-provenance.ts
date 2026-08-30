/**
 * Gate 2E.5-QA — per-field provenance contract (schema only).
 */

export type FieldProvenanceStatus =
  | 'AI_PROPOSED_UNVERIFIED'
  | 'PROVIDER_DERIVED'
  | 'CURATOR_APPROVED'
  | 'FIELD_VERIFIED'
  | 'FOUNDER_APPROVED'
  | 'UNKNOWN'

export type PerFieldProvenanceBlock = {
  coordinates: FieldProvenanceStatus
  openingHours: FieldProvenanceStatus
  ticketFacts: FieldProvenanceStatus
  accessibility: FieldProvenanceStatus
  visitMode: FieldProvenanceStatus
  dwellTime: FieldProvenanceStatus
  physicalFriction: FieldProvenanceStatus
  narrativeRelation: FieldProvenanceStatus
  semanticVectors: FieldProvenanceStatus
}

/** AI_PROPOSED_UNVERIFIED coordinates are NOT ROUTABLE. */
export function coordinatesRoutable(provenance: FieldProvenanceStatus): boolean {
  if (provenance === 'AI_PROPOSED_UNVERIFIED') return false
  if (provenance === 'UNKNOWN') return false
  return (
    provenance === 'PROVIDER_DERIVED' ||
    provenance === 'CURATOR_APPROVED' ||
    provenance === 'FIELD_VERIFIED' ||
    provenance === 'FOUNDER_APPROVED'
  )
}

/** AI_PROPOSED_UNVERIFIED transit topology/times are NOT ROUTABLE. */
export function transitTopologyRoutable(provenance: FieldProvenanceStatus): boolean {
  return coordinatesRoutable(provenance)
}

/**
 * M2 step-free: absence of sufficiently trusted evidence = fail closed.
 * Trusted = CURATOR_APPROVED | FIELD_VERIFIED | FOUNDER_APPROVED
 */
export function m2StepFreeFailClosed(input: {
  stepFreeRequired: boolean
  accessibilityProvenance: FieldProvenanceStatus
  stepFreeKnown: boolean | null
}): { pass: boolean; reason: string } {
  if (!input.stepFreeRequired) return { pass: true, reason: 'M2_NOT_REQUIRED' }
  const trusted =
    input.accessibilityProvenance === 'CURATOR_APPROVED' ||
    input.accessibilityProvenance === 'FIELD_VERIFIED' ||
    input.accessibilityProvenance === 'FOUNDER_APPROVED'
  if (!trusted || input.stepFreeKnown == null) {
    return {
      pass: false,
      reason: 'M2_FAIL_CLOSED_INSUFFICIENT_TRUSTED_ACCESSIBILITY_EVIDENCE',
    }
  }
  if (input.stepFreeKnown !== true) {
    return { pass: false, reason: 'M2_FAIL_CLOSED_NOT_STEP_FREE' }
  }
  return { pass: true, reason: 'M2_TRUSTED_STEP_FREE' }
}

export function emptyPerFieldProvenance(): PerFieldProvenanceBlock {
  return {
    coordinates: 'UNKNOWN',
    openingHours: 'UNKNOWN',
    ticketFacts: 'UNKNOWN',
    accessibility: 'UNKNOWN',
    visitMode: 'UNKNOWN',
    dwellTime: 'UNKNOWN',
    physicalFriction: 'UNKNOWN',
    narrativeRelation: 'UNKNOWN',
    semanticVectors: 'UNKNOWN',
  }
}
