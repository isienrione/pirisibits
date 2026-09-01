# Gate 1B.2A — Santiago Launch Human Physical Curation Report

**Gate:** 1B.2A  
**City:** Santiago  
**Canonical inventory:** `src/data/santiago/santiago_engine_nodes.v0.1.json`  
**Primary keys:** `STGO_01` … `STGO_103` (unchanged)  
**Launch corpus:** 30 founder-reviewed STGO IDs (not sequential STGO_01–30)  
**Human curation source:** `src/data/santiago/curation/CHRONOWALK_LAUNCH30_CURATOR_FEEDBACK_CLEANED.md`  
**Physical route generation:** **DISABLED**  
**Auto curator-approve from Mapbox:** **DISABLED**

---

## Summary

Founder Google Maps / Street View review for all 30 launch nodes was ingested as **`CURATOR_APPROVED`** human evidence. This is **not** `FIELD_VERIFIED`. Backlog nodes (73) were not touched. Provider audit history is preserved on every launch node.

| Metric | Count |
|---|---|
| Launch nodes ingested | 30/30 |
| Backlog untouched | 73 |
| Curator-approved POI | 24 |
| Curator-approved experience points | 29 |
| Access points preserved | 3 (STGO_32) |
| Ready for edge generation | 27 |
| Partial review required | 1 (STGO_05) |
| Blocked / unresolved | 2 (STGO_23, STGO_33) |
| Provider overrides (>25 m) | 24 |
| Backlog `CURATOR_APPROVED` | 0 |
| `FIELD_VERIFIED` | 0 |

---

## Launch 30 STGO IDs (founder corpus)

`STGO_01`, `STGO_02`, `STGO_03`, `STGO_04`, `STGO_05`, `STGO_06`, `STGO_07`, `STGO_10`, `STGO_11`, `STGO_16`, `STGO_18`, `STGO_19`, `STGO_20`, `STGO_21`, `STGO_22`, `STGO_23`, `STGO_24`, `STGO_25`, `STGO_26`, `STGO_27`, `STGO_28`, `STGO_29`, `STGO_32`, `STGO_33`, `STGO_34`, `STGO_35`, `STGO_48`, `STGO_91`, `STGO_92`, `STGO_30`

Founder place names are applied to `displayName` / `canonicalName` by STGO ID. Legacy slugs remain compatibility identifiers only.

---

## Special nodes

| STGO | Readiness | Notes |
|---|---|---|
| **STGO_05** | `PARTIAL_REVIEW_REQUIRED` | Cerro POI from linked Google place; Terraza Neptuno + Castillo Hidalgo as separate physical points; coordinate conflict flagged (~2.4 km between founder @ and place pin) |
| **STGO_23** | `UNRESOLVED_RESEARCH_REQUIRED` | Founder cannot identify POI concept (Inca Tambo Canal Dip); no curator coordinates; edge-ineligible |
| **STGO_32** | `READY_FOR_EDGE_GENERATION` | Hill POI + 3 access points: funicular, acceso_carlos_reed, teleferico_pedro_de_valdivia |
| **STGO_33** | `NEEDS_SEMANTIC_REVIEW` | Experience candidate only (Hotel Luciano K note); no approved POI; semantic warning on Kulczewski Funicular Gargoyle mismatch |

---

## Physical layer distinctions (post-ingest)

| Field | Launch 30 | Backlog 73 |
|---|---|---|
| POI coordinate | 24 curator-approved; experience-only rows keep POI null | Provider-derived only |
| Entrance coordinate | All null | All null |
| Experience-point coordinate | 29 curator-approved | All null |
| Metro / nearest transit | UNRESOLVED | UNRESOLVED |
| `CURATOR_APPROVED` | 27 launch nodes (excludes STGO_23, STGO_33) | 0 |
| `FIELD_VERIFIED` | 0 | 0 |

POI and experience coordinates are kept distinct where both exist (e.g. STGO_01: Google place pin vs founder Street View; STGO_11: Barrio Yungay centroid vs Plaza Roto pin).

Experience-only launch nodes (POI null, experience set): `STGO_02`, `STGO_03`, `STGO_04`, `STGO_16`, plus blocked `STGO_33`.

---

## Artifacts

| Artifact | Path |
|---|---|
| Founder source (cleaned) | `src/data/santiago/curation/CHRONOWALK_LAUNCH30_CURATOR_FEEDBACK_CLEANED.md` |
| Raw ingest | `src/data/santiago/curation/launch30_physical_review.raw.v0.1.json` |
| Normalized ingest | `src/data/santiago/curation/launch30_physical_review.normalized.v0.1.json` |
| Engine nodes (103) | `src/data/santiago/santiago_engine_nodes.v0.1.json` |
| Launch corpus | `src/data/santiago/santiago_launch_corpus.v0.1.json` |
| Curator HTML | `docs/city-graph/gate-1b2a-curator-review.html` |
| Ingest script | `scripts/physical-graph/ingest_launch30_curation.py` |

---

## Validators & tests

| Check | Result |
|---|---|
| Gate 1B.2A validator | PASS (`validate_gate_1b2a.py`) |
| Gate 1B.2 validator (backlog discipline) | PASS (`validate_gate_1b2.py`) |
| Synthetic-pattern validator | PASS (`validate_synthetic_patterns.py`) |
| Python Gate 1B.2A tests | PASS (`test_gate_1b2a.py`) |
| Python Gate 1B.2 tests | PASS (`test_gate_1b2.py`) |
| Vitest | PASS (`gate1b2a.humanCuration.test.ts`, `gate1b2.engineNodes.test.ts`, `gate1b1.physicalGraph.test.ts`) |
| TypeScript `tsc --noEmit` | PASS |
| Secret scan | PASS — no Mapbox token material in tracked artifacts |
| Physical route generation flag | `false` |

---

## Explicit non-goals (unchanged)

- Physical edge generation **not** started  
- Metro enrichment **not** started  
- Route generation **not** enabled  
- No automatic promotion of Mapbox candidates to `CURATOR_APPROVED`  
- No push to remote (local commit only)
