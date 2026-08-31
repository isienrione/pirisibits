/**
 * Gate 2E.6 — PosturePolicyVNext (shadow only).
 * Two responsibilities: node affinity + marginal novelty/sequencing appetite.
 */

export type PostureResponsibility = 'NODE_AFFINITY' | 'MARGINAL_NOVELTY_SEQUENCING'

export type LegacyPostureTouchpointMapping = {
  legacyId: string
  path: string
  mapsTo: PostureResponsibility
  cutOver: false
}

/** Mapping of Gate 2E.5's 12 touchpoints → intended VNext homes (shadow only). */
export const POSTURE_POLICY_VNEXT_MAPPING: LegacyPostureTouchpointMapping[] = [
  { legacyId: 'TM.discoveryPostureAffinity', path: 'traveler-match.ts', mapsTo: 'NODE_AFFINITY', cutOver: false },
  { legacyId: 'TM.computeTravelerMatch', path: 'traveler-match.ts', mapsTo: 'NODE_AFFINITY', cutOver: false },
  { legacyId: 'BNV.routeIntent', path: 'base-node-value.ts', mapsTo: 'NODE_AFFINITY', cutOver: false },
  { legacyId: 'MRV.posture indirectly', path: 'marginal-route-value.ts', mapsTo: 'MARGINAL_NOVELTY_SEQUENCING', cutOver: false },
  { legacyId: 'StructuralFit.roleWeights', path: 'arbitration-config.v0.2.ts', mapsTo: 'NODE_AFFINITY', cutOver: false },
  { legacyId: 'StructuralFit.compute', path: 'route-common-features.v0.2.ts', mapsTo: 'NODE_AFFINITY', cutOver: false },
  { legacyId: 'DiscoveryFit.compute', path: 'route-common-features.v0.2.ts', mapsTo: 'MARGINAL_NOVELTY_SEQUENCING', cutOver: false },
  { legacyId: 'LanePrior.table', path: 'arbitration-config.v0.2.ts', mapsTo: 'MARGINAL_NOVELTY_SEQUENCING', cutOver: false },
  { legacyId: 'LanePrior.compute', path: 'lane-prior.v0.2.ts', mapsTo: 'MARGINAL_NOVELTY_SEQUENCING', cutOver: false },
  { legacyId: 'LaneScoring.H2', path: 'composer-config.v0.2.ts', mapsTo: 'MARGINAL_NOVELTY_SEQUENCING', cutOver: false },
  { legacyId: 'Arbitration.RouteChoiceScore', path: 'route-arbitrator.v0.2.ts', mapsTo: 'MARGINAL_NOVELTY_SEQUENCING', cutOver: false },
  { legacyId: 'RoleFit.compute', path: 'role-fit.ts', mapsTo: 'NODE_AFFINITY', cutOver: false },
]

export type PosturePolicyVNext = {
  version: 'posture-policy.vnext.0.1'
  status: 'SHADOW_ONLY_NOT_CUT_OVER'
  responsibilities: PostureResponsibility[]
  legacyMapping: LegacyPostureTouchpointMapping[]
}

export function getPosturePolicyVNext(): PosturePolicyVNext {
  return {
    version: 'posture-policy.vnext.0.1',
    status: 'SHADOW_ONLY_NOT_CUT_OVER',
    responsibilities: ['NODE_AFFINITY', 'MARGINAL_NOVELTY_SEQUENCING'],
    legacyMapping: POSTURE_POLICY_VNEXT_MAPPING,
  }
}

export function shadowComparePostureResponsibilities(): {
  nodeAffinityCount: number
  noveltyCount: number
  cutOver: false
} {
  return {
    nodeAffinityCount: POSTURE_POLICY_VNEXT_MAPPING.filter((m) => m.mapsTo === 'NODE_AFFINITY').length,
    noveltyCount: POSTURE_POLICY_VNEXT_MAPPING.filter((m) => m.mapsTo === 'MARGINAL_NOVELTY_SEQUENCING').length,
    cutOver: false,
  }
}
