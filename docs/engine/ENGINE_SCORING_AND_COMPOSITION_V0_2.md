# ChronoWalk Engine — Scoring & Composition Contract V0.2

**Status:** CANONICAL DESIGN CONTRACT — **NOT YET IMPLEMENTED**  
**Gate:** 2E.1M (documentation + schema contract only)  
**Supersedes (design intent only):** implicit single-scalar NodeUtility dominance in route expansion  
**Does not modify:** V0.1 runtime (`NodeUtility`, Route Composer, ArcQuality, reranker, physical/narrative graphs)

---

## Document purpose

This document freezes the **conceptual and mathematical contract** for the next engine iteration before any scoring/composer V0.2 code changes.

It makes explicit:

1. Hard feasibility  
2. Intrinsic POI worth  
3. Traveler match  
4. Role fit  
5. Marginal route value  
6. Transition value  
7. Candidate generation  
8. Route-level ArcQuality  
9. Reranking  

**No single scalar may be described as “the POI score” without naming its layer.**

Runtime today remains **Engine V0.1**. References to V0.2 formulas below are **forward-looking design** unless explicitly marked as current V0.1 behavior.

---

## Layer architecture (nine concerns)

```
RouteRequest + TravelerModel
        │
        ▼
┌───────────────────────────────────────┐
│ 1. HARD FEASIBILITY (gate, not score) │
└───────────────────────────────────────┘
        │ eligible candidates only
        ▼
┌───────────────────────────────────────┐
│ 2. INTRINSIC WORTH (static, traveler- │
│    independent editorial value)       │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 3. TRAVELER MATCH (static relevance)  │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 4. ROLE FIT (continuous propensities)  │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 5. BASE NODE VALUE (pre-sequence pool │
│    / beam seed desirability)          │
└───────────────────────────────────────┘
        │
        ▼  beam expansion / multi-lane search
┌───────────────────────────────────────┐
│ 6. MARGINAL ROUTE VALUE (sequence-    │
│    dependent “what does i add NOW?”)  │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 7. TRANSITION VALUE (prev → i edge)   │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 8. NEXT STOP VALUE (expansion objective│
│    per beam step)                     │
└───────────────────────────────────────┘
        │
        ▼  complete candidates
┌───────────────────────────────────────┐
│ 9. ROUTE-LEVEL ArcQuality + RERANK    │
│    (sequence evaluation, not generation)│
└───────────────────────────────────────┘
        │
        ▼
   FinalRouteScore (V0.2) / rerankedScore (V0.1 provisional)
```

---

## B. Core principle — sequence dependence

**ChronoWalk route selection is sequence-dependent.**

A POI can be:

- intrinsically excellent  
- highly relevant to a traveler  
- physically feasible  

and still be the **wrong NEXT stop** because it adds little **marginal value** to the route-so-far.

Therefore the engine must distinguish three concepts that V0.1 partially conflates in NodeUtility-driven beam expansion:

| Concept | Question it answers | Depends on route order? |
|---|---|---|
| **Static node quality** (`IntrinsicWorth`) | How much editorial value does this POI contain in isolation? | No |
| **Traveler-specific relevance** (`TravelerMatch`) | How well does this POI fit this traveler’s stated preferences? | No |
| **Sequence-dependent marginal value** (`MarginalRouteValue`) | What useful new value does this POI add **now**, given ArcState and route-so-far? | **Yes** |

V0.1 `NodeUtility` combines editorial + traveler fit into one pre-route scalar used heavily during beam expansion. V0.2 **does not abolish** that scalar for pool ranking, but **must not** treat it as sufficient for later stop selection.

---

## C. Hard feasibility

Hard feasibility is a **gate**, not a score.

```
Eligible(i, state, request) ∈ { true, false, unknown-policy }
```

Hard constraints are applied **before** any desirability scoring. Infeasible candidates are **rejected**; they do not receive a low numeric score that could be overridden by high desirability.

### Current V0.1 examples (preserved conceptually)

