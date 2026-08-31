# Feature-Complete Alpha — Architecture Freeze

**STATUS: NON-CANONICAL — DO NOT MERGE**

**Gate:** 2E.6F (freeze / founder calibration handoff)  
**Frozen baseline SHA:** `21cc50c4` (`cursor/gate-2e6-feature-complete-alpha-d85a`)  
**Parent quarantine:** Gate 2E.5-QA @ `cbb13193` · missing canonical `d8f7d6c2` lineage **not** recovered

---

## What is frozen

The **Feature-Complete Alpha architecture** is frozen as the baseline for human benchmark calibration.

| Item | Status |
|---|---|
| BUILD readiness | **19/19 READY** (`src/engine/status/engine-feature-status.v0.1.json`) |
| Scoring formulas | **Frozen** (V0.2 runtime + VNext diagnostics only) |
| Composer behavior | **Frozen** (VNext parallel; H2 frozen) |
| Arc | **Frozen** (runtime Arc + ArcQualityVNext parallel) |
| Arbitration | **Frozen** (CURRENT + EXPERIMENTAL configs) |
| Taxonomy | **Frozen** |
| Route mechanisms | **Frozen** — no new mechanisms in calibration handoff |
| B02 benchmark tuning | **Prohibited** |

**Engine fingerprints** from Gate 2E.6 (`runFingerprint`, candidate `fingerprint`, B02 demo artifact) are preserved and must not be altered by calibration UI work.

---

## What may change freely (with provenance)

These are **not** BUILD gaps and do not require engine code changes:

- **DATA** — Experience-Time profiles, visit modes, opening hours, tickets, accessibility evidence
- **CALIBRATION** — weights, phase thresholds, arbitration experimental config (after benchmark evidence)
- **CONTENT** — ContentModules, narrative hooks, familiarity variants
- **HUMAN VALIDATION** — founder benchmark routes, rubric scores, disagreement classifications

All data/calibration/content changes must record **provenance** and must not silently rewrite frozen engine outputs.

---

## Policy for future engine changes

Any change to scoring, composer, Arc, arbitration, or search **requires benchmark evidence**:

1. Run founder comparison against B01–B12 (or affected subset)
2. Classify disagreements (`src/engine/review/founder-benchmark-review.v0.1.ts`)
3. Document whether change addresses DATA, CALIBRATION, CONTENT, SEARCH, ARBITRATION, etc.
4. Do **not** tune to a single fixture (especially B02) without cross-benchmark review

---

## Production & lineage

- `ENGINE_FEATURE_COMPLETE_ALPHA = true`
- `ENGINE_FEATURE_COMPLETE_ALPHA_CANONICAL = false`
- `PRODUCTION_ROUTE_GENERATION = false`
- `EXPERIENCE_TIME_PRODUCTION = false`
- **Do not merge** to `chronowalk3.0`, `figma`, or `main` as canonical
- **Do not merge** PR #310 / prior quarantine PRs as canonical without lineage recovery

---

## Founder calibration tools

- Comparison schema: `src/engine/review/founder-benchmark-review.v0.1.ts`
- Alpha Lab Founder Comparison: `docs/engine/gate-2e6-feature-complete-alpha-lab.html?engine=FEATURE_COMPLETE_ALPHA&mode=founder-comparison`
- Frozen engine snapshots: `src/data/santiago/qa/gate_2e6_feature_complete_alpha_lab.v0.1.json`

Founder ratings and human routes **do not** trigger engine recomputation.
