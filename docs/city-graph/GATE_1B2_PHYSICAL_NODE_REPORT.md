# Gate 1B.2 — Santiago Canonical Physical Node Report

**Gate:** 1B.2  
**City:** Santiago  
**Canonical inventory:** `src/data/santiago/santiago_engine_nodes.v0.1.json`  
**Primary keys:** `STGO_01` … `STGO_103`  
**Launch corpus:** priority subset of 30 (not a separate universe)  
**Physical route generation:** **DISABLED**  
**Auto curator-approve from Mapbox:** **DISABLED**

---

## FULL 103

| Metric | Count |
|---|---|
| Canonical identities resolved | 101 |
| Identity unresolved | 2 |
| Provider `AUTO_HIGH_CONFIDENCE` | 7 |
| Provider `NEEDS_CURATOR_REVIEW` | 55 |
| Provider `SUSPICIOUS` | 39 |
| Provider `NO_RESULT` | 2 |
| `CURATOR_APPROVED` | 0 |
| Entrance coordinates resolved | 0 |
| Experience-point coordinates resolved | 0 |

### Identity-unresolved STGO IDs

| STGO ID | Legacy slug | Reason |
|---|---|---|
| STGO_51 | `casa-museo-la-sebastiana` | Valparaíso-ref; no trustworthy Santiago POI source in repo |
| STGO_82 | `mercado-cardonal` | Valparaíso-ref; no trustworthy Santiago POI source in repo |

IDs are preserved. Names/coordinates were **not** invented.

---

## LAUNCH 30

Canonical mappings (locked launch slugs → STGO):

| STGO | Legacy slug | Classification |
|---|---|---|
| STGO_01 | la-moneda | NEEDS_CURATOR_REVIEW |
| STGO_02 | morande-80 | NEEDS_CURATOR_REVIEW |
| STGO_03 | londres-38 | NEEDS_CURATOR_REVIEW |
| STGO_04 | plaza-de-armas | NEEDS_CURATOR_REVIEW |
| STGO_05 | pasaje-phillips | SUSPICIOUS |
| STGO_06 | catedral | NEEDS_CURATOR_REVIEW |
| STGO_07 | merced | SUSPICIOUS |
| STGO_08 | santa-lucia | NEEDS_CURATOR_REVIEW |
| STGO_09 | lastarria | NEEDS_CURATOR_REVIEW |
| STGO_10 | parque-forestal | NEEDS_CURATOR_REVIEW |
| STGO_11 | gam | NEEDS_CURATOR_REVIEW |
| STGO_12 | bellavista | SUSPICIOUS |
| STGO_13 | la-chascona | SUSPICIOUS |
| STGO_14 | san-cristobal | NEEDS_CURATOR_REVIEW |
| STGO_15 | mercado-central | NEEDS_CURATOR_REVIEW |
| STGO_16 | museo-memoria | NEEDS_CURATOR_REVIEW |
| STGO_17 | yungay | NEEDS_CURATOR_REVIEW |
| STGO_18 | barrio-brasil | NEEDS_CURATOR_REVIEW |
| STGO_19 | barrio-italia | NEEDS_CURATOR_REVIEW |
| STGO_20 | san-francisco | NEEDS_CURATOR_REVIEW |
| STGO_21 | palacio-pereira | SUSPICIOUS |
| STGO_22 | ex-congreso | NEEDS_CURATOR_REVIEW |
| STGO_23 | plaza-constitucion | NEEDS_CURATOR_REVIEW |
| STGO_24 | museo-bellas-artes | SUSPICIOUS |
| STGO_25 | estacion-mapocho | NEEDS_CURATOR_REVIEW |
| STGO_26 | cementerio-general | NEEDS_CURATOR_REVIEW |
| STGO_27 | plaza-nunoa | AUTO_HIGH_CONFIDENCE |
| STGO_28 | villa-grimaldi | SUSPICIOUS |
| STGO_29 | teatro-municipal | SUSPICIOUS |
| STGO_30 | casa-de-los-diez | SUSPICIOUS |

| Metric | Count |
|---|---|
| Canonical mappings | 30/30 |
| `AUTO_HIGH_CONFIDENCE` | 1 |
| `NEEDS_CURATOR_REVIEW` | 18 |
| `SUSPICIOUS` | 11 |
| `NO_RESULT` | 0 |
| `CURATOR_APPROVED` | 0 |
| Unresolved physical (no promoted POI pin) | 11 (suspicious) + review backlog |