| Constraint class | Examples |
|---|---|
| Runtime physical exclusion | Launch corpus membership; `RUNTIME_EXCLUDED_*`; STGO_104 pending enrichment; STGO_33 not runtime-ready |
| Accessibility | Step-free incompatibility when **explicitly known** incompatible; UNKNOWN → warning, not auto-fail unless policy says so |
| Sensitive memory | Opt-in required for explicit sensitive-memory sites |
| Daylight | Daylight-only nodes when night context applies (when authored) |
| Route time feasibility | Cannot exceed budget under known visit + transition evidence |
| Transport policy | `WALK_ONLY` vs `WALK_METRO`; Metro operational constraints (L1–L6) |
| Physical transition availability | No adjacency / no feasible walk or Metro leg → reject before TransitionValue |

### UNKNOWN handling (mandatory)

**UNKNOWN factual evidence must never become a numerical zero or false certainty.**

- UNKNOWN accessibility ≠ “not accessible”  
- UNKNOWN ChronoWorth ≠ 0  
- UNKNOWN visit duration ≠ instant visit  
- UNKNOWN opening hours ≠ closed  

Unknown may trigger: warnings, conservative policy branches, or exclusion only when an explicit **unknown-policy** rule applies — never silent coercion to worst case.

---

## D. Intrinsic worth

### Naming

| Term | Role |
|---|---|
| **IntrinsicWorth** | Mathematical / engine concept (V0.2 canonical name) |
| **ChronoWorth** | Editorial / product-facing name (preserved) |

V0.1 runtime uses `chronoWorth` fields on engine nodes. V0.2 documentation uses **IntrinsicWorth** when referring to the isolated editorial quantity.

### Canonical formula

```
IntrinsicWorthRaw =
  100 × (
    0.35 × heritageDepth
  + 0.30 × anchorDensity
  + 0.20 × microReveal
  + 0.15 × polish
  )
```

Where each input ∈ [0, 1]:

| Symbol | Meaning |
|---|---|
| `heritageDepth` | Depth of heritage / memory / craft significance |
| `anchorDensity` | Iconic anchor / civic landmark weight |
| `microReveal` | Small-scale reveal / texture / hidden-detail weight |
| `polish` | Aesthetic / presentation / craft polish |

Therefore: **IntrinsicWorthRaw ∈ [0, 100]**.

### What IntrinsicWorth answers

> “How much editorial value does this POI contain **in isolation**?”

### What IntrinsicWorth does NOT answer

> “Should this POI be in **this traveler’s route**?”  
> “Is this POI the **best next stop**?”

High IntrinsicWorth **must not** dominate route inclusion merely because it is high.

### Optional derived comparison forms

| Derived quantity | Purpose |
|---|---|
| `IntrinsicWorthPercentileSantiago` | Rank within full Santiago inventory |
| `IntrinsicWorthPercentileActiveCorpus` | Rank within active launch / curated corpus |

These are **derived comparison values**. **Absolute `IntrinsicWorthRaw` remains canonical.**

### Provenance

Founder structural metrics may be `FOUNDER_PRECALIBRATED` or `FOUNDER_EDITED`.  
AI-filled proxies remain `AI_PROPOSED_UNVERIFIED` until founder approval.  
Missing metrics → `UNKNOWN` (not 0).

---

## E. Traveler match

```
TravelerMatch ∈ [0, 100]
```

Conceptual composition:

```
TravelerMatch =
    w_theme      × ThematicAffinity
  + w_discovery  × DiscoveryPostureAffinity
  + w_familiarity × FamiliarityAffinity
  + w_structure  × StructuralPreference
  + w_context    × ContextAffinity
```

Exact V0.2 weights are **implementation-configurable** (central config).  
V0.1 approximates parts of this via NodeUtility components: `interests` (40 cap), `structural` (15), `discovery` (10), `context` (5).

### Thematic affinity

Use continuous **T1A–T9** traveler weights and POI theme vectors.

