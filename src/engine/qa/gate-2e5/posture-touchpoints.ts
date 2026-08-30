/**
 * Gate 2E.5-QA — D1/D2/D3 posture touchpoint inventory (static audit).
 * Do NOT consolidate posture in this gate.
 */

export type PostureTouchpoint = {
  id: string
  path: string
  functionName: string
  affects:
    | 'TravelerMatch'
    | 'BaseNodeValue'
    | 'MRV'
    | 'rolePreference'
    | 'laneScoring'
    | 'StructuralFit'
    | 'DiscoveryFit'
    | 'LanePrior'
    | 'ArcQuality'
    | 'arbitration'
    | 'other'
  formulaOrMultiplier: string
  behavioralPurpose: string
}

export const POSTURE_TOUCHPOINTS_V0_1: PostureTouchpoint[] = [
  {
    id: 'TM.discoveryPostureAffinity',
    path: 'src/engine/scoring/v0.2/traveler-match.ts',
    functionName: 'computeDiscoveryPostureAffinity',
    affects: 'TravelerMatch',
    formulaOrMultiplier: 'D1/D2/D3 coverage-aware blend of editorial dims + roleFit (+ intrinsic for D3); weight 0.20 in TravelerMatch',
    behavioralPurpose: 'Align node discovery texture with traveler D1/D2/D3 posture',
  },
  {
    id: 'TM.computeTravelerMatch',
    path: 'src/engine/scoring/v0.2/traveler-match.ts',
    functionName: 'computeTravelerMatch',
    affects: 'TravelerMatch',
    formulaOrMultiplier: 'Uses traveler.discoveryPosture to select discoveryPostureAffinity branch',
    behavioralPurpose: 'Wire posture into node-level personalization',
  },
  {
    id: 'BNV.routeIntent',
    path: 'src/engine/scoring/v0.2/base-node-value.ts',
    functionName: 'computeBaseNodeValue',
    affects: 'BaseNodeValue',
    formulaOrMultiplier: 'Route-intent weights (DISCOVERY/ESSENTIALS/…) — posture may arrive via traveler/request context',
    behavioralPurpose: 'Pool seeding preference by intent (posture-adjacent)',
  },
  {
    id: 'MRV.posture indirectly',
    path: 'src/engine/scoring/v0.2/marginal-route-value.ts',
    functionName: 'computeMarginalRouteValue',
    affects: 'MRV',
    formulaOrMultiplier: 'Uses traveler + editorial novelty; posture not a direct multiplier but traveler object may carry D1/D2/D3',
    behavioralPurpose: 'Sequence-dependent novelty/redundancy',
  },
  {
    id: 'StructuralFit.roleWeights',
    path: 'src/engine/routes/v0.2/arbitration/arbitration-config.v0.2.ts',
    functionName: 'STRUCTURAL_FIT_ROLE_WEIGHTS',
    affects: 'StructuralFit',
    formulaOrMultiplier: 'D1/D2/D3 explicit role-fit weight tables (anchor/pocket/micro)',
    behavioralPurpose: 'Posture-specific structural preference at route feature level',
  },
  {
    id: 'StructuralFit.compute',
    path: 'src/engine/routes/v0.2/arbitration/route-common-features.v0.2.ts',
    functionName: 'computeStructuralFit',
    affects: 'StructuralFit',
    formulaOrMultiplier: 'Selects STRUCTURAL_FIT_ROLE_WEIGHTS by posture/intent',
    behavioralPurpose: 'Apply posture role mix to route structural fit',
  },
  {
    id: 'DiscoveryFit.compute',
    path: 'src/engine/routes/v0.2/arbitration/route-common-features.v0.2.ts',
    functionName: 'computeDiscoveryFit',
    affects: 'DiscoveryFit',
    formulaOrMultiplier: 'Editorial discovery dims + MRV novelty (DISCOVERY_FIT_WEIGHTS); posture influences via traveler/editorial path',
    behavioralPurpose: 'Measure discovery character of candidate route',
  },
  {
    id: 'LanePrior.table',
    path: 'src/engine/routes/v0.2/arbitration/arbitration-config.v0.2.ts',
    functionName: 'LANE_PRIOR_TABLE',
    affects: 'LanePrior',
    formulaOrMultiplier: 'D1/D2/D3 prior scores per SIGNATURE/DISCOVERY/FLOW',
    behavioralPurpose: 'Soft preference for lane under posture',
  },
  {
    id: 'LanePrior.compute',
    path: 'src/engine/routes/v0.2/arbitration/lane-prior.v0.2.ts',
    functionName: 'computeLanePrior',
    affects: 'LanePrior',
    formulaOrMultiplier: '(1-0.35)*posturePrior[lane] + 0.35*intentPrior[lane]',
    behavioralPurpose: 'Blend posture and intent priors for arbitration',
  },
  {
    id: 'LaneScoring.H2',
    path: 'src/engine/routes/v0.2/composer/composer-config.v0.2.ts',
    functionName: 'LANE_OBJECTIVE_WEIGHTS',
    affects: 'laneScoring',
    formulaOrMultiplier: 'SIGNATURE/DISCOVERY/FLOW objective weight tables (lane search, not posture table directly)',
    behavioralPurpose: 'Multi-lane search objectives; posture affects request routing into lanes via priors/features',
  },
  {
    id: 'Arbitration.RouteChoiceScore',
    path: 'src/engine/routes/v0.2/arbitration/route-arbitrator.v0.2.ts',
    functionName: 'computeRouteChoiceScore',
    affects: 'arbitration',
    formulaOrMultiplier: 'lanePrior weight 0.05 among common features',
    behavioralPurpose: 'Soft posture influence on final lane-neutral choice',
  },
  {
    id: 'RoleFit.compute',
    path: 'src/engine/scoring/v0.2/role-fit.ts',
    functionName: 'computeRoleFit',
    affects: 'rolePreference',
    formulaOrMultiplier: 'Editorial roleFit scalars consumed by TM/StructuralFit; posture selects weights downstream',
    behavioralPurpose: 'Provide anchor/pocket/micro fits for posture-weighted consumers',
  },
]

export const POSTURE_TOUCHPOINT_COUNT = POSTURE_TOUCHPOINTS_V0_1.length