---

## BACKLOG 73

| Metric | Count |
|---|---|
| Confirmed backlog nodes | 73 |
| `AUTO_HIGH_CONFIDENCE` | 6 |
| `NEEDS_CURATOR_REVIEW` | 37 |
| `SUSPICIOUS` | 28 |
| `NO_RESULT` | 2 (identity-unresolved skipped) |

Backlog may remain provider-derived / unresolved without blocking launch Gate 1B curation.

---

## Legacy content mapping

| Status | Count | Notes |
|---|---|---|
| **resolved** | 21 | Product `src/data/pois.ts` IDs map to STGO via legacySlug |
| **proposed** | 80 | Identity known; no product content object yet |
| **unresolved** | 2 | Valparaíso-ref identities (STGO_51, STGO_82) |

Previously called-out launch slugs now **resolved** against STGO (evidence: `pois.ts`):

`pasaje-phillips`, `merced`, `parque-forestal`, `bellavista`, `san-cristobal`, `mercado-central`, `barrio-brasil`, `barrio-italia`, `san-francisco`

Launch identities without product POI objects remain **proposed** (not guessed):

`ex-congreso`, `plaza-constitucion`, `museo-bellas-artes`, `estacion-mapocho`, `cementerio-general`, `plaza-nunoa`, `villa-grimaldi`, `teatro-municipal`, `casa-de-los-diez`

Legacy slugs are **compatibility identifiers only**. Canonical primary keys are `STGO_XX`.

---

## Physical layer distinctions

| Field | Status |
|---|---|
| POI coordinate | Provider candidate only when classification promotes; else null |
| Entrance coordinate | **All null** — not inferred from POI |
| Experience-point coordinate | **All null** — not inferred from POI / entrance |
| Metro / nearest transit | **UNRESOLVED** — no trustworthy transit dataset integrated; no arithmetic estimates |
| Geographic island | null |
| `CURATOR_APPROVED` | **0** — never automatic from Mapbox |

---

## Validators & tests

| Check | Result |
|---|---|
| Synthetic-pattern validator | PASS (run `validate_synthetic_patterns.py`) |
| Physical-data / Gate 1B.2 validator | PASS (run `validate_physical_data.py` → `validate_gate_1b2.py`) |
| Python Gate 1B.2 tests | PASS (`test_gate_1b2.py`) |
| Vitest | PASS (`gate1b2.engineNodes.test.ts` + prior 1B.1 suite) |
| TypeScript `tsc --noEmit` | PASS |
| Secret scan (engine JSON / reports) | PASS — no Mapbox token material in tracked artifacts |
| Physical route generation flag | `false` |

---

## Curator tool

`docs/city-graph/gate-1b2-curator-review.html`

- All 103 nodes
- Filters: ALL 103 / LAUNCH 30 / BACKLOG 73 / NEEDS REVIEW / SUSPICIOUS / NO RESULT / HIGH CONFIDENCE / APPROVED
- Default: **LAUNCH 30 needing attention**
- Map embed + Google Maps link
- Provider pin vs approved pin (none yet)
- Actions: APPROVE POI PIN / WRONG PLACE / SEARCH AGAIN / MANUAL PIN REQUIRED / DEFER / REJECT
- Manual lat/lng secondary only
- Local action log only — does **not** write `CURATOR_APPROVED` into engine JSON

---

## Architecture reminder

```
SANTIAGO CITY GRAPH (103)
        |
        +-- LAUNCH 30  (physical verification priority NOW)
        |
        +-- BACKLOG 73 (canonical + provider enrichment NOW)
```

Provider-derived ≠ curator-approved. Edges / route generation are **out of scope** for Gate 1B.2.

---

## Remaining blockers before physical edges

1. Human curator resolution of launch-30 POI pins (especially SUSPICIOUS / NEEDS_CURATOR_REVIEW).
2. Decide Santiago treatment for STGO_51 / STGO_82 (replace with real Santiago sources or keep permanently out-of-graph).
3. Curator-approved entrance coordinates where POI centroid ≠ entry.
4. ChronoWalk experience-point coordinates (never auto-copied from POI).
5. Integrate a trustworthy Metro/transit reference dataset (no arithmetic estimates).
6. Only then enable physical edge / route generation behind `PHYSICAL_ROUTE_GENERATION_ENABLED`.