Preferred normalized formulation:

```
ThematicAffinity =
  100 × weighted_similarity(travelerThemeVector, poiThemeVector)
```

Requirements:

- Similarity method must be **deterministic** and **centrally implemented** (single function, no scattered dot products).  
- If **cosine similarity** is used, zero-vector handling must be explicit:

```
if ||travelerVector|| = 0 OR ||poiVector|| = 0:
  ThematicAffinity = UNKNOWN (or policy-defined neutral), NOT 0 as certainty
```

### Discovery posture affinity

| Posture | Product rhythm | Engine behavior (conceptual) |
|---|---|---|
| **D1 Flâneur** | equilibrado | Prefer novelty, texture, localness, pockets/micro discoveries |
| **D2 Detective** | espontáneo | Prefer clues, materiality, unresolved/resolved questions, hidden detail |
| **D3 Collector** | estructurado | Prefer canonical completeness, recognizable signatures, coherent collection |

### Familiarity (F1 / F2 / F3)

| Code | Semantics |
|---|---|
| F1 outsider | May increase surprise / orientation value weights |
| F2 regional peer | Moderate obviousness adjustments |
| F3 local insider | May decrease redundant “tourist-default” reward |

Fam familiarity modifiers **must never fabricate cultural assumptions** about POIs or travelers.

### Context affinity (soft)

Family, night, high comfort, express, etc. are **soft preferences** unless promoted to hard feasibility by explicit policy.

They remain **separate from hard feasibility** where they express desirability rather than exclusion.

---

## F. Role fit

V0.2 replaces **exclusive** structural classification as the **primary scoring model** with continuous role propensities:

```
anchorFit       ∈ [0, 1]
pocketFit       ∈ [0, 1]
microRevealFit  ∈ [0, 1]
```

A node may score meaningfully on **more than one** role simultaneously.

**Conceptual example:**

| POI | anchorFit | pocketFit | microRevealFit |
|---|---:|---:|---:|
| X | 0.85 | 0.45 | 0.10 |
| Y | 0.15 | 0.65 | 0.92 |

### Derived diagnostic role

A derived `primaryStructuralRole` may still exist for UI, Route Lab ribbons, and diagnostics.

Route search should be able to consume **continuous propensities**, not only discrete A/P/M labels.

### V0.1 preservation note

Current source structural metrics (`editorialRole`, `tierNormalized`, anchor/pocket/micro counts in route candidates) are **not overwritten** in this gate.  
This section defines the **V0.2 model contract only**.

### Role preference fit (for BaseNodeValue)

```
RolePreferenceFit(i, traveler, routeIntent) ∈ [0, 100]
```

Combines traveler/route-intent role demand with POI propensities.  
Example: ESSENTIALS intent increases reward for high `anchorFit`; DISCOVERY intent increases reward for pocket/micro propensity.

---

## G. Base node value

Pre-sequence desirability:

```
BaseNodeValue(i, traveler) ∈ [0, 100]
```

Conceptual formula:

```
BaseNodeValue =
    w_intrinsic × IntrinsicWorth
  + w_match     × TravelerMatch
  + w_role      × RolePreferenceFit
```

Weights centralized in versioned config.

### Permitted uses

- Candidate-pool prioritization  
- Initial beam expansion seed ordering  
- Lane-specific priors (see §K)

### Insufficient uses

- **Not sufficient** for choosing later route stops  
- **Not sufficient** as sole reranking input  
- **Must not** override hard feasibility

---

## H. Marginal route value

Central V0.2 concept:

```
MarginalRouteValue(i | ArcState, routeSoFar, traveler) ∈ [0, 100]
```

Answers:

> “What useful new value does this POI add **NOW**?”

### Normalized components

