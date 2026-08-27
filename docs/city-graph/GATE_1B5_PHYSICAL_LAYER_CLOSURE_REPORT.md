# Gate 1B.5 — Santiago Physical Graph V0.1 Freeze Report

**Gate:** 1B.5  
**City:** Santiago  
**Starting checkpoint:** `72ca9c7815d66ddad1ca5702a622d3592ccd3084` (Gate 1B.4.1)  
**Physical route generation (traveler-facing):** **DISABLED**  
**Multimodal physical graph ready:** **TRUE**  
**Physical layer V0.1 ready:** **TRUE** (freeze only — does not enable traveler routing)

---

## Disposition decisions

| STGO | Disposition | Runtime endpoint | Notes |
|---|---|---|---|
| STGO_05 | **RUNTIME_READY** | Terraza Neptuno (`-33.4418503,-70.6473047`) | Complex POI remains Cerro Santa Lucía; Castillo Hidalgo preserved; hill `@` conflict retained as non-runtime QA evidence |
| STGO_23 | **RUNTIME_EXCLUDED_RESEARCH** | — | Founder cannot identify “Inca Tambo Canal Dip”; no authoritative repo evidence |
| STGO_33 | **RUNTIME_EXCLUDED_SEMANTIC** | — | Hotel Luciano K vs “Kulczewski Funicular Gargoyle”; STGO_27 already covers Casa-Taller Kulczewski |
| STGO_32 | **RUNTIME_STAGED** | Funicular base | Summit not implied; ascent transport unresolved/inactive |

---

## Launch runtime membership

| Bucket | Count | IDs |
|---|---|---|
| RUNTIME_READY | 27 | includes promoted STGO_05 |
| RUNTIME_STAGED | 1 | STGO_32 |
| RUNTIME_EXCLUDED | 2 | STGO_23, STGO_33 |
| Routing-capable | 28 | 27 ready + 1 staged |

Canonical inventory remains **103** (launch **30** + backlog **73** untouched).

---

## Provider truth preserved

| Artifact | Status |
|---|---|
| `santiago_physical_edges.v0.1.json` | Unchanged — **598** runtime WALK edges (Gate 1B.3) |
| `santiago_physical_edges_stgo05_extension.v0.1.json` | New — **24** Mapbox WALK edges for Terraza Neptuno endpoint |
| `santiago_pedestrian_adjacency.v0.1.json` | Preserved (Gate 1B.4) |
| Transit stations/lines/times v0.2 / scheduled v0.1 | Preserved (Gate 1B.4.1 DTPM GTFS) |
| `santiago_multimodal_graph.v0.2.json` | Preserved (Gate 1B.4.1) |

---

## Sparse operational adjacency v0.2

| Metric | Value |
|---|---|
| Dense combined runtime WALK edges | 622 (598 + 24) |
| Sparse operational WALK edges | 417 |
| Reduction | 33.0% |
| Eligible / routing nodes | 28 |
| Connected components | 1 |
| Directed strongly connected | Yes |
| Isolated nodes | 0 |
| Median out-degree | 15 |
| Max out-degree | 22 |

Every sparse edge traces to a Gate 1B.3 provider edge or the Gate 1B.5 STGO_05 extension. No invented walk costs.

---

## Multimodal graph v0.3

| Edge type | Count |
|---|---|
| Sparse WALK | 417 |
| POI_METRO_ACCESS | 112 (includes STGO_05 Terraza Neptuno access) |
| METRO_RIDE | 272 (DTPM GTFS scheduled) |
| METRO_TRANSFER | 34 (engine-policy penalty; physical transfer walk unresolved) |
| RIDESHARE / macro | 0 |

Canonical transit source remains **`dtpm_gtfs`**. L7 remains non-operational / absent from runtime. Thematic/narrative scoring **not used**.

### PhysicalCost contract (frozen)

Components kept distinct:

- provider walk distance/duration  
- scheduled GTFS Metro ride duration  
- mode changes  
- engine-policy entry / transfer / wait / long-walk discomfort  
- unknown physical friction  

