# Gate 2A.1 — Editorial Calibration + Canonical Semantic Restoration

**Gate:** 2A.1  
**Status:** AI_PROPOSED_UNVERIFIED (founder review pending)  
**Starting checkpoint:** `c365075fffa68d40ff9b6f998133823ddf10c734`  
**Physical freeze:** unchanged since `a747c1112ccd96424af0de2126fc1ef27316fb8e`

---

## Mission outcome

Gate 2A passed technically but lacked continuous thematic semantics, ChronoWorth, visit times, and inspectable M1–M5 suitability. Gate 2A.1 restores a **Node Semantic Layer** for the launch 30 and recomputes NodeUtility against continuous T1A–T9 (including **T2 Culinary**).

Route composition, NarrativeEdgeScore, and physical traveler routing remain **disabled / absent**.

---

## Source audit — where continuous values lived

| Source field | Location | Fate under Gate 2A |
|---|---|---|
| Continuous `thematicVector` (demo encoding) | `src/data/pois.ts` (~21 POIs) | **Ignored** by Gate 2A engine JSON; old `T1`≈civic, old `T2`≈memory (**not** culinary) |
| Binary `ThemeCode` tags | `santiago_engine_nodes.v0.1.json` via `KIND_THEMES` | Used as sole interest signal |
| `anchor_density` / `heritage_depth` / `micro_reveal` / `polish` | **NOT FOUND** in tree or recoverable history | Proxied from role/tier/vector for ChronoWorth proposals |
| `exclude_for_m5` / `curbside_hub` | **NOT FOUND** | Not fabricated |
| `daylight_only` / `step_free` / `is_sensitive_memory` | Partial in demo `pois.ts` | **Lost** on engine nodes; restored for name-matched POIs + explicit sensitive list |
| `chronoWorth` | Engine field present | All `null` at Gate 2A |
| `editorialRole` / legacy `tier` | Engine nodes | Preserved; tier also normalized to `canonical_anchor` / `thematic_pocket` / `micro_reveal` |

**Matching rule:** display-name → demo POI id (15/30). Do **not** trust `legacySlug` alone after Gate 1B.2A name reassignment.

Audit artifact: `docs/engine/gate-2a1-source-audit.json`

---

## Canonical semantic representation

Named continuous object (not positional):

`T1A, T1B, T2, T3, T4, T5, T6, T7, T8, T9` ∈ `[0.0, 1.0]`

- **Canonical:** `thematicVector`  
- **Derived:** `derivedThemeTags` where value ≥ **0.45**  
- Binary tags must not replace the vector for NodeUtility

### ChronoWorth proposal formula

```
ChronoWorthProposal = 100 * (
  0.35 * heritage_depth_proxy
+ 0.30 * anchor_density_proxy
+ 0.20 * micro_reveal_proxy
+ 0.15 * polish_proxy
)
```

Proxies (inventory metrics absent):

- **heritage** = max(T1A, T1B, T9×0.6)  
- **anchor** = role/tier iconic weight  
- **micro** = tier reveal weight  
- **polish** = max(T3, T5, T9, T2×0.5)  

**Forbidden inputs:** physical centrality, edge degree, Metro proximity, Google/Mapbox popularity, traveler interests.

Provenance: `AI_PROPOSED_UNVERIFIED`. Approved remains `null` until founder export is ingested.

### YourMatch vs NodeUtility

| Term | Definition |
|---|---|
| **YourMatch** | Traveler-specific fit = interests + structural + discovery (0–100 domain via component caps) |
| **NodeUtility** | Editorial (ChronoWorth/role) + YourMatch constituents + context |
| **ChronoWorth** | Global editorial value; traveler-independent; approved supersedes proposed |

---

## Launch coverage BEFORE → AFTER

Coverage is for the **30 launch nodes**. Distinctions: `CANONICAL_CURATED` (engine/demo evidence), `AI_PROPOSED`, `UNKNOWN`.

| Field | BEFORE (Gate 2A engine) | AFTER (2A.1 proposed layer) |
|---|---|---|
| Continuous T1A–T9 vectors | **0/30** | **30/30** (15 remapped demo + 15 binary→0.7 expansion) |
| T2 Culinary present in taxonomy | **0/30** (absent) | **30/30** key present; **5/30** strong (≥0.7) |
| ChronoWorth proposed | **0/30** | **30/30 AI_PROPOSED** |
| ChronoWorth curator-approved | **0/30** | **0/30** (intentional) |
| Visit-time proposed | **0/30** | **30/30 AI_PROPOSED** (no travel time) |
| Visit-time approved | **0/30** | **0/30** |
| M1 suitability | sparse binary modes | **30/30 AI_PROPOSED** from visit-time heuristic |
| M2 suitability | UNKNOWN | **4/30 known** (demo step-free evidence); **26/30 UNKNOWN** (not inferred) |
| M3 suitability | M3 tag only | **30/30 AI_PROPOSED** role heuristic |
| M4 suitability | missing | **30/30** proposed or daylight-restricted; hours still largely UNKNOWN |
| M5 suitability | missing | **30/30 AI_PROPOSED** polish proxy |
| Sensitive-memory explicit | **0/30** on engine | **4 true** (STGO_04/07/19/48) + rest explicit false w/ provenance |
| Accessibility | **0/30** | **4/30 known**; **26/30 UNKNOWN** |
| Daylight / operational | **0/30** | **3/30** daylight known; others `HOURS_REQUIRED_UNKNOWN` |
| Editorial role | **30/30** curated | **30/30** preserved |
| Tier (normalized) | legacy launch/expansion | **30/30** `canonical_anchor` / `thematic_pocket` / `micro_reveal` |

Opening hours: **not fabricated**. Institutional schedules remain UNKNOWN.

---

## Culinary QA

Fixture `C_food_street_life` (`gastronomia` → ThemeCode **T2**) ranks continuous culinary nodes (La Vega, La Piojera, Confitería Torres, Mercado Tirso, Bocanáriz) via `traveler_weight × node_strength`.

---

## Artifacts

| Artifact | Path |
|---|---|
| Proposed calibration | `src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json` |
| Curator Studio | `docs/engine/gate-2a1-editorial-calibration.html` |
| Source audit | `docs/engine/gate-2a1-source-audit.json` |
| Builder | `scripts/engine/build_editorial_calibration_v0_1.py` |

Curator Studio edits are **localStorage + JSON export** only — no fake server persistence. Export is not auto-marked `CURATOR_APPROVED`.

---

## Flags

| Flag | Value |
|---|---|
| `PHYSICAL_LAYER_V0_1_READY` | `true` |
| `PHYSICAL_ROUTE_GENERATION_ENABLED` | `false` |
| `NODE_UTILITY_V0_1_READY` | `true` |
| `EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY` | `true` |
| `EDITORIAL_CALIBRATION_CURATOR_APPROVED` | `false` |

---

## Founder decisions still required

1. Review/adjust ChronoWorth proposals; approve or override.  
2. Confirm visit-time ranges.  
3. Confirm sensitive-memory flags.  
4. Supply real accessibility evidence where still UNKNOWN (do not guess).  
5. Supply opening hours only from trustworthy sources.  
6. Export decisions JSON and ingest via a future curator-approval gate (not 2A.1).

---

## Blockers before Gate 2B

- Founder calibration review not yet ingested (`EDITORIAL_CALIBRATION_CURATOR_APPROVED` remains false).  
- Opening hours largely UNKNOWN.  
- Accessibility largely UNKNOWN.  
- Narrative / relational graph (Gate 2B) not started — by design.
