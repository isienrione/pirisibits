# Engine V0.1 Implementation Contract

**Gate:** 2A  
**Status:** CANONICAL (reconstructed from repository types/data — prior `ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md` was unrecoverable)  
**City substrate:** Santiago Physical Graph V0.1 (frozen Gate 1B.5)  
**Traveler route generation:** DISABLED (`PHYSICAL_ROUTE_GENERATION_ENABLED = false`)

---

## Staged pipeline

```
TravelerModel
        ↓
Hard Eligibility
        ↓
Node Utility
        ↓
Candidate Pool                         ← Gate 2A ends here
        ↓
Narrative / Relational Graph           [Gate 2B]
        ↓
Route Candidate Generation             [Gate 2C]
        ↓
Arc Evaluation / Reranking             [Gate 2D]
        ↓
Traveler Route
```

### Mandatory value separation

| Layer | Meaning | Gate |
|---|---|---|
| **NODE VALUE** | Intrinsic suitability of a single node for a traveler | **2A** |
| **PAIR / EDGE VALUE** | Compatibility / narrative transition between two nodes | **2B** |
| **ROUTE / ARC VALUE** | Coherence of an ordered sequence under time/space | **2C–2D** |

Gate 2A answers:

> For this traveler, under these constraints, which Santiago nodes are eligible candidates, how valuable is each, why, and with what confidence?

Gate 2A does **not** answer which complete route to follow.

---

## Repository-first input classification

| Input | Classification | Notes |
|---|---|---|
| `ThemeCode` T1A/T1B/T3–T9 on engine nodes | **CANONICAL_EXISTING** | Binary tags; no weights |
| Prompt “T2 Culinary” | **FUTURE_NOT_2A** | Absent from `ThemeCode`; demo `algorithm.ts` T2 index aliases **T1B memory** — do not invent culinary tags |
| Modes M1–M5 type | **CANONICAL_EXISTING** | Labels preserved |
| Launch `modes` values | **PARTIAL_EXISTING** | Launch freeze is almost entirely `M3` |
| `chronoWorth` | **MISSING_REQUIRED** (for quality) | Field exists; all launch values `null` |
| `editorialRole` | **PARTIAL_EXISTING** | Present as open strings (anchor/pocket/micro/…) |
| `tier` | **PARTIAL_EXISTING** | `launch` / `expansion` |
| Discovery posture D1/D2/D3 | **CANONICAL_EXISTING** | `RHYTHM_POSTURE` in `algorithm.ts` |
| Visit duration / timeCost on engine nodes | **MISSING_REQUIRED** | Not authored; demo `dwellMinutes` is Rome/demo POI catalog only |
| Accessibility on engine nodes | **MISSING_REQUIRED** / **UNKNOWN** | Physical friction audit: UNKNOWN |
| Opening hours | **MISSING_REQUIRED** | Not authored |
| Sensitive memory flag on engine nodes | **MISSING_REQUIRED** | Demo POI has `is_sensitive_memory_site`; engine JSON lacks it |
| Launch runtime dispositions | **CANONICAL_EXISTING** | Gate 1B.5 membership |
| Physical centrality / edge degree | **FUTURE_NOT_2A** for NodeUtility | May inform later composition only |
| NarrativeEdge / ArcState | **FUTURE_NOT_2A** | Interfaces forbidden as operational in 2A |
| `knapsackEngine.optimizeItinerary` ChronoWorth synthesis | **DEPRECATED for Engine V0.1** | Synthesizes worth from resonance/media — must NOT feed Gate 2A ChronoWorth |

---

## Canonical taxonomy (do not rename)

### Themes (`ThemeCode`)

| Code | Label |
|---|---|
| T1A | Civic, Military & Traditional Heritage |
| T1B | Memory, Human Rights & Grassroots |
| T3 | Urban Shutterbug & Aesthetics |
| T4 | Subculture, Street Art & Indie |
| T5 | Mindful, Green & Quiet Living |
| T6 | Dark Lore, Forensics & Macabre |
| T7 | Budget Hacker & Street Life |
| T8 | Urban Ecology & Conscious Living |
| T9 | Luxury Heritage & High Craft |