| Component | Meaning |
|---|---|
| `NewThemeValue` | Reward valuable themes not yet adequately represented on route-so-far |
| `StructuralNovelty` | Reward appropriate change of scale / experience type vs recent stops |
| `DiscoveryValue` | Traveler-sensitive reward for unexpected / local / micro content |
| `NarrativeProgression` | Reward meaningful deepening, contrast, reveal supported by narrative graph |
| `QuestionPayoff` | Reward resolving an actually opened narrative question |
| `RoleNeedFit` | Reward filling a route role currently underrepresented (anchors vs pockets vs micros) |
| `GeographicProgression` | Reward sensible forward spatial progression where physical evidence supports it |
| `Redundancy` | Penalty term: semantic/structural repetition relative to recent route state |

### Conceptual formula

```
MarginalRouteValue =
    w_newTheme      × NewThemeValue
  + w_structure     × StructuralNovelty
  + w_discovery     × DiscoveryValue
  + w_progression   × NarrativeProgression
  + w_payoff        × QuestionPayoff
  + w_roleNeed      × RoleNeedFit
  + w_geographic    × GeographicProgression
  - w_redundancy    × Redundancy
```

All components normalized consistently to [0, 1] before weighting unless explicitly defined as signed penalty inputs.

### Relationship to V0.1

V0.1 beam expansion uses incremental route score signals (NodeUtility, NarrativeEdgeScore, diversity penalties) but **does not** expose a named MarginalRouteValue decomposition. V0.2 makes this layer explicit.

---

## I. Transition value

```
TransitionValue(prev, next, ArcState, request) ∈ [0, 100]
```

Conceptually combines:

| Factor | Source |
|---|---|
| Narrative transition desirability | `NarrativeEdgeScore` + ArcState deltas |
| Physical transition quality | Walk geometry quality, Metro leg clarity, friction |
| Spatial legibility | Whether the leg is understandable / coherent on a map |
| Transition burden | Time / distance / mode-switch cost (soft, not feasibility) |
| Prerequisite satisfaction | Narrative or editorial prerequisites met by this leg |

### Feasibility separation (mandatory)

```
if PhysicalTransition(prev, next) is INFEASIBLE:
  reject candidate BEFORE TransitionValue is computed
```

**Narrative desirability cannot override physical infeasibility.**

TransitionValue evaluates **among feasible transitions only**.

---

## J. Next stop value

V0.2 route-expansion objective at each beam step:

```
NextStopValue(i | routeState) =
    w_base       × BaseNodeValue(i)
  + w_marginal   × MarginalRouteValue(i | routeState)
  + w_transition × TransitionValue(prev, i)
  + w_time       × TimeFit(i)
  + w_physical   × PhysicalEfficiency(prev, i)
  - penaltySum
```

### Candidate penalties (non-exhaustive)

| Penalty | Purpose |
|---|---|
| `detourPenalty` | Spatial backtrack / inefficient geographic detour |
| `constraintRiskPenalty` | Soft risk when evidence is incomplete but worrisome |
| `repetitionPenalty` | Theme / relation / structural repetition |
| `overcompressionPenalty` | Cramming too many high-dwell stops into remaining budget |

All weights centrally configurable per lane and traveler modifiers.

### TimeFit

Rewards stops whose dwell + movement fit remaining budget bands without forcing infeasible completion.

### PhysicalEfficiency

Rewards legs with favorable distance/time evidence from frozen physical graph (where known).  
UNKNOWN physical evidence → neutral or policy branch, not fabricated efficiency.

---

## K. Multi-lane candidate generation

V0.2 defines **three initial candidate-generation lanes**.  
These are **distinct search objectives**, not labels applied after generation.

Each lane uses a **LaneObjective** weighting over expansion terms (hypothesis weights below).

### Lane 1 — SIGNATURE

**Goal:** Strongest recognizable / high-value traveler-fit experience.

| Term | Initial hypothesis weight |
|---|---:|
| IntrinsicWorth | 0.25 |
| TravelerMatch | 0.25 |
| MarginalRouteValue | 0.20 |
| TransitionValue | 0.15 |
| PhysicalEfficiency | 0.15 |

### Lane 2 — DISCOVERY

**Goal:** More exploratory, surprising, structurally varied route.

