/**
 * Gate 2E.5-QA — EMT movement guardrails + integrity assertions.
 */

export const EMT_MOVEMENT_EPSILON = 1e-6

export type EmtMovementLegs = {
  movementAX: number
  movementXB: number
  movementAB: number
  routingSnapshotId: string
  modeAssumptions: string
  travelerPhysicalCoefficientsVersion: string
  evidenceVersion: string
}

export type EmtGuardrailResult = {
  emtMovement: number
  ok: boolean
  errors: string[]
  snapshotConsistent: boolean
}

/**
 * EMT_movement = m(A,X)+m(X,B)-m(A,B)
 * Requires same routing snapshot / mode / traveler coeffs / evidence version.
 * Assert EMT_movement >= -epsilon; violations → DATA_INTEGRITY_ERROR.
 */
export function computeEmtMovementWithGuardrails(
  legs: EmtMovementLegs,
  expected: {
    routingSnapshotId: string
    modeAssumptions: string
    travelerPhysicalCoefficientsVersion: string
    evidenceVersion: string
  },
): EmtGuardrailResult {
  const errors: string[] = []
  const snapshotConsistent =
    legs.routingSnapshotId === expected.routingSnapshotId &&
    legs.modeAssumptions === expected.modeAssumptions &&
    legs.travelerPhysicalCoefficientsVersion === expected.travelerPhysicalCoefficientsVersion &&
    legs.evidenceVersion === expected.evidenceVersion

  if (!snapshotConsistent) {
    errors.push('DATA_INTEGRITY_ERROR: EMT legs not from SAME routing snapshot / mode / coeffs / evidence')
  }

  for (const [k, v] of Object.entries({
    movementAX: legs.movementAX,
    movementXB: legs.movementXB,
    movementAB: legs.movementAB,
  })) {
    if (!Number.isFinite(v)) errors.push(`DATA_INTEGRITY_ERROR: ${k} not finite`)
  }

  const emtMovement = legs.movementAX + legs.movementXB - legs.movementAB
  if (emtMovement < -EMT_MOVEMENT_EPSILON) {
    errors.push(
      `DATA_INTEGRITY_ERROR: EMT_movement=${emtMovement} < -epsilon(${EMT_MOVEMENT_EPSILON})`,
    )
  }

  return {
    emtMovement,
    ok: errors.length === 0,
    errors,
    snapshotConsistent,
  }
}

/**
 * Final route time must be recomputed from the realized sequence —
 * never by summing cached historical EMT values.
 */
export function recomputeRouteTimeFromSequence(input: {
  movementLegsMin: number[]
  stationaryDwellsMin: number[]
  accessOverheadsMin: number[]
}): number {
  const move = input.movementLegsMin.reduce((a, b) => a + b, 0)
  const dwell = input.stationaryDwellsMin.reduce((a, b) => a + b, 0)
  const access = input.accessOverheadsMin.reduce((a, b) => a + b, 0)
  return move + dwell + access
}
