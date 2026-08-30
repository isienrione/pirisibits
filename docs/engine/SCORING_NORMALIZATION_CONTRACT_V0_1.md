# Scoring Normalization Contract V0.1

**Gate:** 2E.5-QA · **Status:** NON-CANONICAL · **DO NOT rescale yet**

This document is a **measurement contract**. No feature is normalized/rescaled in this gate.

Legend for “normalized”: whether the implementation already maps to an intentional 0–100 (or 0–1) scale vs raw unbounded quantities.

Machine-readable observed stats: `src/data/santiago/qa/gate_2e5_qa_measurements.v0.1.json` → `featureObservedRanges` (F1–F18 × 3 lanes = 54 candidates unless noted).

---

## Feature table

| Feature | Semantic meaning | Theoretical range | Observed (n / min / mean / std / max) | Clamp behavior | Currently normalized? | Candidate-set-relative? | UNKNOWN behavior | Provenance/evidence dependence |
|---|---|---|---|---|---|---|---|---|
| IntrinsicWorth | Editorial ChronoWorth / intrinsic place value | 0–100 | node-level (see QA); route agg below | IW scaled | Yes | Corpus-aware, not fixture z | UNAVAILABLE → null | Structural metrics provenance |
| TravelerMatch | Node×traveler personalization blend | 0–100 | per-fixture node TM in TM audit | component blend | Yes | No | coverage-aware; unknown ≠ 0 | Theme vectors + editorial dims |
| RoleFit | Anchor/pocket/micro editorial fit | 0–1 / 0–100 consumers | not separately pooled here | none extra | Partial | No | null when missing | Editorial dimensions |
| BaseNodeValue | Pre-sequence IW+TM+RolePref | 0–100 | used by oracle | blend | Yes | No | null if components unknown | Derived |
| MRV components | Sequence-dependent marginal contribution | mixed 0–1 / 0–100 | feeds RouteMarginalValue | unit-scaled | Mostly | Sequence-relative | unknown ≠ 0 | Editorial + route state |
| TransitionValue | Transition desirability | 0–100-ish | edge-local | intentional | Intentional scale | Edge-local | null if no prev | Physical/narrative edges |
| BaseNodeValue / MRV / TransitionValue | (see scoring modules) | — | measure-first; no rescale | — | — | — | — | — |
| ArcQuality | Route sequencing quality | normalizedScore 0–100; comps 0–1 | **54 / 48 / 54.81 / 2.76 / 62** | clamp01(raw)×100 | Yes | No | penalties/comps may be 0 | Route structure |
| PhysicalEfficiency | Ease/efficiency of movement mix | intended 0–100 | **54 / 75.5 / 82.76 / 3.16 / 91.4** | clamp01 terms ×100 | Yes (clamped terms) | No | blendKnown drops unknown | Transitions + arc backtracking |
| TimeFit | Budget utilization fit | 0–100 | **54 / 100 / 100 / 0 / 100** | clamp01 | Yes | Budget-relative | null if times missing | Route time ledger |
| StructuralFit | Role mix vs intent/posture | 0–100 | **54 / 50.4 / 60.11 / 3.02 / 64** | blend | Yes | No | unknown roles dropped | RoleFit + posture tables |
| DiscoveryFit | Discovery character of route | 0–100 | **54 / 38.6 / 57.94 / 6.35 / 70.6** | blend | Yes | No | unknown dims dropped | Editorial discovery + MRV |
| NarrativeCoherence | Narrative continuity | 0–100 | **54 / 43.6 / 57.81 / 6.69 / 70** | clamp01 blend | Yes | No | falls back to edge means | Arc / narrative edges |
| IntrinsicWorthRoute | Route aggregate IW | 0–100 | **54 / 60.2 / 68.69 / 1.8 / 71.1** | blend | Yes | No | unknown stops dropped | Node IW |
| TravelerMatchRoute | Route aggregate TM | 0–100 | **54 / 32.3 / 58.08 / 10.01 / 79.7** | dwell-weighted | Yes | No | unknown dropped | Node TM |
| RouteMarginalValue | Route aggregate MRV | 0–100 | **54 / 32.4 / 51.61 / 11.3 / 76.2** | blend | Yes | Sequence-relative | unknown ≠ 0 | MRV comps |
| RouteCoverageConfidence | Evidence coverage of choice features | 0–1 | **54 / 0.94 / 1.00 / 0.02 / 1** (mean feature coverage proxy) | — | Yes | Feature-set relative | explicit | Feature knownness |
| LanePrior | Soft lane preference by posture/intent | 0–100 | **54 / 44 / 63.71 / 11.53 / 83.4** | table scores | Yes | No | always defined for known posture | Config tables |
| RouteChoiceScore | Cross-lane arbitration score | 0–100 | per-fixture in LanePrior ablation | blendKnown | Yes | No fixture min-max | unknown keys excluded | Common features |

**Quantiles:** full p10/p25/median/p75/p90 in JSON `featureObservedRanges` and TM audit.

---

## Suspicious dispersion watchlist

| Signal | Observation | Likely diagnosis |
|---|---|---|
| TravelerMatch max &lt; 60 | F7, F8, F11, F14, F16 | scale compression **and/or** weak corpus ceiling — see TM audit |
| Selected TM ≪ corpus max | 12/18 fixtures (≥15 gap) | **downstream route selection**, not only raw TM formula |
| TimeFit std = 0 (all 100) | 54/54 | budget always inside tolerance on these fixtures — low discriminative power |
| DiscoveryFit weight = 0 in RouteChoiceScore | design | objective design implication for 0/18 Discovery winners |
| LanePrior std high (11.5) | posture/intent tables | soft prior swing; ablation changes 4/18 winners |
| ArcQuality timeUtilization vs TimeFit | architectural | **duplication risk confirmed**; Arc Vnext removes timeUtilization |
| PhysicalEfficiency | no negatives; [75.5, 91.4] | clamps hold; narrow band |

---

## Clamp behavior summary

- PhysicalEfficiency terms: `clamp01` then ×100 → blendKnown
- ArcQuality normalizedScore: `clamp01(raw)×100`
- RouteChoiceScore: no extra clamp beyond component scales; blendKnown renormalizes
- PhysicalEfficiency Vnext (parallel): explicit `[0,100]` floor/ceiling — **not in arbitration**

## UNKNOWN policy

Across V0.2: **UNKNOWN ≠ 0**. `blendKnown` / coverage-aware means drop unknown terms and renormalize.

**Do not introduce candidate-set z-scores or rescale in this gate.**