| Term | Initial hypothesis weight |
|---|---:|
| IntrinsicWorth | 0.10 |
| TravelerMatch | 0.30 |
| MarginalRouteValue | 0.35 |
| TransitionValue | 0.15 |
| PhysicalEfficiency | 0.10 |

### Lane 3 — FLOW

**Goal:** Spatially / narratively elegant progression.

| Term | Initial hypothesis weight |
|---|---:|
| IntrinsicWorth | 0.15 |
| TravelerMatch | 0.20 |
| MarginalRouteValue | 0.20 |
| TransitionValue | 0.20 |
| PhysicalEfficiency | 0.25 |

> **INITIAL V0.2 HYPOTHESIS — SUBJECT TO ROUTE LAB CALIBRATION**  
> Do not treat these numbers as implemented or frozen. No lane implementation is authorized in Gate 2E.1M.

V0.1 generates up to three candidates via diversity selection over a **single** beam objective (`route-diversity.ts`), not true multi-lane search.

---

## L. Traveler-sensitive lane modifiers

Conceptual modifiers adjust lane weights and MarginalRouteValue component emphasis.  
These are **engine behavior parameters**, not fabricated facts about POIs.

### Discovery posture

**D1 Flâneur — increase:** novelty, discovery value, pocket/micro role need, structural variety  
**D1 — reduce:** intrinsic essentiality dominance  

**D2 Detective — increase:** question continuity, materiality, hidden-detail payoff, reveal value  

**D3 Collector — increase:** canonical completeness, signature POI coverage, essentiality  

### Mode / intent examples

**M1 EXPRESS — increase:** IntrinsicWorth weight, directness, physical efficiency  
**M1 — increase penalties:** detour, redundancy, low-value filler  

**ESSENTIALS route intent — increase:** IntrinsicWorth, anchorFit  

**DISCOVERY route intent — increase:** MarginalRouteValue, structural novelty, surprise/redundancy sensitivity  

**THEMATIC route intent — increase:** TravelerMatch, thematic coherence  

Modifiers compose with lane weights; final weights remain in versioned config with provenance.

---

## M. Derived editorial dimensions V0.2

Proposed **derived editorial layer** — does **not** overwrite founder source metrics.

| Dimension | Range | Notes |
|---|---|---|
| essentiality | [0,1] or UNKNOWN | Canonical must-see weight |
| discoveryDensity | [0,1] or UNKNOWN | Richness of small discoveries |
| visualPayoff | [0,1] or UNKNOWN | Visual / aesthetic reward |
| storyDepth | [0,1] or UNKNOWN | Narrative depth available |
| localness | [0,1] or UNKNOWN | Local texture vs generic tourism |
| surprise | [0,1] or UNKNOWN | Unexpectedness vs expectation |
| orientationValue | [0,1] or UNKNOWN | Helps traveler understand city |
| lingerValue | [0,1] or UNKNOWN | Reward for dwelling |
| transitionValue | [0,1] or UNKNOWN | Quality as a bridge between stops |
| senseOfPlace | [0,1] or UNKNOWN | Place-specific atmosphere |

Initial status may be `AI_PROPOSED_UNVERIFIED`.  
Founder review is **not required before experimentation**, but every value requires:

- provenance  
- rationale  
- confidence  
- founder override support  

Not all dimensions are required for first V0.2 implementation.  
**Likely initial subset:** essentiality, discoveryDensity, surprise, orientationValue, lingerValue.

---

## N. Route-level ArcQuality

ArcQuality remains **route-level evaluation** of **complete candidate sequences**.

Explicit rules:

- ArcQuality **does not generate** physical feasibility.  
- ArcQuality **evaluates** sequences already composed under feasibility constraints.  
- ArcQuality **does not** mutate candidates in place during evaluation.

### V0.1 positive components (preserved)

