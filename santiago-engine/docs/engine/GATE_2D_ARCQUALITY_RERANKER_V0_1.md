# Gate 2D — ArcQuality + Route Reranker V0.1

## Status

**PROVISIONAL_V0_1** — route-level arc evaluation reranks Gate 2C candidates; does not replace composer feasibility.

| Flag | Value |
|------|-------|
| `EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY` | `true` |
| `EDITORIAL_CALIBRATION_CURATOR_APPROVED` | `false` |
| `ENGINE_USING_PROVISIONAL_EDITORIAL_CALIBRATION` | `true` |
| `NARRATIVE_GRAPH_V0_1_PROPOSED_READY` | `true` |
| `ROUTE_COMPOSER_V0_1_PROVISIONAL_READY` | `true` |
| `ARC_QUALITY_V0_1_PROVISIONAL_READY` | `true` |
| `PHYSICAL_ROUTE_GENERATION_ENABLED` | `false` |

## What this is

Deterministic **route-level ArcQuality** and **reranker** over physically feasible `RouteCandidateV01` outputs from Gate 2C.

Answers: *Of valid composer candidates, which sequence feels most like a coherent ChronoWalk experience?*

Does **not**:

- Replace Route Composer feasibility or repair invalid routes  
- Mutate frozen physical / narrative / founder source data  
- Enable production routing or runtime LLM dependency  

## Modules

| Path | Role |
|------|------|
| `src/engine/routes/arc-quality-config.ts` | Centralized weights + thresholds |
| `src/engine/routes/arc-quality.ts` | Full ArcQuality score + validation |
| `src/engine/routes/route-reranker.ts` | `rerankRouteCandidates` |
| `src/engine/routes/route-position-role.ts` | OPENER / DEVELOPMENT / LANDING roles |
| `src/engine/routes/route-shape.ts` | ANCHOR_LED_CIVIC_ARC, DISCOVERY_WEAVE, … |
| `src/engine/routes/route-quality-diagnostics.ts` | Severity + threshold diagnostics |

Fixtures (composer vs reranked):  
`src/data/santiago/routes/arc-reranker-fixtures.v0.1.json`

## ArcQuality signals

**Positive:** openingStrength, developmentStrength, payoffStrength, endingStrength, rhythmBalance, curiosityContinuity, themeDiversity, thematicCoherence, contrastBalance, revealSpacing, anchorDistribution, structuralVariety, relationTypeVariety, questionResolution, timeUtilization, routeDistinctiveness.

**Penalties:** repetition, unresolved setup, structural/theme/relation monotony, weak ending, overstuffing, underutilized budget (when worthwhile continuations existed), backtracking.

## Rerank blend

```
rerankedScore = 0.60 × composerProvisionalScore + 0.40 × arcQuality
```

Weights in `RERANK_BLEND_WEIGHTS` (`arc-quality-config.ts`).

## Traveler modifiers

- **THEMATIC** / preferred themes → coherence ↑  
- **D1** → diversity / structural variety ↑  
- **D2** → curiosity / question resolution ↑  
- **M1 / express** → payoff / ending ↑  
- **ESSENTIALS** → opening / anchor distribution ↑  
- **DISCOVERY** → variety ↑  

## Build / validate

```bash
npm run gate:2d:build
npm run gate:2d:validate
```

## Non-goals

Gate 2E · production route API · app UI · LLM explanations · mutating composer candidates in place.
