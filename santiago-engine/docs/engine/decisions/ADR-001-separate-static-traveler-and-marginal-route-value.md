# ADR-001: Separate Static, Traveler, and Marginal Route Value

**Status:** ACCEPTED FOR V0.2 DESIGN / **NOT YET IMPLEMENTED**  
**Date:** 2026-08-28  
**Gate:** 2E.1M  
**Deciders:** Engine design (founder review via Route Lab calibration pending)

---

## Context

ChronoWalk Engine V0.1 combines several distinct questions into pipeline stages that partially overlap:

- **NodeUtility** merges editorial ChronoWorth, traveler interest match, structural/discovery posture, and context into a single 0–100 scalar.  
- **Route Composer** beam search uses NodeUtility heavily at each expansion step alongside NarrativeEdgeScore and physical feasibility.  
- **ArcQuality** (Gate 2D) evaluates complete routes but arrives after candidates are already composed.

Founder Route Lab review (Gates 2E / 2E.1) showed cases where:

- A POI ranks high on intrinsic/editorial grounds but produces geographically or narratively weak **next-stop** choices.  
- Arc reranking improves narrative arc scores while changing geographic elegance (e.g., F2, F8 watch fixtures).  
- A single scalar labeled “utility” obscures whether a stop was chosen for **static worth**, **traveler fit**, or **marginal contribution to the route-so-far**.

Without an explicit contract, V0.2 implementation risked either:

1. Tweaking ArcQuality/reranker weights to compensate for composer issues (symptom patching), or  
2. Further entangling NodeUtility with route-sequence logic (deeper conflation).

---

## Decision

Separate three scoring layers in the **V0.2 design contract**:

| Layer | Concept | Sequence-dependent? |
|---|---|---|
| Static editorial | **IntrinsicWorth** (product name: ChronoWorth) | No |
| Traveler relevance | **TravelerMatch** | No |
| Route expansion | **MarginalRouteValue** | **Yes** |

Additionally:

- **BaseNodeValue** = pre-sequence combination of IntrinsicWorth + TravelerMatch + RolePreferenceFit (pool / beam seed only).  
- **NextStopValue** = Base + Marginal + Transition + time/physical terms − penalties (beam expansion objective).  
- **ArcQuality** remains route-level evaluation; it does not generate feasibility.

Hard feasibility remains a **boolean gate** applied before desirability scoring.

Document canonical formulas, terminology table, explainability requirements, and multi-lane candidate generation in:

`docs/engine/ENGINE_SCORING_AND_COMPOSITION_V0_2.md`

---

## Consequences

### Positive

- Route Lab can explain stop choices by layer (intrinsic vs match vs marginal vs transition).  
- Multi-lane composer (SIGNATURE / DISCOVERY / FLOW) can optimize distinct objectives without overloading one scalar.  
- ArcQuality tuning and composer tuning become separable concerns.  
- Founder calibration can target the correct layer (e.g., ChronoWorth vs traveler match weights vs marginal redundancy).

### Negative / costs

- More config surface area (versioned weight files).  
- Migration work to decompose V0.1 NodeUtility into V0.2 layers without breaking regression baselines.  
- Explainability output must be expanded; partial V0.1 strings insufficient.  
- Engineering complexity in beam search (MarginalRouteValue requires ArcState at each step — already partially true via narrative graph).

### Neutral

- V0.1 runtime unchanged until a future implementation gate.  
- ChronoWorth product naming preserved.  
- Founder source structural metrics not overwritten in 2E.1M.

---

## Alternatives considered

### A. Continue tuning NodeUtility + reranker weights only

**Rejected for V0.2 design.** Route Lab evidence shows arc reranking cannot fix all composer sequence issues; weight tuning without layer separation risks opaque tradeoffs.

### B. Replace NodeUtility entirely with MarginalRouteValue everywhere

**Rejected.** Pre-sequence pool ranking still needs static traveler-independent and traveler-specific priors; computing full marginal value for entire pool before search is expensive and conceptually wrong for first-pass filtering.

### C. Make ArcQuality the primary composer driver

**Rejected.** ArcQuality requires complete (or prefix-evaluable) sequences; it is not a leg-feasibility or next-stop generator. Conflicts with Gate 2D non-goals.

### D. Single unified “POI score” with more weights

**Rejected.** Does not solve explainability or sequence-dependence naming; perpetuates calibration confusion.

---

## Migration implications (future gates)

1. Introduce V0.2 config files (`scoring-config.v0.2.ts`, etc.) without altering V0.1 defaults.  
2. Route Lab dual-mode comparison: V0.1 vs V0.2 on identical RouteRequest (required before cutover).  
3. Map existing NodeUtility components to TravelerMatch + BaseNodeValue decomposition for diagnostic parity.  
4. Implement MarginalRouteValue using existing ArcState + narrative graph signals.  
5. Add `scoringModelVersion: "0.2"` to route results.  
6. Re-run F1–F18 fixtures — expect **intentional** sequence changes only when V0.2 engine mode is selected, not when V0.1 mode is selected.

---

## References

- `docs/engine/ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md`  
- `docs/engine/ENGINE_SCORING_AND_COMPOSITION_V0_2.md`  
- `docs/engine/GATE_2E_ROUTE_LAB_V0_1.md`  
- `src/engine/scoring/nodeUtility.ts` (V0.1 implementation)  
- `src/engine/routes/route-search.ts` (V0.1 beam search)