openingStrength, developmentStrength, payoffStrength, rhythmBalance, curiosityContinuity, themeDiversity, thematicCoherence, contrastBalance, revealSpacing, anchorDistribution, structuralVariety, relationTypeVariety, questionResolution, endingStrength, timeUtilization, routeDistinctiveness

Plus penalties: repetition, unresolved setup, monotony, weak ending, overstuffing, underutilized budget, backtracking, etc.

Implementation: `src/engine/routes/arc-quality.ts`, weights in `arc-quality-config.ts`.

### V0.1 rerank blend (documented, not frozen for V0.2)

```
FinalRouteScore_v0.1_provisional =
  0.60 × ComposerProvisionalScore
+ 0.40 × ArcQualityScore
```

Marked: **PROVISIONAL V0.1 VALUE — NOT FROZEN FOR V0.2**

Future tuning candidates for Route Lab calibration may include 65/35, 70/30 — **no change authorized in Gate 2E.1M**.

### V0.2 relationship

```
ComposerScore     = score at end of candidate generation (lane-aware in V0.2)
ArcQuality        = route-level arc evaluation (unchanged responsibility)
FinalRouteScore   = blend(composer, arc) per versioned rerank config
```

---

## O. Route score layers — terminology table

| Term | Range | Primary inputs | Traveler dep? | Sequence dep? | Physical dep? | Purpose | Must NOT be used for |
|---|---|---|---|---|---|---|---|
| **IntrinsicWorth** | [0,100] | heritageDepth, anchorDensity, microReveal, polish | No | No | No | Isolated editorial POI value | Next-stop selection alone; feasibility |
| **TravelerMatch** | [0,100] | themes, discovery, familiarity, modes, context | **Yes** | No | Soft only | Static traveler-POI fit | Hard exclusion; isolated “POI score” label |
| **RoleFit** | [0,1]×3 | anchor/pocket/micro propensities | Soft | Soft | No | Structural suitability | Exclusive single-label gating |
| **BaseNodeValue** | [0,100] | IntrinsicWorth, TravelerMatch, RolePreferenceFit | Yes | No | No | Pool rank / beam seed | Final stop choice; rerank alone |
| **MarginalRouteValue** | [0,100] | ArcState, routeSoFar, themes, roles, geography | Yes | **Yes** | Soft | “What does i add NOW?” | Pre-pool ranking without context |
| **TransitionValue** | [0,100] | NarrativeEdge, physical leg, ArcState | Yes | **Yes** | **Yes** | Feasible edge quality | Overriding infeasible legs |
| **NextStopValue** | ℝ (normalized) | Base + Marginal + Transition + time + physical − penalties | Yes | **Yes** | Yes | Beam expansion objective | Arc-level narrative closure alone |
| **ComposerScore** | [0,100] | Incremental NextStopValue aggregation + completion bonuses | Yes | **Yes** | Yes | Rank candidates from composer | Physical feasibility generation |
| **ArcQuality** | [0,100] | Full route sequence features | Yes | **Yes** | Soft | Route-level arc coherence | Leg feasibility; node pool rank |
| **FinalRouteScore** | [0,100] | ComposerScore, ArcQuality blend | Yes | **Yes** | Indirect | Post-rerank winner selection | Per-stop inclusion without decomposition |

---

## P. Explainability contract

Every selected stop must expose a structured explanation. Generic opaque text is forbidden.

### Required sections

1. **IntrinsicWorth** — value + major contributors (or UNKNOWN)  
2. **TravelerMatch** — value + strongest matching themes / preferences  
3. **RoleFit** — current needed role + POI propensity alignment  
4. **MarginalRouteValue** — what new contribution vs existing route  
5. **TransitionValue** — narrative + physical transition rationale  
6. **Penalties** — specific deductions by name  

### Example (target quality)

> Selected because:  
> + strong match for T3 aesthetics  
> + adds a micro-reveal after two large civic anchors  
> + introduces a theme not yet represented  
> + only 4.2 minutes of additional walking  
> − moderate intrinsic importance compared with nearby anchors  

