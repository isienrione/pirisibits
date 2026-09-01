# Gate 1B.4.1 — Official 2026 DTPM GTFS Transit Correction Report

**Gate:** 1B.4.1 (corrective sub-gate)  
**Starting checkpoint:** `45dfc646ca0f33d28d89d5565631578f9ff92df4`  
**Physical route generation:** **DISABLED**  
**Multimodal physical graph ready:** **TRUE** (corrected substrate)

---

## Official GTFS source

| Field | Value |
|---|---|
| Source URL | `https://www.dtpm.cl/descargas/gtfs/GTFS_20260704.zip` |
| Publisher page | https://www.dtpm.cl/index.php/noticias/gtfs-vigente |
| Feed version | `V166.20260704` |
| Effective | 2026-07-04 → 2026-12-31 |
| Metro agency | `M` — Metro de Santiago |
| Retrieved | 2026-08-27T06:26:05Z |

---

## Operational-line filter

**Runtime operational:** L1, L2, L3, L4, L4A, L5, L6  

**Excluded:** L7 — `FUTURE_NON_OPERATIONAL`  
- Not present as an operational route in official DTPM GTFS V166.20260704  
- Gate 1B.4 OSM import previously included an unresolved L7 relation  
- Preserved only in `src/data/santiago/qa/santiago_metro_future_non_operational.v0.1.json`  
- Validator fails if L7 appears in runtime graph

---

## Station inventory

| Metric | Count |
|---|---|
| Raw GTFS parent stations used by Metro trips | 126 |
| Normalized operational stations | 126 |
| OSM stations (v0.1 supplemental) | 126 |
| Matched OSM↔GTFS | 126 |
| GTFS-only | 0 |
| OSM-only | 0 |
| Ambiguous | 0 |

Canonical runtime identity: `METRO_GTFS_<gtfsStopId>` from `location_type=1` parent stations.  
OSM role: supplemental QA/reference only.

---

## Topology & scheduled times

| Metric | Value |
|---|---|
| Operational lines topology-verified | 7/7 |
| Metro ride edges | 272 |
| Scheduled segment records | 368 |
| Ride edges with scheduled timing | 100% |
| Duration label | `SCHEDULED_GTFS_DURATION` |
| Runtime representative | median scheduled stop_time delta |
| Transfer physical duration | null (engine-policy penalty only) |
| Transfer edges | 34 |

Heuristic hop fallback is **not** used for operational rides when GTFS scheduled evidence exists.

---

## POI ↔ Metro access

| Metric | Value |
|---|---|
| Retained (reconciled to GTFS) | 108 |
| Unresolved / REVIEW_REQUIRED | 0 |

Mapbox walking distances/durations preserved; station IDs remapped OSM → GTFS.

---

## QA routes (corrected)

| Route | Selected | Walk phys (s) | Scheduled Metro (s) | Known total phys (s) | Wait/policy (s) | Gen. cost | Lines |
|---|---|---|---|---|---|---|---|
| Plaza de Armas → Lastarria | Walk | 1017 | 0 | 1017 | ~50 | 1067 | — |
| La Moneda → Londres 38 | Walk | 538 | 0 | 538 | ~9 | 547 | — |
| Lastarria → La Chascona | Walk | 711 | 0 | 711 | ~6 | 717 | — |
| La Vega → GAM | Walk | 1392 | 0 | 1392 | ~41 | 1433 | — |
| Yungay → Museo de la Memoria | Walk | 481 | 0 | 481 | ~0 | 481 | — |
| Centro → Museo de la Memoria | Multimodal | 283 | 303 | 586 | ~480 | 1066 | L5 |
| Centro → Yungay | Multimodal | 713 | 193 | 906 | ~480 | 1386 | L5 |
| Centro → Plaza Ñuñoa | Multimodal | 652 | 76 | 728 | ~480 | 1208 | L5 |

With scheduled GTFS ride times + explicit wait/entry policy, short Centro hops correctly prefer walking; longer cross-island hops still prefer multimodal. Known physical totals exclude heuristic wait/transfer penalties. Transfer physical walk remains unresolved when transfers occur (none in current winners).

---

## Unchanged launch states

| STGO | Status |
|---|---|
| STGO_32 | Funicular staging preserved; ascent unresolved |
| STGO_05 | PARTIAL — excluded |
| STGO_23 | UNRESOLVED_RESEARCH — excluded |
| STGO_33 | NEEDS_SEMANTIC_REVIEW — excluded |

103-node inventory intact. Backlog 73 untouched. Gate 1B.3 provider edges preserved (598).

---

## Artifacts

| Path | Role |
|---|---|
| `transit/santiago_metro_stations.v0.2.json` | Canonical GTFS stations |
| `transit/santiago_metro_lines.v0.2.json` | Operational lines |
| `transit/santiago_metro_scheduled_times.v0.1.json` | Scheduled segment stats |
| `transit/santiago_gtfs_feed_provenance.v0.1.json` | Feed provenance |
| `santiago_multimodal_graph.v0.2.json` | Corrected multimodal graph |
| `qa/santiago_metro_future_non_operational.v0.1.json` | L7 planning-only |
| `qa/santiago_metro_osm_gtfs_reconciliation.v0.1.json` | OSM↔GTFS QA |
| v0.1 transit/multimodal files | Preserved for audit |

---

## Remaining blockers for Gate 1B.5

1. Realtime Metro durations still unavailable  
2. Physical interchange walk times unresolved  
3. STGO_05 / 23 / 33 still blocked  
4. STGO_32 funicular ascent unresolved  
5. Traveler route generation must remain disabled until product composition gate  

**Not pushed. Gate 1B.5 not started.**
