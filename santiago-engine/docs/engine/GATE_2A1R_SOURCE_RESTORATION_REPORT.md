# Gate 2A.1R — Founder Santiago Semantic Source Restoration

**Gate:** 2A.1R  
**Status:** PASS (founder seed restored; ChronoWorth/visit still AI-proposed)  
**Starting checkpoint:** `331c735dd72ccbb579840b4d6076bc0bc4e2fa43`  
**Canonical source:** `src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json`

---

## Source validation

| Check | Result |
|---|---|
| Schema | `SANTIAGO_ENGINE_DATASET_V0.1` |
| Status | `GATE_1_CANONICAL_INPUT_FREEZE` |
| Node count | **103** (`STGO_01`…`STGO_103`) |
| Frozen provenance | `source_fields_are_frozen_input: true` |
| AI-derived marked | `derived_fields_are_ai_proposals: true` |
| structural_metrics ×4 | present on all 103 |
| vectors t1a…t9 | present on all 103 |
| tier | present on all 103 |
| flags + `source_present_flag_keys` | present (absence ≠ false) |

---

## Restoration outcomes

| Artifact | Path | Count |
|---|---|---|
| Canonical semantic seed | `src/data/santiago/santiago_semantic_calibration.v0.1.json` | **103** |
| Launch curator proposal | `src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json` | **30** |
| Curator Studio | `docs/engine/gate-2a1-editorial-calibration.html` | — |

### Provenance priority now enforced

`CURATOR_APPROVED` > `FOUNDER_PRECALIBRATED` > `AI_PROPOSED_UNVERIFIED` > `DERIVED_CONVENIENCE` > `UNKNOWN`

- **Themes / structural metrics / tier / present flags:** `FOUNDER_PRECALIBRATED`
- **ChronoWorth / visit time / most M-modes:** `AI_PROPOSED_UNVERIFIED`
- **ThemeCode tags:** derived @ 0.45
- **`src/data/pois.ts` canonical dependency:** **0**
- **Binary→0.7 canonical fallback:** **0**

### ChronoWorth

```
100 * (0.35*heritage_depth + 0.30*anchor_density + 0.20*micro_reveal + 0.15*polish)
```

Inputs = founder structural metrics (not proxies). Source `ai_proposals.chronoworth` kept for QA compare only. Approved count = **0**.

### Sensitive memory (founder source)

`STGO_04`, `STGO_07`, `STGO_36`, `STGO_48`, `STGO_51`

Launch-relevant: `STGO_04`, `STGO_07`, `STGO_48`.  
Gate 2A.1 provisional `STGO_19` is **not** founder-sensitive (flag absent → UNKNOWN).

### Flags

Absence from `source_present_flag_keys` stays **UNKNOWN** (not coerced to false).  
`step_free` and `daylight_only` are PRESENT on all 103 in this dataset.

---

## NodeUtility

Consumes restored founder continuous T1A–T9 vectors. Culinary fixture ranks founder T2 nodes first.

Physical freeze unchanged. Route composition / NarrativeEdgeScore absent.

---

## Flags

| Flag | Value |
|---|---|
| `PHYSICAL_LAYER_V0_1_READY` | true |
| `PHYSICAL_ROUTE_GENERATION_ENABLED` | false |
| `NODE_UTILITY_V0_1_READY` | true |
| `EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY` | true |
| `EDITORIAL_CALIBRATION_CURATOR_APPROVED` | false |

---

## Founder decisions still required

1. Review/approve ChronoWorth proposals.  
2. Review visit-time proposals.  
3. Confirm M-mode AI proposals.  
4. Supply opening hours from trustworthy sources (still UNKNOWN).  
5. Export curator decisions for later approval ingest.

## Blockers before Gate 2B

Curator-approved calibration not yet ingested; opening hours largely UNKNOWN; Narrative/relational graph not started.
