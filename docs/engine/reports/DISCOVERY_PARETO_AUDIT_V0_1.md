# Discovery Pareto Audit V0.1

**Gate:** 2E.5-QA · **Status:** NON-CANONICAL · **RouteChoiceScore unchanged**

## Counts

| Class | N |
|---|---:|
| PARETO_DOMINATED | 0 |
| NON_DOMINATED | 18 |
| DOMINATES_OTHER | 0 |
| INSUFFICIENT_EVIDENCE | 0 |

## Implication for 0/18 Discovery winners

Many Discovery candidates non-dominated → 0/18 more likely arbitration objective (missing DiscoveryFit weight / LanePrior)

Dominance rule: over comparable known features among TravelerMatchRoute, IntrinsicWorthRoute, RouteMarginalValue, ArcQuality, PhysicalEfficiency, TimeFit, StructuralFit, DiscoveryFit, NarrativeCoherence — A dominates B if A ≥ B on all compared known dims and > on ≥1, with ≥3 comparable dims.

## Per-fixture

| Fixture | class | stronger vs SIGNATURE | weaker vs SIGNATURE |
|---|---|---|---|
| F1 | NON_DOMINATED | routeMarginalValue, arcQuality, structuralFit, discoveryFit | travelerMatchRoute, intrinsicWorthRoute, narrativeCoherence |
| F2 | NON_DOMINATED | — | — |
| F3 | NON_DOMINATED | travelerMatchRoute, routeMarginalValue, physicalEfficiency, discoveryFit | arcQuality, narrativeCoherence |
| F4 | NON_DOMINATED | — | — |
| F5 | NON_DOMINATED | travelerMatchRoute, routeMarginalValue, arcQuality, discoveryFit, narrativeCoherence | intrinsicWorthRoute, physicalEfficiency, structuralFit |
| F6 | NON_DOMINATED | travelerMatchRoute, arcQuality, structuralFit, discoveryFit | intrinsicWorthRoute, routeMarginalValue, physicalEfficiency |
| F7 | NON_DOMINATED | travelerMatchRoute, arcQuality, physicalEfficiency, structuralFit, discoveryFit | intrinsicWorthRoute, routeMarginalValue |
| F8 | NON_DOMINATED | travelerMatchRoute, routeMarginalValue, physicalEfficiency, structuralFit, discoveryFit | intrinsicWorthRoute, arcQuality, narrativeCoherence |
| F9 | NON_DOMINATED | — | — |
| F10 | NON_DOMINATED | — | — |
| F11 | NON_DOMINATED | travelerMatchRoute, routeMarginalValue, discoveryFit, narrativeCoherence | arcQuality, physicalEfficiency |
| F12 | NON_DOMINATED | travelerMatchRoute, routeMarginalValue, arcQuality, discoveryFit, narrativeCoherence | intrinsicWorthRoute, physicalEfficiency, structuralFit |
| F13 | NON_DOMINATED | routeMarginalValue, discoveryFit, narrativeCoherence | travelerMatchRoute, intrinsicWorthRoute, arcQuality, physicalEfficiency, structuralFit |
| F14 | NON_DOMINATED | travelerMatchRoute, routeMarginalValue, discoveryFit, narrativeCoherence | arcQuality, physicalEfficiency |
| F15 | NON_DOMINATED | routeMarginalValue, arcQuality, physicalEfficiency, discoveryFit | travelerMatchRoute, intrinsicWorthRoute, structuralFit |
| F16 | NON_DOMINATED | travelerMatchRoute, routeMarginalValue, arcQuality, physicalEfficiency, structuralFit, discoveryFit | intrinsicWorthRoute |
| F17 | NON_DOMINATED | — | — |
| F18 | NON_DOMINATED | — | — |
