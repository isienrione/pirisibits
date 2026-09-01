# Gate 1B.4 — Santiago Multimodal Physical Graph Report

**Gate:** 1B.4  
**City:** Santiago  
**Starting checkpoint:** `58b8b3c55d75b020d2c860804bffcd057ee24429`  
**Physical route generation (traveler-facing):** **DISABLED**  
**Multimodal physical graph ready:** **TRUE** (substrate only — does not enable traveler routing)

---

## Contract recovery

| Contract | Result |
|---|---|
| `docs/engine/ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md` | **CONTRACT_NOT_RECOVERABLE** (not in tree or git history) |
| `docs/engine/PHYSICAL_GRAPH_V0.1_CONTRACT.md` | **CONTRACT_NOT_RECOVERABLE** (not in tree or git history) |

Implementation follows existing `src/lib/city-graph/types.ts`, Gate 1B.2A/1B.3 reports, and validators.

---

## Gate 1B.3 provider truth preserved

| Artifact | Status |
|---|---|
| `santiago_physical_edges.v0.1.json` | Unchanged — 598 runtime WALK edges |
| Candidate QA file | Unchanged |

Dense provider evidence remains the source of truth for walking distance/duration.

---

## Sparse operational pedestrian adjacency

| Metric | Value |
|---|---|
| Dense provider runtime WALK edges | 598 |
| Sparse operational WALK edges | 393 |
| Reduction | 34.3% |
| Median out-degree | 15 |
| Maximum out-degree | 21 |
| Connected components (undirected) | 1 |
| Directed strongly connected | Yes |
| Isolated eligible nodes | 0 |

Every sparse edge traces to a Gate 1B.3 Mapbox provider edge. No invented walk costs.

Sparsification constants live in `physical-edge-constants.ts` (`SPARSE_ALWAYS_KEEP_MAX_MIN`, `SPARSE_NEAREST_NEIGHBORS`, `SPARSE_REDUNDANT_DIRECT_MIN`, `SPARSE_MAX_OPERATIONAL_MIN`) with reverse-edge + directed-reachability bridge repair.

---

## Metro reference layer

| Field | Value |
|---|---|
| Source | OpenStreetMap Overpass — `network=Metro de Santiago` subway routes + `railway=station` `station=subway` nodes (ODbL) |
| Stations imported | 126 |
| Lines imported | 8 (L1–L7, L4A) |
| Topology verified | 7 lines (L7 station mapping unresolved in OSM stop membership for selected relation) |
| Interchange stations | 16 |
| Accessibility | **UNKNOWN** for all stations (no invented step-free claims) |
| Observed segment times | **0** — all `observedDurationSeconds = null` |
| Observed transfer times | **0** — engine-policy penalty only |

### Topology vs timing

- `NETWORK_TOPOLOGY_VERIFIED` for consecutive station membership on verified lines  
- `SEGMENT_TIME_UNRESOLVED` everywhere — hop cost uses **ENGINE_POLICY_METRO_HOP_FALLBACK_S** (not labeled as observed time)

---

## POI ↔ Metro access

| Metric | Value |
|---|---|
| Runtime `POI_METRO_ACCESS` edges | 108 (bidirectional Mapbox walks) |
| Provider | Mapbox walking directions |
| Policy | ≤1.2 km candidate prune; ≤15 min useful; max 2 stations/POI |
| Forced connectors | None — not every POI gets Metro access |

---

## Multimodal primitives

| Edge type | Count |
|---|---|
| Sparse WALK | 393 |
| POI_METRO_ACCESS | 108 |
| METRO_RIDE | 270 |
| METRO_TRANSFER | 32 |
| RIDESHARE / macro | 0 (not required for current Launch corpus) |

Generalized cost = observed walk/access durations + **explicit engine-policy frictions** (entry, transfer, mode-change, long-walk discomfort, unresolved hop fallback). Heuristics are never written into `observedDurationSeconds`.

---

## STGO_32 San Cristóbal staging

Routing endpoint remains **funicular** base. Preserved separately:

