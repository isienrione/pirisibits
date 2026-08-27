# Gate 2A — Node Utility & Candidate Selection Report

**Gate:** 2A  
**Starting checkpoint:** `a747c1112ccd96424af0de2126fc1ef27316fb8e`  
**Contract:** `docs/engine/ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md`  
**Physical route generation:** DISABLED  
**Node utility ready:** TRUE  

---

## Mission completed

1. Reconstructed Engine V0.1 implementation contract from repository types/data.  
2. Implemented deterministic hard eligibility + NodeUtility + launch candidate pool.  
3. **Did not** compose routes, NarrativeEdgeScore, or ArcState.

---

## Structures

| Area | Action |
|---|---|
| `src/data/algorithm.ts` taxonomy / D1–D3 / interests | Reused |
| `src/lib/city-graph/types.ts` ThemeCode / ModeCode / Santiago nodes | Reused |
| Gate 1B.5 membership + physical freeze | Immutable input |
| `src/services/knapsackEngine.ts` route optimizer + synthetic ChronoWorth | **Not used** for Gate 2A NodeUtility (deprecated for this contract path) |
| `src/engine/**` | **New** eligibility / scoring / candidates / fixtures |

---

## Score model

Domain **0–100**. Caps: editorial 30 · interests 40 · structural 15 · discovery 10 · context 5.  
Constants: `src/engine/scoring/constants.ts`.  
Tie-break: utility desc, then canonical `STGO_XX` asc.

ChronoWorth: field exists, **0/30 launch present** → missing provenance; role soft signal only; never synthesized from physical/popularity.

---

## Launch data completeness (audit)

| Field | Complete | Partial | Missing |
|---|---:|---:|---:|
| Runtime physical eligibility | 30 | 0 | 0 |
| ChronoWorth | 0 | 0 | 30 |
| Themes T1A–T9 | 30 | 0 | 0 |
| Modes M1–M5 | 0 | 30 | 0 |
| Editorial role | 30 | 0 | 0 |
| Visit duration | 0 | 0 | 30 |
| Opening hours | 0 | 0 | 30 |
| Accessibility | 0 | 0 | 30 |
| Cost/budget | 0 | 0 | 30 |
| Provenance block | 30 | 0 | 0 |

Deliberately **not fabricated:** ChronoWorth, visit time, openings, accessibility, culinary T2, NarrativeEdgeScore, physical-centrality quality.

---

## Candidate pool QA

Launch evaluated: **30**.  
Typical eligible: **28** (excludes STGO_23, STGO_33).  
Backlog in pool: **0**.  

Fixture highlights (see `docs/engine/gate-2a-fixture-scores.json`): civic/history ranks Plaza de Armas / T1A–T3 anchors highly when tags support it; memory fixture surfaces T1B nodes with opt-in; accessibility fixture warns UNKNOWN rather than inventing ACCESSIBLE.

---

## Flags

| Flag | Value |
|---|---|
| `PHYSICAL_LAYER_V0_1_READY` | true |
| `MULTIMODAL_PHYSICAL_GRAPH_READY` | true |
| `PHYSICAL_ROUTE_GENERATION_ENABLED` | false |
| `NODE_UTILITY_V0_1_READY` | true |

---

## Artifacts

- `docs/engine/ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md`
- `docs/engine/GATE_2A_NODE_UTILITY_REPORT.md`
- `docs/engine/gate-2a-node-utility-review.html`
- `docs/engine/gate-2a-data-completeness.json`
- `docs/engine/gate-2a-fixture-scores.json`
- `src/engine/**`
- `scripts/engine/validate_gate_2a.py`
- `src/lib/__tests__/gate2a.nodeUtility.test.ts`

---

## Remaining blockers before Gate 2B

1. Author ChronoWorth for launch nodes (editorial).  
2. Enrich structural modes beyond M3-only.  
3. Author visit durations / openings / accessibility where evidence exists.  
4. Explicit sensitive-memory flags on engine nodes (demo POI flag not yet on STGO JSON).  
5. Taxonomy alignment decision for culinary T2 vs ThemeCode.  
6. Narrative/relational edge model still undefined operationally.

**Not pushed.**
