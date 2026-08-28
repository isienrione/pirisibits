# ChronoWalk Engine Documentation Index

Canonical hierarchy for Santiago engine design, gates, and forward-looking contracts.

---

## 1. Core implementation contracts

| # | Document | Status | Description |
|---|---|---|---|
| 1 | [ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md](./ENGINE_V0_1_IMPLEMENTATION_CONTRACT.md) | **CANONICAL (V0.1 runtime)** | Staged pipeline, NodeUtility, eligibility, V0.1 value separation |
| 2 | Physical Graph V0.1 | **FROZEN (Gate 1B.5)** | Artifacts under `src/data/santiago/santiago_physical_*.v0.1.json`; no standalone contract markdown yet |
| 3 | **[ENGINE_SCORING_AND_COMPOSITION_V0_2.md](./ENGINE_SCORING_AND_COMPOSITION_V0_2.md)** | **CANONICAL (forward-looking design)** | Scoring layers, MarginalRouteValue, multi-lane composer, explainability — **NOT IMPLEMENTED** |

> **Important:** V0.1 runtime behavior is defined by (1) and gate reports below. Document (3) is the **canonical forward-looking scoring contract** for the next iteration. Do not describe V0.1 runtime as V0.2.

---

## 2. Gate reports — node & editorial layer

| Gate | Document |
|---|---|
| 2A NodeUtility | [GATE_2A_NODE_UTILITY_REPORT.md](./GATE_2A_NODE_UTILITY_REPORT.md) |
| 2A.1 Editorial calibration | [GATE_2A1_EDITORIAL_CALIBRATION_REPORT.md](./GATE_2A1_EDITORIAL_CALIBRATION_REPORT.md) |
| 2A.1R Source restoration | [GATE_2A1R_SOURCE_RESTORATION_REPORT.md](./GATE_2A1R_SOURCE_RESTORATION_REPORT.md) |
| 2A.1R UI founder cockpit | [GATE_2A1R_UI_FOUNDER_COCKPIT_REPORT.md](./GATE_2A1R_UI_FOUNDER_COCKPIT_REPORT.md) |

---

## 3. Gate reports — narrative & routing

| Gate | Document |
|---|---|
| 2B Narrative graph | [GATE_2B_NARRATIVE_GRAPH_V0_1.md](./GATE_2B_NARRATIVE_GRAPH_V0_1.md) |
| 2C Route composer | [GATE_2C_ROUTE_COMPOSER_V0_1.md](./GATE_2C_ROUTE_COMPOSER_V0_1.md) |
| 2D ArcQuality + reranker | [GATE_2D_ARCQUALITY_RERANKER_V0_1.md](./GATE_2D_ARCQUALITY_RERANKER_V0_1.md) |
| 2E Route Lab | [GATE_2E_ROUTE_LAB_V0_1.md](./GATE_2E_ROUTE_LAB_V0_1.md) |

---

## 4. Architecture decisions

| ADR | Title |
|---|---|
| [ADR-001](./decisions/ADR-001-separate-static-traveler-and-marginal-route-value.md) | Separate intrinsic worth, traveler match, and marginal route value |

---

## 5. Developer tools

| Tool | Entry |
|---|---|
| Route Lab (embedded) | `docs/engine/gate-2e-route-lab.html` |
| Route Lab serve | `npm run gate:2e:serve` → `http://localhost:8791/dev/route-lab` |
| Founder calibration cockpit | `docs/engine/gate-2a1-founder-calibration-cockpit.html` |

---

## 6. Recommended reading order

1. **ENGINE_V0_1_IMPLEMENTATION_CONTRACT** — what runs today  
2. **PHYSICAL_GRAPH_V0.1** artifacts + Gate 1B.5 freeze validators  
3. **ENGINE_SCORING_AND_COMPOSITION_V0_2** — where the engine is going  
4. Gate 2A → 2B → 2C → 2D → 2E reports in sequence  
5. ADR-001 for the core V0.2 design decision  

---

## 7. Flags quick reference (observability)

| Flag | Typical value |
|---|---|
| `PHYSICAL_ROUTE_GENERATION_ENABLED` | `false` |
| `EDITORIAL_CALIBRATION_CURATOR_APPROVED` | `false` |
| `ROUTE_COMPOSER_V0_1_PROVISIONAL_READY` | `true` |
| `ARC_QUALITY_V0_1_PROVISIONAL_READY` | `true` |
| `ROUTE_LAB_V0_1_READY` | `true` |
| `ROUTE_LAB_GEOGRAPHIC_QA_READY` | `true` |

No V0.2 scoring implementation flag exists until a future implementation gate explicitly adds one.
