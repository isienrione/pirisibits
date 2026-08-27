# Gate 1B.3 — Santiago Pedestrian Physical Edge Graph Report

**Gate:** 1B.3  
**City:** Santiago  
**Node inventory:** `src/data/santiago/santiago_engine_nodes.v0.1.json` (103 nodes, unchanged)  
**Edge artifact:** `src/data/santiago/santiago_physical_edges.v0.1.json`  
**Provider:** Mapbox Directions (`mapbox/walking`)  
**Physical route generation (traveler-facing):** **DISABLED**

---

## Summary

Built the first verified, sparse, provider-derived **pedestrian edge graph** for the Santiago launch corpus. All canonical walk distance and duration values come from Mapbox walking directions. Haversine distance was used **only** for candidate pair pruning.

No thematic, narrative, or recommendation data participated in edge generation.

| Metric | Value |
|---|---|
| Edge-eligible launch nodes | 27 |
| Excluded launch nodes | 3 (`STGO_05`, `STGO_23`, `STGO_33`) |
| Candidate directed pairs | 603 |
| Mapbox routing successful | 603 |
| Mapbox routing failures | 0 |
| Canonical edge records (incl. pruned) | 603 |
| Runtime WALK edges | 598 |
| GREEN | 430 |
| YELLOW | 168 |
| ORANGE (non-runtime) | 5 |
| RED | 0 |
| Pruned candidates | 5 |

---

## Edge-eligible nodes (27)

`STGO_01`, `STGO_02`, `STGO_03`, `STGO_04`, `STGO_06`, `STGO_07`, `STGO_10`, `STGO_11`, `STGO_16`, `STGO_18`, `STGO_19`, `STGO_20`, `STGO_21`, `STGO_22`, `STGO_24`, `STGO_25`, `STGO_26`, `STGO_27`, `STGO_28`, `STGO_29`, `STGO_30`, `STGO_32`, `STGO_34`, `STGO_35`, `STGO_48`, `STGO_91`, `STGO_92`

### Excluded launch nodes

| STGO | Reason |
|---|---|
| **STGO_05** | `PARTIAL_REVIEW_REQUIRED` — coordinate conflict; excluded from runtime edge generation (curation unchanged) |
| **STGO_23** | `UNRESOLVED_RESEARCH_REQUIRED` — no trustworthy coordinates |
| **STGO_33** | `NEEDS_SEMANTIC_REVIEW` — experience-only; no approved POI |

---

## Routing endpoint policy

Priority per node:

1. Curator-approved **experience/observation** point (traveler-facing)
2. Curator-approved **POI** coordinate
3. Provider candidate (only when eligible and no curator coordinate — not needed for current 27)

**STGO_32:** Funicular experience/access point used (`funicular`); hill POI and other access points not collapsed.

Each edge records `fromPoint` / `toPoint` with `pointId`, `pointType`, and `coordinateSource`.

---

## Sparse candidate generation

Per eligible node:

- Up to **10** nearest eligible neighbors by straight-line distance
- All eligible nodes within **2.0 km** straight-line
- Explicit inclusion of central QA adjacency pairs

**603** unique directed candidate pairs (not a naive 27×27 complete graph).

---

## Edge classification (provider duration)

Thresholds in `src/lib/city-graph/physical-edge-constants.ts`:

| Class | Duration | Runtime eligible |
|---|---|---|
| GREEN | ≤ 20 min | Yes |
| YELLOW | > 20 and ≤ 35 min | Yes |
| ORANGE | > 35 and ≤ 60 min | No |
| RED | > 60 min or provider failure | No |

**ORANGE edges (5):** All involve long walks from **STGO_48** (Museo de la Memoria) to central nodes (~36–39 min). Correctly excluded from runtime graph.

---

## Graph health

| Metric | Value |
|---|---|
| Nodes with ≥1 outgoing edge | 27/27 |
| Nodes with ≥1 incoming edge | 27/27 |
| Isolated nodes | 0 |
| Connected components | 1 |
| Average out-degree (runtime) | 22.15 |
| Median edge distance | 1,311 m |
| Median edge duration | 15.81 min |

