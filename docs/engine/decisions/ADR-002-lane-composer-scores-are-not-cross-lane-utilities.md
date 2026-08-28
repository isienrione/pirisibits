# ADR-002: Lane ComposerScores are not cross-lane utilities

**Status:** ACCEPTED FOR V0.2 PARALLEL ARBITRATION  
**Date:** 2026-08-28  
**Gate:** 2E.2E  
**Deciders:** Engine design (founder review via Route Lab Choice Policy view pending)

---

## Context

V0.2 H2 generates one candidate per lane (SIGNATURE, DISCOVERY, FLOW). Each lane optimizes a **different objective surface**:

| Lane | Dominant expansion terms (hypothesis) |
|---|---|
| SIGNATURE | IntrinsicWorth + TravelerMatch |
| DISCOVERY | MarginalRouteValue + TravelerMatch |
| FLOW | PhysicalEfficiency + TransitionValue |

Gate 2E.2D observed DISCOVERY winning **0/18** fixtures even at B0 = 100% Composer / 0% ArcQuality. That is expected if ComposerScores are not commensurate: a higher FLOW or SIGNATURE baseline does not mean a better route for the traveler.

Treating those scalars as a shared utility (the B0–B4 blend experiment) is therefore a **legacy diagnostic**, not canonical selection.

---

## Decision

1. **Lane-specific ComposerScore is a within-objective search score.** It may be shown diagnostically. It must not dominate cross-lane choice merely because numerical distributions differ.

2. **Final route recommendation uses lane-neutral common route features** computed identically for every candidate, plus a modest traveler/request **LanePrior**.

3. Initial `RouteChoiceScore` weights (hypothesis, not production freeze):

```
0.30 TravelerMatchRoute
+ 0.20 ArcQuality
+ 0.15 RouteMarginalValue
+ 0.12 PhysicalEfficiency
+ 0.10 StructuralFit
+ 0.08 TimeFit
+ 0.05 LanePrior
```

Raw lane ComposerScore is **excluded**.

4. B0–B4 composer/ArcQuality blends are preserved as `LEGACY_CROSS_LANE_BLEND_EXPERIMENT` and are not canonical after this gate.

---

## Consequences

### Positive

- Cross-lane selection is mathematically comparable (same feature definitions, same formula).
- A FLOW route with stronger measured discovery can still be labeled “More discoveries”; labels follow observed character, not lane provenance.
- Poor preferred-lane candidates can lose (LanePrior is modest).

### Negative / costs

- Additional config surface (`arbitration-config.v0.2.ts`).
- Route Lab must show both within-lane ComposerScore (diagnostic) and RouteChoiceScore (selector).

### Neutral

- H1/H2 lane weights remain frozen in this gate.
- ArcQuality V0.2 is an adapter over V0.1 evaluation (`arcQualityVersion = 0.2.hypothesis.1`).
- V0.1 runtime unchanged. Production routing remains disabled.

---

## Alternatives considered

1. **Keep B0–B4 as the selector.** Rejected: ComposerScores are different objectives.
2. **Z-score ComposerScores across lanes in a fixture.** Rejected: fixture-local normalization makes the same absolute gap mean different things.
3. **Force DISCOVERY wins for D1.** Rejected: the question is whether the Flâneur’s best *route* won for defensible common reasons.
