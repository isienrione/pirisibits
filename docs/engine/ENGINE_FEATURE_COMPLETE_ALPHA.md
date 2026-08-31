# ChronoWalk Engine — Feature-Complete Alpha

**Gate 2E.6 · NON-CANONICAL · DO NOT MERGE**

## What “Feature-Complete Alpha” means

A real `TravelerRequest` can traverse:

TravelerModel → Context → Hard Feasibility → Feasible Experience Graph → IW / TM / RoleFit / MRV / TransitionValue → ArcState-guided composition → Experience-Time (legacy compatibility) → multi-candidate routes → ArcQualityVNext → lane-neutral arbitration → deterministic explanation

and produce an inspectable recommendation.

**No fundamental subsystem exists only in documentation.**

## Architecture implemented

| # | Component | Module |
|---:|---|---|
| 1–2 | Experience / Physical graphs | `vnext/place`, frozen physical graph |
| 3 | Narrative graph adapter | `vnext/narrative` |
| 4–8 | Interests / posture / structure / context / TravelerModel | `vnext/scoring/traveler-facets`, `vnext/posture` |
| 9–10 | Hard feasibility + Feasible Experience Graph | `vnext/feasibility` |
| 11–15 | IW/TM/RoleFit/MRV/Transition | V0.2 scoring via Experience adapter |
| 16 | ArcState + IncrementalArcValue | `vnext/arc` |
| 17 | Multi-route Composer VNext | `vnext/composer` (H2 frozen) |
| 18 | ArcQualityVNext | `vnext/arc/arc-quality-terminal` |
| 19 | Arbitration + Explanation + Live Trace | `vnext/arbitration`, `explanation`, `trace`, `pipeline` |

Entry: `runFeatureCompleteAlpha()` in `src/engine/vnext/pipeline/run-feature-complete-alpha.ts`

## Explicit disclosures

- **LEGACY_EXPERIENCE_ADAPTER = true** — Places/Experiences from Launch30 POIs without inventing visit modes or dwell.
- **TIME MODEL: LEGACY COMPATIBILITY** — Experience-Time calibration pending; uses `visitTime.typical` only through adapter.
- **Weights provisional** — `EXPERIMENTAL_FULL_FEATURE_OBJECTIVE` marked `CALIBRATION_REQUIRED`.
- **PosturePolicyVNext** is shadow-only; 12 legacy touchpoints not deleted.

## Remaining work (NOT BUILD gaps)

### DATA_CALIBRATION
- Curated ExperienceTime profiles / visit modes
- Semantic facet values for Santiago Experiences
- D2 question/reveal/resolution density
- Hiking / outdoor suitability evidence
- Opening hours / tickets / accessibility trusted evidence

### HUMAN_VALIDATION
- Founder review of provisional weights & phase thresholds
- Editorial approval of Experience identities beyond legacy adapter
- Narrative role capability assignment

### FIELD VALIDATION
- Walking narration capacity (policy remains UNKNOWN / CONFIG_REQUIRED)
- Rhythm caps (diagnostics only — no production rejection)
- Arrival-time opening-hours checks against real schedules

### PRODUCTION
- All production cutover flags remain false
- Not canonical; not merged to chronowalk3.0 / figma / main

## Route Lab

`?engine=FEATURE_COMPLETE_ALPHA` — see Route Lab alpha panel / embed.

Demo artifact: `src/data/santiago/qa/gate_2e6_feature_complete_alpha_demo.v0.1.json`

## Benchmarks

B01–B12 request fixtures (no gold routes). Hiking/nature/memory may return `DATA_COVERAGE_LIMITED`.

## ADRs

- ADR-004 Composition unit is Experience
- ADR-005 Route arc is incremental and terminal
- ADR-006 Content personalization is modular
