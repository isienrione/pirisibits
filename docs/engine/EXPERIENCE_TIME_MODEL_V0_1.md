# Experience-Time Model V0.1

**Gate:** 2E.4  
**Status:** PARALLEL READY / PRODUCTION = false  
**Flags:**

- `EXPERIENCE_TIME_MODEL_V0_1_PARALLEL_READY=true`
- `EXPERIENCE_TIME_MODEL_V0_1_PRODUCTION=false`
- `PHYSICAL_ROUTE_GENERATION_ENABLED=false`

Implementation: `src/engine/routes/experience-time/`  
ADR: `docs/engine/decisions/ADR-003-route-composes-experiences-not-fixed-poi-dwell.md`

---

## 1. Taxonomy (VisitMode)

| Mode | Distinguishes |
|---|---|
| `PASS_THROUGH` | Experience encountered essentially while moving |
| `EXTERIOR_CORE` | Intentional exterior / facade / site stop |
| `INTERIOR_CORE` | Intentional interior experience (core) |
| `OPTIONAL_INTERIOR` | Optional interior extension |
| `EXTENDED_VISIT` | Longer destination-style experience |
| `UNKNOWN` | Not calibrated — remains UNKNOWN |

Do **not** assign modes to Launch30 / all POIs in this gate.

---

## 2. Types

### ExperienceTimeProfile

```
visitMode
dwellMin / dwellTypical / dwellMax
accessOverheadMin?
openingHoursDependent
ticketDependent
canBeOptionalExtension
stopRole (REQUIRED_STOP | ENROUTE_DISCOVERY | OPTIONAL_EXTENSION | UNKNOWN)
contentTime { authoredContentMin, stationaryDwellMin, walkCompatibleContentMin, requiredStop, contentMayOverlapMovement }
onPath (true | false | null=UNKNOWN)
provenance
confidence
```

### Content-time vs stationary-time (O2)

Authored duration ≠ stationary dwell automatically.

Examples (capability only — not populated for Launch30 here):

- Facade story: `stationaryDwellMin > 0`
- Transition narration: `walkCompatibleContentMin > 0`, `stationaryDwellMin = 0`
- Pass-through discovery: small/zero stationary dwell, nonzero authored content, low marginal movement when on-path

### Concurrency (O3)

`routeElapsedTime ≠ Σ audioMinutes + Σ walkingMinutes` when content is explicitly walk-compatible and overlap is declared.

- Overlap must be declared by experience/content mode.
- No arbitrary overlap percentages.
- UNKNOWN overlap capability remains UNKNOWN.

### Stop role (O4)

Separate from editorial importance:

- `REQUIRED_STOP` — intentional stop
- `ENROUTE_DISCOVERY` — corridor-consumable; does not automatically create full stop burden
- `OPTIONAL_EXTENSION` — excluded from core unless selected

---

## 3. Formulas

### EffectiveMarginalTime(X between A,B)

```
movement(A,X) + movement(X,B) − movement(A,B)
+ experienceDwell(X)
+ accessOverhead(X)
+ other explicitly modeled time burden
```

Do **not** substitute `transition(A,X) + dwell(X)` when evaluating insertion into an existing sequence.

### Core route time

```
CORE_ROUTE_TIME =
  movementTime
  + coreExperienceTime
  + required accessOverhead
```

`OPTIONAL_EXTENSION_TIME` is reported separately unless the traveler explicitly requests/includes the extension.

### Tolerance

Current **+8 min** tolerance is unchanged in this gate.

---

## 4. UNKNOWN policy

- UNKNOWN must remain UNKNOWN.
- No fabricated defaults masquerading as evidence.
- Missing VisitMode → `UNKNOWN` / `EXPERIENCE_TIME_UNKNOWN`.
- Missing dwell → null, not 12-minute fallback (legacy fallback stays in legacy composer only).
- Insufficient geometry → `onPath = UNKNOWN` (null), **not** false.

---

## 5. Provenance policy

Every calibrated experience-time value must carry provenance, e.g.:

- `AI_PROPOSED_UNVERIFIED`
- `PROVIDER_DERIVED`
- `CURATOR_APPROVED`
- `FIELD_VERIFIED`
- `FOUNDER_APPROVED`
- `LEGACY_SCALAR_DWELL`
- `UNKNOWN`

AI may propose offline. Runtime must not pretend AI-proposed values are verified facts.

---

## 6. Marginal insertion

Composer should eventually rank candidates by **effective marginal time** (and value), not by scalar dwell alone.

Pass-through / on-path experiences can have low marginal *movement* while still carrying experience dwell / content.

---

## 7. Optional extensions

Support:

> BASE ChronoWalk experience + optional EXTENSION

Example concept (not assigned without evidence):

- Museo Precolombino base = exterior/context
- Extension = interior museum visit

Route messaging eventual shape:

- 2h core walk
- Optional: + museum interior ~X min

---

## 8. Dense-core implications

**Do not** invent commune quotas (e.g. Centro=10, Las Condes=6).

Dense areas naturally support more experiences because **marginal movement cost is lower**.

Composer reacts to effective marginal time.

---

## 9. Traveler-mode interaction

Architecture-only (no UI, no live LLM):

| Traveler signal | Effect |
|---|---|
| Only 2 hours | Prioritize core experiences; defer extensions |
| Want museums | Interior modes eligible |
| No paid attractions | Exclude ticket-dependent interiors; retain exterior where available |
| Slow/deep exploration | Extended modes may become eligible |

---

## 10. Legacy compatibility

- Do **not** delete `calibration.visitTime.typical`.
- Do **not** change current composer behavior.
- Adapter: `LEGACY_SCALAR_DWELL` (`adaptLegacyScalarDwell`).
- New model is **parallel only**.

---

## 11. Parallel evaluator

`evaluateParallelRouteTime` / `computeEffectiveMarginalTime` / `computeRouteTimeBudget`

Given explicit `ExperienceTimeProfile`s, computes:

- movement time
- core dwell
- access overhead
- optional extension
- effective marginal insertion time
- total core route time

**Must not** change composer output.

---

## 12. Future composer integration plan

1. Curate VisitMode + dwell bands for Launch30 (AI propose → founder approve).
2. Wire parallel evaluator beside composer diagnostics (shadow).
3. Replace insertion cost with EffectiveMarginalTime in beam expansion.
4. Split budget accounting (core vs optional).
5. Cut over behind `EXPERIENCE_TIME_MODEL_V0_1_PRODUCTION` only after regression PASS.

---

## 13. R1 shadow diagnostic

See `src/engine/routes/experience-time/r1-shadow-diagnostic.ts`.

All listed R1 POIs report `EXPERIENCE_TIME_UNKNOWN` until curated. Legacy scalar dwell is compatibility-only.