V0.1 partial implementation: `route-explain.ts` inclusion strings. V0.2 requires decomposition by layer.

---

## Q. Provenance

Every node-level value must carry provenance where relevant.

### Recognized provenance classes

| Class | Meaning |
|---|---|
| `FOUNDER_PRECALIBRATED` | Founder-authored baseline metric |
| `FOUNDER_EDITED` | Founder override in cockpit |
| `AI_PROPOSED_UNVERIFIED` | Model/rule proposal awaiting review |
| `CURATOR_APPROVED` | Approved for runtime use |
| `FIELD_VERIFIED` | On-site or operational verification |
| `PROVIDER_DERIVED` | Mapbox / GTFS / provider artifact |
| `UNKNOWN` | No reliable evidence |

Derived engine values must identify **source components** and their provenance minima.

```
UNKNOWN ≠ 0
```

---

## R. Configuration contract

All tunable weights belong in **explicit versioned config files**. No scattered magic numbers in search loops.

### Preferred future implementation paths

| File | Contents |
|---|---|
| `src/engine/scoring/scoring-config.v0.2.ts` | Global scoring version, normalization, caps |
| `src/engine/scoring/traveler-match-config.v0.2.ts` | TravelerMatch weights & similarity policy |
| `src/engine/scoring/marginal-value-config.v0.2.ts` | MarginalRouteValue component weights |
| `src/engine/routes/lane-config.v0.2.ts` | Lane objectives + traveler modifiers |

Gate 2E.1M **does not create runtime implementations** except optional inert type/schema placeholders if needed later.

V0.1 configs remain authoritative for current runtime:

- `src/engine/scoring/constants.ts`  
- `src/engine/routes/route-config.ts`  
- `src/engine/routes/arc-quality-config.ts`  

---

## S. Versioning

Every future `RouteResult` must identify the scoring model that produced it.

### Required metadata fields (conceptual)

```typescript
{
  scoringModelVersion: "0.2",
  composerModelVersion: "0.2",
  arcQualityVersion: "0.1",      // until ArcQuality V0.2 exists
  calibrationVersion: string,
  physicalGraphVersion: "0.1",
  narrativeGraphVersion: "0.1",
  rerankBlendVersion: string,
  laneConfigVersion?: string,
}
```

V0.1 today exposes partial versioning via `inputVersions` on `RouteComposerResultV01`. V0.2 extends this to scoring/composer/lane identity.

---

## T. V0.1 vs V0.2 Route Lab comparison contract

Before replacing V0.1 behavior, Route Lab **must** support side-by-side comparison for the **same RouteRequest**:

| Engine mode | Description |
|---|---|
| **V0.1 ENGINE** | Current provisional composer + ArcQuality reranker |
| **V0.2 ENGINE** | Multi-lane + MarginalRouteValue composer (when implemented) |

### Mandatory comparison dimensions

- stop sequence  
- lane assignment (V0.2)  
- stop overlap / ordered overlap  
- time budget use  
- physical walking distance (where evidenced)  
- theme coverage  
- structural rhythm (A/P/M ribbon)  
- ComposerScore  
- ArcQuality  
- FinalRouteScore  
- omission reasons  

Human geographic review (Gate 2E.1) feeds calibration; it does **not** auto-tune weights.

---

## U. Relationship to V0.1 runtime (explicit non-goals)

This contract **does not authorize**:

- Changing NodeUtility implementation  
- Changing ChronoWorth source fields  
- Changing NarrativeEdgeScore  
- Changing Route Composer beam search  
- Changing ArcQuality weights  
- Changing reranker 60/40 blend  
- Enabling production routing  

Current flags remain:

- `PHYSICAL_ROUTE_GENERATION_ENABLED = false`  
- `EDITORIAL_CALIBRATION_CURATOR_APPROVED = false`  

---

## V. Formula appendix

### Symbols

