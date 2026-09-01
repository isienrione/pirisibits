# Gate 2C — Provisional Route Composer V0.1

## Status

**PROVISIONAL_PRE_FOUNDER_CALIBRATION** for Route Lab / founder inspection / product development.

| Flag | Value |
|------|-------|
| `EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY` | `true` |
| `EDITORIAL_CALIBRATION_CURATOR_APPROVED` | `false` |
| `ENGINE_USING_PROVISIONAL_EDITORIAL_CALIBRATION` | `true` |
| `NARRATIVE_GRAPH_V0_1_PROPOSED_READY` | `true` |
| `ROUTE_COMPOSER_V0_1_PROVISIONAL_READY` | `true` |
| `PHYSICAL_ROUTE_GENERATION_ENABLED` | `false` |

`ROUTE_COMPOSER_V0_1_PROVISIONAL_READY` does **not** enable production traveler routing.

## What this is

Constrained **beam search** over Launch30 that combines:

1. Hard eligibility first  
2. Frozen physical walk (+ operational Metro when requested)  
3. NodeUtility  
4. NarrativeEdgeScore / ArcState  
5. Time budget  
6. Soft composition / diversity  

Not: sort POIs and connect them. Not final ArcQuality (Gate 2D).

## Modules

| Path | Role |
|------|------|
| `src/engine/routes/route-types.ts` | Request/result contracts |
| `src/engine/routes/route-request.ts` | Normalize + stable hash |
| `src/engine/routes/route-config.ts` | Beam/weights/bands |
| `src/engine/routes/route-physical.ts` | Frozen walk + Metro L1–L6 (never L7) |
| `src/engine/routes/route-score.ts` | Incremental + completed provisional score |
| `src/engine/routes/route-search.ts` | Beam search |
| `src/engine/routes/route-diversity.ts` | Multi-candidate selection |
| `src/engine/routes/route-explain.ts` | Inclusion / omission text |
| `src/engine/routes/route-compare.ts` | Route Lab comparison helpers |
| `src/engine/routes/route-composer.ts` | Public `composeProvisionalRoutes` |

Fixtures summary (not production routes):  
`src/data/santiago/routes/route-composer-fixtures.v0.1.json`

## Physical rules

- Walk: `santiago_pedestrian_adjacency.v0.2.json` only  
- Metro: operational lines L1–L6 from multimodal v0.3 + GTFS scheduled ride times; transfer penalty kept distinct  
- **STGO_104**: never in physically routed candidates while `PHYSICAL_PENDING_EDGE_ENRICHMENT` (diagnostic omission)  
- **STGO_33**: physical not runtime-ready — excluded from routes  

## Recomputation

Every result carries `requestHash` + `inputVersions` so the same RouteRequest can be recomputed after calibration changes.

## Build / validate

```bash
npm run gate:2c:build
npm run gate:2c:validate
```

## Non-goals

Final ArcQuality · production route API · app UI · live GPS · opening-hours provider · LLM route generation · Gate 2D.
