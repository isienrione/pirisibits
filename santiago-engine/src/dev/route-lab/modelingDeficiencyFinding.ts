/**
 * Gate 2E.3.2-R — modeling-deficiency conclusion (diagnostic only).
 *
 * Distinguishes SCORING_ISSUE / DATA_ISSUE / MODELING_DEFICIENCY / UNKNOWN.
 * Does not implement Experience-Time or retune weights.
 */

export const DIAGNOSTIC_ISSUE_KINDS = ['SCORING_ISSUE', 'DATA_ISSUE', 'MODELING_DEFICIENCY', 'UNKNOWN'] as const
export type DiagnosticIssueKind = (typeof DIAGNOSTIC_ISSUE_KINDS)[number]

export const MODELING_DEFICIENCY_FINDING = {
  schemaVersion: 'santiago-modeling-deficiency.v0.1',
  subsequentModelingGate: '2E.4',
  implementedHere: false,
  findings: [
    {
      kind: 'MODELING_DEFICIENCY' as const,
      topic: 'pre-2E.4 route time model',
      detail:
        'The pre-2E.4 route model lacks explicit representations for visit mode, access overhead, marginal insertion burden, on-pathness, and content/stationary-time overlap. Runtime search treats adding a stop as transition-into-stop + dwell, which is not equivalent to replacing an existing A→B movement with A→X→B.',
    },
    {
      kind: 'DATA_ISSUE' as const,
      topic: 'STGO_18 / Teatro Municipal identity',
      detail:
        'Identity conflicts (STGO_18 Palacio vs Edificio Ariztía; Teatro Municipal collision) are data issues, not scoring-weight issues. They are diagnosed here and not mutated.',
    },
    {
      kind: 'UNKNOWN' as const,
      topic: 'any specific founder disagreement without a surviving R-scenario',
      detail:
        'Lost R1–R8 means a specific founder disagreement cannot be attributed to a named historical request. Do not auto-label every disagreement MODELING_DEFICIENCY.',
    },
  ],
  architecturalConclusion:
    'Founder disagreement involving realistic stop burden cannot be safely resolved by scoring-weight tuning alone. At least part of the disagreement reflects a ROUTE MODELING DEFICIENCY. This justified a subsequent modeling gate. That gate is not implemented here.',
  scoringWeightTuningInsufficient: true,
} as const
