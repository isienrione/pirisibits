# ADR-003: Route Composes Experiences, Not Fixed POI Dwell

**Status:** ACCEPTED FOR V0.1 CONTRACT / **PARALLEL ONLY — NOT PRODUCTION**  
**Date:** 2026-08-30  
**Gate:** 2E.4  
**Deciders:** Engine design (founder-approved identity corrections co-shipped)

---

## Context

Gate 2E.3.2 proved the current route-time model is insufficient for ChronoWalk:

```
RouteTime = Σ POI scalar dwell + Σ transition time
```

Limitations observed:

- visit mode not modeled
- interior / exterior not modeled
- pass-through not modeled
- optional interior not modeled
- entry / access overhead not modeled
- ticket and opening-hours dependencies do not affect time
- on-pathness not modeled
- dense-core behavior not modeled
- marginal insertion cost not used by composer
- `POI visitTime.typical` is a single scalar
- fallback dwell = 12 minutes (legacy)

R1 consequence (illustrative): a Balanced First-Timer near budget could not distinguish a low-marginal-movement pass-through from a full interior stop, nor separate optional museum interiors from core walk time.

Tuning scoring weights cannot fix a missing **experience-time ontology**.

---

## Decision

ChronoWalk route composition operates on:

> **experiences at places**

not merely:

> **POIs with one fixed dwell scalar**.

Separate:

| Concept | Meaning |
|---|---|
| PLACE | Canonical node / physical locus (`STGO_*`) |
| EXPERIENCE AT PLACE | A VisitMode-specific experience-time profile |

Canonical VisitMode taxonomy V0.1:

- `PASS_THROUGH`
- `EXTERIOR_CORE`
- `INTERIOR_CORE`
- `OPTIONAL_INTERIOR`
- `EXTENDED_VISIT`
- `UNKNOWN`

### Why fixed dwell fails

1. **Museums vs facades** — A museum interior and an exterior facade stop are different experiences at related or identical places; one scalar cannot represent both.
2. **Pass-through discoveries** — Corridor experiences may add little marginal *movement* while still carrying authored content / small dwell; zero dwell must not be assumed.
3. **Optional interiors** — Core ChronoWalk time must be separable from optional extensions (e.g. enter museum only if requested).
4. **Dense urban cores** — More stops should emerge from lower effective marginal movement, not commune-specific quotas.
5. **Marginal insertion cost** — Correct insertion cost is  
   `movement(A,X)+movement(X,B)−movement(A,B)+experienceDwell(X)+accessOverhead(X)+…`  
   not `transition(A,X)+dwell(X)` alone.
6. **Traveler-dependent depth** — Time budget, museum preference, ticket aversion, and slow/deep exploration change which modes are eligible.

### Content-time vs stationary-time

Authored content duration is not automatically stationary dwell. The model distinguishes:

- `authoredContentMin`
- `stationaryDwellMin`
- `walkCompatibleContentMin`
- `requiredStop`

and whether content may **overlap** movement (declared; never invented percentages).

### Stop role (orthogonal to editorial importance)

- `REQUIRED_STOP`
- `ENROUTE_DISCOVERY`
- `OPTIONAL_EXTENSION`

---

## Consequences

### Positive

- Composer can eventually budget core vs optional time honestly.
- Diagnostics can report EXPERIENCE_TIME_UNKNOWN instead of fabricating modes.
- Dense cores improve via marginal time, not hard-coded stop counts.
- Traveler preferences map to mode eligibility without UI/LLM in this gate.

### Costs / constraints

- Requires curator calibration (AI propose → founder verify → approve).
- Parallel evaluator only in Gate 2E.4 — production composer unchanged.
- Legacy `calibration.visitTime.typical` retained via `LEGACY_SCALAR_DWELL` adapter.

### Non-goals (this gate)

- Do not assign modes to all POIs.
- Do not cut into production composition.
- Do not change +8 min tolerance.
- Do not invent Museo Precolombino interior/exterior split without evidence.

---

## References

- `docs/engine/EXPERIENCE_TIME_MODEL_V0_1.md`
- `src/engine/routes/experience-time/`
- `docs/data/SANTIAGO_IDENTITY_DECISIONS_V0_1.md`