T1A and T1B remain distinct. T10 must not be invented. Culinary T2 is future alignment work.

### Structural modes

| Code | Label |
|---|---|
| M1 | Express / Time-Boxed |
| M2 | Accessibility / Step-Free |
| M3 | Family & Kid Quest |
| M4 | Night Owl / Nocturnal |
| M5 | High Comfort / Low Friction |

M1–M5 are **not** ordinary T interests.

### Discovery posture

| Code | Product rhythm | Semantics for 2A |
|---|---|---|
| D1 | equilibrado / Flâneur | Balanced desirability |
| D2 | espontaneo / Detective | Discovery-forward (micro/pocket soft boost) |
| D3 | estructurado / Coleccionista | Essentials-first (anchor/civic soft boost) |

Discovery modifies candidate desirability. It does **not** determine route order.

---

## TravelerModel

Normalized in `src/engine/traveler.ts` from existing `algorithm.ts` / knapsack inputs.

### Hard constraints

- `stepFreeRequired` (M2 / avoidStairs / M5 comfort path)
- `memorySitesOptIn === false` **only** against **explicit** sensitive flags (when present)
- Explicit daylight-only + night clock
- Explicit `editoriallyDisabled`
- Launch runtime `RUNTIME_EXCLUDED_*`
- `physicalRouteGenerationEligible === false` (launch)
- Hard remaining-time impossibility **only when authored visit duration exists**

### Soft preferences

- Theme weights T1A–T9 from interests
- Discovery posture D1–D3
- Express / family / night / high-comfort mode preferences
- Time budget (informational until visit durations exist)
- Starting node (context; unused for ranking beyond context hooks)

**UNKNOWN ≠ FALSE.** Wheelchair + accessibility UNKNOWN → warning, still eligible unless explicit incompatibility exists.

---

## Hard eligibility

`evaluateNodeEligibility(node, traveler, context) → EligibilityResult`

Inspectable `hardFailures[]` + `warnings[]`. Thematic preference is never a hard exclusion.

---

## NodeUtility

Domain **0–100**. Components (named caps in `src/engine/scoring/constants.ts`):

| Component | Cap | Source |
|---|---|---|
| editorial | 30 | ChronoWorth when present; else role soft signal only (ChronoWorth stays MISSING) |
| interests | 40 | ThemeCode ∩ traveler weights |
| structural | 15 | Explicit `node.modes` ∩ traveler M preferences |
| discovery | 10 | D1/D2/D3 × editorialRole |
| context | 5 | Already-visited soft demotion |

**Forbidden in NodeUtility**

- Physical centrality / Metro proximity / edge degree
- NarrativeEdgeScore / ArcState / route coherence
- Synthesized ChronoWorth from Mapbox / Google / LLM / resonance hacks
- Invented visit durations or accessibility

Visit time (authored) is distinct from travel time (physical graph). Gate 2A does not add travel duration into visit cost.

---

## Candidate pool

`buildCandidatePool(nodes, traveler, context)`

1. Launch corpus only  
2. Drop hard-ineligible  
3. Score NodeUtility  
4. Rank by utility desc, tie-break **canonical STGO ID asc**  
5. Retain warnings / missing evidence  

Not a route. Backlog must not enter the launch pool.

---

## ChronoWorth

Global editorial value — **not** traveler-specific; **not** Your Match / interest score.

Launch coverage today: **0/30 present**. Missing behavior: contribution does not invent a curated mid-default; provenance marks `CHRONOWORTH_MISSING`.

---

## Placeholders (non-operational)

- NarrativeEdgeScore  
- ArcState / ArcQuality  
- Route composer  

Flags: `NODE_UTILITY_V0_1_READY = true` does **not** imply `ROUTE_COMPOSER_READY`.

---

## Physical layer

Gate 1B.5 artifacts are **immutable inputs**. Defects are reported, not silently repaired.