### Central pair QA (direct provider edges)

| Pair | Class | Duration |
|---|---|---|
| STGO_01 → STGO_02 (Plaza de Armas ↔ Catedral) | GREEN | 3.5 min |
| STGO_01 → STGO_03 (Plaza de Armas ↔ La Moneda) | GREEN | 10.95 min |
| STGO_03 → STGO_04 (La Moneda ↔ Morandé 80) | GREEN | 3.64 min |
| STGO_06 → STGO_07 (París-Londres ↔ Londres 38) | GREEN | 0.63 min |
| STGO_24 → STGO_25 (Lastarria ↔ GAM) | GREEN | 5.27 min |
| STGO_24 → STGO_26 (Lastarria ↔ MNBA/Forestal) | GREEN | 5.16 min |
| STGO_29 → STGO_32 (La Chascona ↔ San Cristóbal) | GREEN | 1.97 min |
| STGO_34 → STGO_35 (La Vega ↔ Tirso de Molina) | GREEN | 3.29 min |

---

## QA shortest paths (runtime graph only — not product routes)

| Route | Connected | Duration | Distance | Legs |
|---|---|---|---|---|
| Plaza de Armas → Lastarria | Yes | 16.77 min | — | multi-leg |
| La Moneda → Londres 38 | Yes | 8.97 min | — | multi-leg |
| Lastarria → La Chascona | Yes | 11.5 min | — | multi-leg |
| La Vega → GAM | Yes | 23.2 min | — | multi-leg |
| Yungay → Museo de la Memoria | Yes | 8.01 min | — | multi-leg |

---

## Physical cost foundation

Each successful edge includes `physicalCost` with real Mapbox `distanceM` / `durationS` / `durationMin`. Future friction fields (`stepFree`, `surfaceRoughness`, `crossingFriction`, `inclineFriction`, `crowdFriction`, `pleasantness`) are **null** — not invented.

---

## Proximity matrix comparison

**REFERENCE_MATRIX_NOT_PRESENT** — no founder inter-island proximity matrix found in repository. Gate continued with verified provider data only.

---

## Artifacts

| Artifact | Path |
|---|---|
| Canonical edges | `src/data/santiago/santiago_physical_edges.v0.1.json` |
| Candidate QA (non-canonical) | `src/data/santiago/qa/santiago_physical_edge_candidates.v0.1.json` |
| Edge constants | `src/lib/city-graph/physical-edge-constants.ts` |
| Types | `src/lib/city-graph/types.ts` |
| Builder | `scripts/physical-graph/build_santiago_pedestrian_edges.py` |
| QA HTML | `docs/city-graph/gate-1b3-edge-review.html` |

---

## Validators & tests

| Check | Result |
|---|---|
| Gate 1B.3 validator | PASS |
| Gate 1B.2A / 1B.2 validators | PASS |
| Synthetic-pattern validator | PASS |
| Python Gate 1B.3 tests | PASS |
| Vitest | PASS (20 tests) |
| TypeScript `tsc --noEmit` | PASS |
| Secret scan | PASS |
| `PHYSICAL_ROUTE_GENERATION_ENABLED` | `false` |

---

## Explicit non-goals (unchanged)

- Metro / transit edge generation **not** started  
- Traveler-facing route generation **not** enabled  
- Recommendation / narrative scoring **not** started  
- No push to remote  

---

## Remaining blockers before multimodal physical graph

1. **STGO_05** — resolve coordinate conflict; promote to edge-eligible when POI/experience endpoints are trustworthy  
2. **STGO_23** — editorial/identity research before physical promotion  
3. **STGO_33** — semantic review; approved POI required  
4. **ORANGE long walks** — e.g. Museo de la Memoria ↔ Centro may require Metro/bus multimodal edges  
5. **Backlog 73 nodes** — no pedestrian edges yet  
6. **Access-point routing** — STGO_32 hill-top vs funicular-base transitions may need explicit multimodal or staged walking models  
7. **Friction enrichment** — step-free, surface, incline, pleasantness remain null until field or dataset-backed
