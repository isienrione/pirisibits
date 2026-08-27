# Engine V0.1 Implementation Contract

**Gate:** 2A (+ semantic restoration **2A.1**)  
**Status:** CANONICAL (reconstructed from repository types/data — prior `ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md` was unrecoverable)  
**City substrate:** Santiago Physical Graph V0.1 (frozen Gate 1B.5)  
**Traveler route generation:** DISABLED (`PHYSICAL_ROUTE_GENERATION_ENABLED = false`)  
**Editorial calibration:** `EDITORIAL_CALIBRATION_V0_1_PROPOSED_READY = true` (not curator-approved)

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
| Continuous `thematicVector` T1A–T9 incl. **T2 Culinary** | **CANONICAL_RUNTIME (2A.1)** | Named object 0–1; source of NodeUtility interest match |
| Derived `ThemeCode` tags | **DERIVED_CONVENIENCE** | Threshold 0.45 from continuous vector — never reverse |
| Binary tags on raw engine JSON | **LEGACY_PARTIAL** | Gate 1B.2 `KIND_THEMES`; expanded/overlaid by calibration |
| Modes M1–M5 type + `structuralSuitability` | **CANONICAL_EXISTING + AI_PROPOSED** | Continuous/inspectable suitability with provenance; M2 UNKNOWN stays null |
| `chronoWorth` proposed/approved/effective | **AI_PROPOSED_UNVERIFIED** | Approved remains null until founder ingest |
| `editorialRole` | **PARTIAL_EXISTING** | Present as open strings (anchor/pocket/micro/…) |
| `tier` normalized | **AI_PROPOSED / ROLE-DERIVED** | `canonical_anchor` / `thematic_pocket` / `micro_reveal` (+ legacy launch/expansion retained) |
| Discovery posture D1/D2/D3 | **CANONICAL_EXISTING** | `RHYTHM_POSTURE` in `algorithm.ts` |
| Visit duration min/typical/max | **AI_PROPOSED_UNVERIFIED** | Excludes travel time; not auto-approved |
| Accessibility | **UNKNOWN unless evidenced** | Never invent; KNOWN_STEP_FREE / KNOWN_NOT_STEP_FREE / UNKNOWN |
| Opening hours | **UNKNOWN** | Not fabricated in 2A.1 |
| Sensitive memory flag | **EXPLICIT METADATA** | Not inferred from T1B alone |
| Launch runtime dispositions | **CANONICAL_EXISTING** | Gate 1B.5 membership |
| Physical centrality / edge degree | **FUTURE_NOT_2A** for NodeUtility / ChronoWorth | Forbidden as editorial inputs |
| NarrativeEdge / ArcState | **FUTURE_NOT_2A / Gate 2B** | Interfaces forbidden as operational in 2A/2A.1 |
| `knapsackEngine.optimizeItinerary` ChronoWorth synthesis | **DEPRECATED for Engine V0.1** | Synthesizes worth from resonance/media — must NOT feed Gate 2A ChronoWorth |

---

## Canonical taxonomy (do not rename)

### Themes (`ThemeCode`) — continuous vector is canonical

| Code | Label |
|---|---|
| T1A | Civic, Military & Traditional Heritage |
| T1B | Memory, Human Rights & Grassroots |
| T2 | Culinary Explorer & Gastronomy |
| T3 | Urban Shutterbug & Aesthetics |
| T4 | Subculture, Street Art & Indie |
| T5 | Mindful, Green & Quiet Living |
| T6 | Dark Lore, Forensics & Macabre |
| T7 | Budget Hacker & Street Life |
| T8 | Urban Ecology & Conscious Living |
| T9 | Luxury Heritage & High Craft |

T1A and T1B remain distinct (never merged). T2 Culinary is restored. T10 must not be invented.  
Interest match: `traveler_weight × node_thematic_strength` on the continuous vector.

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

## NodeUtility + YourMatch

Domain **0–100**. Components (named caps in `src/engine/scoring/constants.ts`):

| Component | Cap | Source |
|---|---|---|
| editorial | 30 | ChronoWorth effective (approved ≻ proposed) + role blend |
| interests | 40 | Continuous vector × traveler theme weights |
| structural | 15 | `structuralSuitability` (UNKNOWN excluded; never treat UNKNOWN as fit) |
| discovery | 10 | D1/D2/D3 × editorialRole / normalized tier |
| context | 5 | Already-visited soft demotion |

**YourMatch** = traveler-specific fit = interests + structural + discovery.  
**NodeUtility** = editorial + YourMatch constituents + context.  
**ChronoWorth ≠ YourMatch ≠ Match-as-popularity.**

**Forbidden in NodeUtility / ChronoWorth**

- Physical centrality / Metro proximity / edge degree
- NarrativeEdgeScore / ArcState / route coherence
- Synthesized ChronoWorth from Mapbox / Google / LLM / resonance hacks
- Invented accessibility (UNKNOWN stays UNKNOWN)
- Auto-promoting AI proposals to CURATOR_APPROVED

Visit time (proposed/authored) is distinct from travel time (physical graph). Gate 2A/2A.1 does not add travel duration into visit cost.

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

Global editorial value — **not** traveler-specific; **not** YourMatch / interest score.

Gate 2A.1 launch coverage: **30/30 AI_PROPOSED**, **0/30 CURATOR_APPROVED**.  
Founder-approved value always supersedes AI proposal. Proposal formula is documented in `launch30_editorial_calibration.proposed.v0.1.json` and the Gate 2A.1 report.

---

## Placeholders (non-operational)

- NarrativeEdgeScore  
- ArcState / ArcQuality  
- Route composer  

Flags: `NODE_UTILITY_V0_1_READY = true` does **not** imply `ROUTE_COMPOSER_READY`.

---

## Physical layer

Gate 1B.5 artifacts are **immutable inputs**. Defects are reported, not silently repaired.