- hill concept POI  
- funicular base (active endpoint)  
- Acceso Carlos Reed  
- Teleférico Pedro de Valdivia  
- ascent transport — **UNRESOLVED / inactive**  
- upper experience — **UNRESOLVED** (base ≠ summit)

---

## Unresolved launch nodes (unchanged)

| STGO | Treatment |
|---|---|
| STGO_05 | PARTIAL — excluded; curation unchanged |
| STGO_23 | UNRESOLVED_RESEARCH — excluded; 0 edges |
| STGO_33 | NEEDS_SEMANTIC_REVIEW — excluded; 0 edges |

---

## Inventory policy

| Scope | Count | Treatment |
|---|---|---|
| Canonical inventory | 103 | Intact |
| Launch | 30 | Active multimodal scope (27 edge-eligible) |
| Backlog | 73 | Preserved; no fabricated transit enrichment |

---

## QA multimodal routes

| Route | Selected | Modes | Generalized cost | Observed physical duration | Walk-only alt |
|---|---|---|---|---|---|
| Plaza de Armas → Lastarria | Multimodal (L5) | access + metro | 940 s | UNRESOLVED (policy hops) | 1006 s |
| La Moneda → Londres 38 | Walk | WALK | 547 s | 538 s | 538 s |
| Lastarria → La Chascona | Walk | WALK | 717 s | 711 s | 690 s |
| La Vega → GAM | Walk | WALK | 1433 s | 1392 s | 1392 s |
| Yungay → Museo de la Memoria | Walk | WALK | 481 s | 481 s | 481 s |
| Centro → Museo de la Memoria | Multimodal (L5) | access + metro | 943 s | UNRESOLVED | 1963 s |
| Centro → Yungay | Multimodal (L5) | access + metro | 1253 s | UNRESOLVED | 1483 s |
| Centro → Plaza Ñuñoa | Multimodal (L5) | access + metro | 1072 s | UNRESOLVED | 1215 s |

Metro “wins” only on generalized cost under engine-policy hop fallbacks; total **observed** duration remains unresolved whenever Metro rides/transfers participate. This is intentional uncertainty, not fabricated timing.

---

## Reference matrices

**REFERENCE_MATRIX_NOT_PRESENT** — Master Inter-Island / 15-Hub / Thematic matrices not in repository. Thematic/narrative matrix **not used**.

---

## Validators & tests

| Check | Result |
|---|---|
| Gate 1B.4 validator | PASS |
| Gate 1B.3 validator | PASS |
| Synthetic-pattern validator | PASS |
| Python Gate 1B.4 tests | PASS |
| Vitest | PASS (26 tests) |
| TypeScript | PASS |
| Secret scan | PASS |
| `PHYSICAL_ROUTE_GENERATION_ENABLED` | `false` |
| `MULTIMODAL_PHYSICAL_GRAPH_READY` | `true` |

---

## Artifacts

| Path | Role |
|---|---|
| `src/data/santiago/santiago_pedestrian_adjacency.v0.1.json` | Sparse operational WALK |
| `src/data/santiago/transit/santiago_metro_stations.v0.1.json` | Metro stations |
| `src/data/santiago/transit/santiago_metro_lines.v0.1.json` | Metro lines |
| `src/data/santiago/santiago_multimodal_graph.v0.1.json` | Access/rides/transfers/QA |
| `docs/city-graph/gate-1b4-multimodal-review.html` | Curator HTML |
| `scripts/physical-graph/build_santiago_multimodal_graph.py` | Builder |

---

## Remaining blockers before Gate 1B.5 / physical-layer closure

1. Recover or author missing engine contracts if required for later gates  
2. Resolve STGO_05 / STGO_23 / STGO_33 for full Launch coverage  
3. Obtain trustworthy Metro segment + transfer observed times (GTFS / official Metro)  
4. Resolve L7 OSM topology mapping  
5. Funicular ascent provider segment for STGO_32  
6. Station accessibility evidence  
7. Keep traveler route generation disabled until product composition gate

**Not pushed. Gate 1B.5 not started.**
