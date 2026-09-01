/**
 * Gate 2E.3.2-R — diagnostic identity findings.
 *
 * Does NOT mutate Santiago node data. STGO_105 is not invented into the dataset.
 * Observed values are the pre-2E.4 engine-node labels at this checkpoint.
 */

export const IDENTITY_DIAGNOSTIC_FINDINGS = {
  STGO_18: {
    stgoId: 'STGO_18',
    status: 'IDENTITY_CONFLICT_CONFIRMED' as const,
    observedIdentity: 'Edificio Palacio Ariztía (Flat-Iron)',
    founderApprovedIdentity: 'Edificio Ariztía (Flat-Iron)',
    notIdentity: 'Palacio Ariztía',
    resolutionApplied: false,
    plannedResolutionGate: '2E.4',
    note: 'Observed engine-node label conflates Palacio Ariztía with Edificio Ariztía (Flat-Iron). Founder-approved identity is Edificio Ariztía (Flat-Iron). Dataset is not mutated in 2E.3.2-R.',
  },
  STGO_59: {
    stgoId: 'STGO_59',
    status: 'CANONICAL_IDENTITY_CONFIRMED' as const,
    observedIdentity: 'Club de la Unión',
    founderApprovedIdentity: 'Club de la Unión',
    resolutionApplied: false,
    plannedResolutionGate: null,
    note: 'Engine-node canonical/display name is already Club de la Unión at this pre-2E.4 checkpoint.',
  },
  TEATRO_MUNICIPAL: {
    subject: 'Teatro Municipal',
    status: 'IDENTITY_COLLISION_CONFIRMED' as const,
    founderApprovedIdentity: 'Teatro Municipal de Santiago',
    observedAssociatedNode: 'STGO_29',
    observedAssociatedLegacySlug: 'teatro-municipal',
    observedAssociatedDisplayName: 'La Chascona (Neruda House)',
    physicalCoordinates: 'UNKNOWN' as const,
    plazaNunoaAssociation: 'WRONG_HISTORICAL_ASSOCIATION_IDENTIFIED',
    stgo105InventedHere: false,
    resolutionApplied: false,
    plannedResolutionGate: '2E.4',
    note: 'Downtown Teatro Municipal de Santiago has no dedicated corrected node at this checkpoint. STGO_29 slug is teatro-municipal but display is La Chascona. A Plaza Ñuñoa / Teatro association was identified as wrong. STGO_105 is not created here.',
  },
} as const
