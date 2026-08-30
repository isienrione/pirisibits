# Experience-Time Place / Experience / Content Model V0.1

**Gate:** 2E.5-QA · **Status:** NON-CANONICAL · **PARALLEL ONLY**

Do **not** migrate Launch30 records. Do **not** duplicate Experience records. Schema + architecture only.

---

## Entities

### Place

Owns physical geometry and accessibility facts:

- coordinates + coordinate provenance
- snap points
- physical / accessibility facts
- routable flag (subject to provenance gates)

### Experience

Owns visit semantics at a place or corridor:

- `place_id` **OR** `corridor_ref`
- `visitMode`
- time / content profile (two-channel fields)
- opening / ticket constraint refs
- optional/required status (`stopRole`)
- `parent_experience_id` where relevant
- narrative identity
- provenance
- mutual-exclusion group + `compatibilityOverride`

### ContentModule

Owns authored narration:

- authored narration refs
- narrative hook / familiarity variants
- time signature reference
- provenance

Implementation: `src/engine/routes/experience-time/vnext/place-experience-schema.ts`

---

## Mutual exclusion (J)

By default, only **one** mutually-exclusive Experience for the same Place (or `mutuallyExclusiveGroupId`) may be selected in one core route.

Explicit `compatibilityOverride` allowed for future product designs (e.g. parent/extension exterior+interior).

Example class of issue: exterior + interior of the same museum must not appear as two unrelated mandatory stops unless explicitly modeled.

**No Launch30 assignments in this gate.**

---

## Two-channel time model (K)

```
Elapsed route time =
  sum(movement)
  + sum(stationary dwell)
  + required access overhead
```

Authored content does **not** automatically add elapsed time.

Content profile fields:

- `authoredContentMin`
- `walkCompatibleContentMin`
- `requiredStopMin`
- `stationaryDwellMin`
- `accessOverheadMin`

A scheduler may assign walk-compatible narration onto adjacent walking legs.

`walkingNarrationCapacityPolicy = UNKNOWN | CONFIG_REQUIRED` — **no** 0.6 / 0.7 production defaults.

---

## EMT guardrails (L)

`EMT_movement = m(A,X) + m(X,B) - m(A,B)` requires:

1. same routing snapshot
2. same mode assumptions
3. same traveler physical coefficients
4. same evidence version
5. `EMT_movement >= -epsilon`
6. violations → `DATA_INTEGRITY_ERROR`

Final route time is **recomputed from the realized sequence** — never by summing cached historical EMT values.

Implementation: `src/engine/routes/experience-time/vnext/emt-guardrails.ts`

---

## Time-indexed progression (M)

Frozen H2 step schedule **unchanged**.

Vnext contract basis: `fractionOfBudgetConsumed` with conceptual phases EARLY / MIDDLE / LATE / LANDING.

Thresholds/weights **not assigned**. Step ordinal becomes invalid when Experience durations vary greatly.

---

## Rhythm / attention state (N)

Capability fields (no final caps):

- stationary stops in rolling window
- experience beats in rolling window
- consecutive required stops
- narration load
- time since last low-attention segment

Diagnostic window: 15 minutes (stops / required stops / narration minutes). No arbitrary “max 8 stops” rule.

---

## Arrival-time state (O)

`arrivalTime` reserved on parallel route state for opening-hours feasibility at experience arrival (not merely route start).

**No fabricated venue opening hours. No production cutover.**

---

## Production flags

- `PLACE_EXPERIENCE_SCHEMA_V0_1_PARALLEL_READY = true`
- `PLACE_EXPERIENCE_SCHEMA_V0_1_PRODUCTION = false`
- `EXPERIENCE_TIME_MODEL_V0_1_PRODUCTION = false`