Engine-policy values are **never** written as observed times. Soft friction and POI hard accessibility remain explicitly **UNKNOWN**.

---

## Friction audit

| Field class | Status |
|---|---|
| Soft friction (surface, crossing, incline, crowd, pleasantness, daylight, comfort) | **UNKNOWN** for all runtime nodes |
| Hard accessibility at POI level | **UNKNOWN** (never inferred) |
| Metro station accessibility | GTFS `wheelchair_boarding` provenance retained; not collapsed into POI claims |

---

## E2E QA routes

| Route | Selection | Walk phys (s) | Sched Metro (s) | Known phys (s) | Wait+policy (s) | Gen. cost | Lines |
|---|---|---|---|---|---|---|---|
| Plaza de Armas → Catedral | Walk | 210 | 0 | 210 | 0 | 210 | — |
| La Moneda → Londres 38 | Walk | 538 | 0 | 538 | ~9 | 547 | — |
| Lastarria → GAM | Walk | 316 | 0 | 316 | 0 | 316 | — |
| La Chascona → San Cristóbal funicular | Walk | 118 | 0 | 118 | 0 | 118 | — |
| La Vega → Tirso de Molina | Walk | 197 | 0 | 197 | 0 | 197 | — |
| Plaza de Armas → Lastarria | Walk | 1017 | 0 | 1017 | ~50 | 1067 | — |
| Centro → Museo de la Memoria | Multimodal | 283 | 303 | 586 | 480 | 1066 | L5 |
| Centro → Yungay | Multimodal | 713 | 193 | 906 | 480 | 1386 | L5 |
| Centro → Taller Castillo Kulczewski | Multimodal | 652 | 76 | 728 | 480 | 1208 | L5 |
| Centro → Cerro Santa Lucía (Terraza Neptuno) | Walk | 822 | 0 | 822 | 0 | 822 | — |
| Lastarria → Museo de la Memoria | Multimodal | 411 | 387 | 798 | 480 | 1278 | L5 |

Excluded nodes are never encountered on runtime QA paths. STGO_32 arrivals are funicular-base only.

---

## Feature flags

| Flag | Value |
|---|---|
| `PHYSICAL_ROUTE_GENERATION_ENABLED` | `false` |
| `MULTIMODAL_PHYSICAL_GRAPH_READY` | `true` |
| `PHYSICAL_LAYER_V0_1_READY` | `true` |

---

## Artifacts

| Path | Role |
|---|---|
| `santiago_engine_nodes.v0.1.json` | Dispositions + runtime endpoints |
| `santiago_launch_runtime_membership.v0.1.json` | Launch membership freeze |
| `santiago_physical_edges_stgo05_extension.v0.1.json` | STGO_05 Mapbox extension |
| `santiago_pedestrian_adjacency.v0.2.json` | Sparse walk graph |
| `santiago_multimodal_graph.v0.3.json` | Frozen multimodal graph |
| `qa/santiago_physical_friction_audit.v0.1.json` | Friction honesty audit |
| `qa/santiago_physical_layer_e2e_qa.v0.1.json` | E2E QA routes |
| `santiago_physical_graph_manifest.v0.1.json` | Physical graph manifest |
| `docs/city-graph/GATE_1B5_PHYSICAL_LAYER_CLOSURE_REPORT.md` | This report |
| `docs/city-graph/gate-1b5-physical-layer-review.html` | Curator review HTML |

---

## Known limitations (non-blocking for V0.1 freeze)

1. Realtime Metro durations unavailable  
2. Physical interchange walk durations unresolved (engine-policy penalty only)  
3. POI soft-friction fields UNKNOWN  
4. POI hard accessibility UNKNOWN  
5. STGO_32 funicular ascent inactive  
6. STGO_23 / STGO_33 excluded from launch runtime  
7. Backlog 73 nodes not physically edge-enriched  
8. Future L7 not operational  
9. Traveler route generation remains disabled pending product composition gate  

**Not pushed.**