| Symbol | Description |
|---|---|
| i, j | POI indices |
| prev | Previous stop on route-so-far |
| ArcState | Narrative arc state after previous stops |
| routeSoFar | Ordered stop list prefix |
| w_* | Configurable weights ∈ [0,1], sum normalized per layer where applicable |

### IntrinsicWorth

```
IntrinsicWorthRaw(i) = 100 × (0.35·h_i + 0.30·a_i + 0.20·m_i + 0.15·p_i)
```

h_i, a_i, m_i, p_i ∈ [0,1]; any UNKNOWN → propagate UNKNOWN on IntrinsicWorthRaw, not 0.

### TravelerMatch

```
TravelerMatch(i) = Σ_k w_k · Component_k(i)
```

Components normalized to [0,100] before outer weights.

### BaseNodeValue

```
BaseNodeValue(i) = w_I·IntrinsicWorth(i) + w_T·TravelerMatch(i) + w_R·RolePreferenceFit(i)
```

### MarginalRouteValue

```
MRV(i | S) = Σ_j w_j · Component_j(i, S) − w_red · Redundancy(i, S)
```

S = route state.

### TransitionValue

```
TV(prev, i | S) = feasible(prev,i) ? blended narrative + physical + legibility − burden : REJECT
```

### NextStopValue

```
NSV(i | S) = w_b·BNV(i) + w_m·MRV(i|S) + w_t·TV(prev,i|S) + w_time·TimeFit(i|S) + w_phys·PhysEff(prev,i) − penalties
```

### LaneObjective (expansion)

```
LaneScore_lane(i | S) = Σ_term w_lane,term · Term(i, S)
```

Terms map to IntrinsicWorth, TravelerMatch, MRV, TV, PhysicalEfficiency per lane table (§K).

### FinalRouteScore

**V0.1 provisional:**

```
FinalRouteScore = α · ComposerScore + (1 − α) · ArcQualityScore     α = 0.60 (provisional)
```

**V0.2 (configurable):**

```
FinalRouteScore = blend(ComposerScore, ArcQualityScore; rerankBlendVersion)
```

### Normalization rules

1. All [0,1] components clamp with documented edge behavior.  
2. UNKNOWN inputs propagate to UNKNOWN outputs unless explicit neutral policy documented.  
3. Hard constraints remove candidates before soft scoring.  
4. Penalties are always named and logged in explain output.

---

## W. Lane arbitration (Gate 2E.2E — added final stage)

This section is an additive final stage. It does not rewrite prior historical sections of this contract.

```
HARD FEASIBILITY
→ V0.2 SCORING
→ LANE-SPECIFIC SEARCH (SIGNATURE / DISCOVERY / FLOW)
→ one strong candidate per lane
→ ARCQUALITY (route-level)
→ LANE-NEUTRAL ARBITRATION
→ recommended route + optional alternatives
```

**Lane ComposerScore is within-objective search quality, not a universal cross-lane utility.**

Final recommendation uses a **lane-neutral common route feature vector** computed identically for every candidate, plus a modest traveler/request **LanePrior**. Raw lane ComposerScore is excluded from `RouteChoiceScore`.

Canonical implementation:

- `src/engine/routes/v0.2/arbitration/`
- ADR: `docs/engine/decisions/ADR-002-lane-composer-scores-are-not-cross-lane-utilities.md`
- Gate report: `docs/engine/GATE_2E_2E_LANE_ARBITRATION_V0_2.md`

Flags: `ROUTE_ARBITRATION_V0_2_PARALLEL_READY=true`. Production cut-over remains unauthorized (`ROUTE_ARBITRATION_V0_2_PRODUCTION=false`, `PHYSICAL_ROUTE_GENERATION_ENABLED=false`).

---

## Document control

| Field | Value |
|---|---|
| Canonical path | `docs/engine/ENGINE_SCORING_AND_COMPOSITION_V0_2.md` |
| Gate | 2E.1M |
| Implementation status | **NOT IMPLEMENTED** |
| ADR | `docs/engine/decisions/ADR-001-separate-static-traveler-and-marginal-route-value.md` |
