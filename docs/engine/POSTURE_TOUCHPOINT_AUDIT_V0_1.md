# Posture Touchpoint Audit V0.1

**Gate:** 2E.5-QA · **Do NOT consolidate posture yet**

## Touchpoint count

**12**

## Code paths

| ID | Path | Function | Affects | Formula / multiplier | Purpose |
|---|---|---|---|---|---|
| TM.discoveryPostureAffinity | `src/engine/scoring/v0.2/traveler-match.ts` | `computeDiscoveryPostureAffinity` | TravelerMatch | D1/D2/D3 coverage-aware blend of editorial dims + roleFit (+ intrinsic for D3); weight 0.20 in TravelerMatch | Align node discovery texture with traveler D1/D2/D3 posture |
| TM.computeTravelerMatch | `src/engine/scoring/v0.2/traveler-match.ts` | `computeTravelerMatch` | TravelerMatch | Uses traveler.discoveryPosture to select discoveryPostureAffinity branch | Wire posture into node-level personalization |
| BNV.routeIntent | `src/engine/scoring/v0.2/base-node-value.ts` | `computeBaseNodeValue` | BaseNodeValue | Route-intent weights (DISCOVERY/ESSENTIALS/…) — posture may arrive via traveler/request context | Pool seeding preference by intent (posture-adjacent) |
| MRV.posture indirectly | `src/engine/scoring/v0.2/marginal-route-value.ts` | `computeMarginalRouteValue` | MRV | Uses traveler + editorial novelty; posture not a direct multiplier but traveler object may carry D1/D2/D3 | Sequence-dependent novelty/redundancy |
| StructuralFit.roleWeights | `src/engine/routes/v0.2/arbitration/arbitration-config.v0.2.ts` | `STRUCTURAL_FIT_ROLE_WEIGHTS` | StructuralFit | D1/D2/D3 explicit role-fit weight tables (anchor/pocket/micro) | Posture-specific structural preference at route feature level |
| StructuralFit.compute | `src/engine/routes/v0.2/arbitration/route-common-features.v0.2.ts` | `computeStructuralFit` | StructuralFit | Selects STRUCTURAL_FIT_ROLE_WEIGHTS by posture/intent | Apply posture role mix to route structural fit |
| DiscoveryFit.compute | `src/engine/routes/v0.2/arbitration/route-common-features.v0.2.ts` | `computeDiscoveryFit` | DiscoveryFit | Editorial discovery dims + MRV novelty (DISCOVERY_FIT_WEIGHTS); posture influences via traveler/editorial path | Measure discovery character of candidate route |
| LanePrior.table | `src/engine/routes/v0.2/arbitration/arbitration-config.v0.2.ts` | `LANE_PRIOR_TABLE` | LanePrior | D1/D2/D3 prior scores per SIGNATURE/DISCOVERY/FLOW | Soft preference for lane under posture |
| LanePrior.compute | `src/engine/routes/v0.2/arbitration/lane-prior.v0.2.ts` | `computeLanePrior` | LanePrior | (1-0.35)*posturePrior[lane] + 0.35*intentPrior[lane] | Blend posture and intent priors for arbitration |
| LaneScoring.H2 | `src/engine/routes/v0.2/composer/composer-config.v0.2.ts` | `LANE_OBJECTIVE_WEIGHTS` | laneScoring | SIGNATURE/DISCOVERY/FLOW objective weight tables (lane search, not posture table directly) | Multi-lane search objectives; posture affects request routing into lanes via priors/features |
| Arbitration.RouteChoiceScore | `src/engine/routes/v0.2/arbitration/route-arbitrator.v0.2.ts` | `computeRouteChoiceScore` | arbitration | lanePrior weight 0.05 among common features | Soft posture influence on final lane-neutral choice |
| RoleFit.compute | `src/engine/scoring/v0.2/role-fit.ts` | `computeRoleFit` | rolePreference | Editorial roleFit scalars consumed by TM/StructuralFit; posture selects weights downstream | Provide anchor/pocket/micro fits for posture-weighted consumers |
