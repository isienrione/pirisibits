# Gate 2B — Provisional Narrative Graph V0.1

## Status

**PROVISIONAL.** Built under founder authorization to proceed with engine construction **before** full founder calibration completion.

| Flag | Value |
|------|-------|
| `EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY` | `true` |
| `EDITORIAL_CALIBRATION_CURATOR_APPROVED` | `false` |
| `ENGINE_USING_PROVISIONAL_EDITORIAL_CALIBRATION` | `true` |
| `NARRATIVE_GRAPH_V0_1_PROPOSED_READY` | `true` |
| `PHYSICAL_ROUTE_GENERATION_ENABLED` | `false` |

Artifact metadata mirrors this: `calibrationStatus: PROVISIONAL`, `calibrationApproved: false`.

## Purpose

Create a sparse directed narrative graph over the **current Launch30** corpus with:

- typed narrative relations
- deterministic **NarrativeEdgeScore**
- minimal **ArcState** + arc signal helpers
- explainability on runtime-eligible edges
- QA summary

This gate does **not** compose traveler routes (Gate 2C+).

## Active corpus

Loaded from `src/data/santiago/santiago_launch_corpus.v0.1.json` (not a hardcoded stale list).

- **30** nodes
- Includes **STGO_33** (Gárgola de Luciano K) and **STGO_104** (Bolsa)
- Excludes **STGO_23**

Semantic values come from proposed launch editorial calibration with provenance recognition (`FOUNDER_PRECALIBRATED`, `AI_PROPOSED_UNVERIFIED`, `UNKNOWN`, etc.). **UNKNOWN ≠ 0.**

## Artifacts

| Path | Role |
|------|------|
| `src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json` | Proposed graph + QA |
| `src/engine/narrative/narrative-types.ts` | Types |
| `src/engine/narrative/narrative-constants.ts` | Weights / thresholds |
| `src/engine/narrative/narrative-edge-score.ts` | Deterministic scorer |
| `src/engine/narrative/arc-state.ts` | ArcState transitions |
| `src/engine/narrative/arc-signals.ts` | Gate 2D signal helpers (not final ArcQuality) |
| `src/engine/narrative/propose-narrative-edges.ts` | Offline sparse proposal |
| `src/engine/narrative/narrative-loader.ts` | Loader + guards |

Build: `npm run gate:2b:build`  
Validate: `npm run gate:2b:validate`

## NarrativeEdgeScore

```
score =
  + w_semantic * semanticContinuity
  + w_causal * causalContinuity
  + w_contrast * contrastSurprise
  + w_reveal * revealValue
  + w_escalation * escalationDeepening
  + w_relief * reliefValue
  + w_spatial * spatialLegibility
  + w_prereq * prerequisiteSatisfaction
  - w_repeat * repetitionPenalty
```

Unavailable components (e.g. UNKNOWN themes) are omitted from the weighted average — **not** treated as zero. No runtime LLM.

## Physical / narrative separation

Narrative desirability **never** implies physical feasibility. Edges record physical eligibility fields but do not create walking edges or enable routing. STGO_104 remains `PHYSICAL_PENDING_EDGE_ENRICHMENT`; coordinate haversine may inform **spatialLegibility only**.

## Generation discipline

Allowed: thematic similarity, structural contrast, tier transitions, spatial proximity, explicit metadata.

Not allowed: invented historical causality / shared events. Unsupported `causal_followup` edges are retained as **`NON_RUNTIME_PENDING_EDITORIAL_EVIDENCE`** (LOW confidence) and excluded from runtime-eligible scoring.

## STGO_104

If semantics remain UNKNOWN: only identity/spatial proposals; limitations recorded; thematic continuity unavailable.

## Not started

Gate 2C route composition · final ArcQuality · traveler routing · curator approval promotion.

## Graph QA (build snapshot)

| Metric | Value |
|--------|-------|
| Nodes | 30 |
| Directed edges | 162 |
| Runtime-eligible | 150 |
| Non-runtime pending evidence | 12 |
| Average outgoing degree | 5.4 |
| Median outgoing degree | 5 |
| Isolated narrative nodes | none |
| Withheld unsupported causal proposals | 15 (12 retained non-runtime) |
| Bottom runtime-eligible score | 40 |

Relation types (retained): sets_up, contrast, material_transition, causal_followup (non-runtime), escalation, relief.

Confidence: MEDIUM / LOW. Provenance includes FOUNDER_PRECALIBRATED, AI_PROPOSED_UNVERIFIED (pending causal), UNKNOWN (STGO_104-linked).
