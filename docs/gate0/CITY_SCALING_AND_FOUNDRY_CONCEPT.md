# CITY_SCALING_AND_FOUNDRY_CONCEPT.md
ChronoWalk 2.0 — Gate 0 · August 2026

How ChronoWalk 2.0 scales from Rome to 100+ cities without losing what makes it special — the Foundry concept evolved.

## The scaling thesis

The product travelers buy is a city experience. The product the *company* builds is a **system that produces extraordinary city experiences with decreasing cost and consistent quality** (Playbook Ch. 38). Rome validates the experience; city #2 validates the system; the Foundry is that system made software.

## The Foundry (production platform / CMS)

The Foundry is the internal platform where the pipeline in HISTORICAL_CONTENT_AND_AI_SYSTEM.md lives:

- **Dossier & claim ledger management** — evidence, classifications, sources, confidence, review status.
- **Knowledge Graph** — entities/relations populated as by-product of production.
- **Scene & script editor** — scripts bound to claim IDs; Threshold tier assignment per stop; sound/visual briefs.
- **Asset pipeline** — voice generation queues, per-language tracks, reveal/reconstruction assets with confidence tags.
- **QA gates as workflow** — 15-point standard, historical review signoffs, field-test checklists; nothing publishes without green gates (quality as compuerta, Ch. 36).
- **City pack compiler** — versioned, offline-capable bundles the app consumes. **The app never knows about cities; it loads packs** (I7).
- **Ops surface** — reviews classification, incident triage, KPI dashboards (the four-layer OS: capture → processing → action → learning, Ch. 35).

## Frugality staging (I8) — the Foundry is grown, not built

| Stage | Foundry form |
|---|---|
| Vertical slice (3 Rome stops) | Structured documents + scripts + a pack compiler script. No UI. Discipline over tooling. |
| Rome complete | The pack compiler + ledger become real software; QA gates become checklists-in-workflow. |
| City #2 (Florence) | Full Foundry v1: whatever friction Rome's production logged, automated per the three-times rule. |
| Wave 2+ | Multi-city dashboards, partner/contractor access, translation pipelines, Knowledge Graph acceleration. |

**Rule:** every Foundry feature must be justified by a documented friction from real production — never built speculatively.

## City-agnostic architecture requirements

1. No city in code — content, calibration data (VPS anchors, vantage points, geofences), pricing, and languages all live in packs/config.
2. Site-specific magic (a Pantheon-specific reveal) is *content*: an asset + calibration data consumed by generic engine capabilities.
3. Per-city cost model tracked from day one: research hours, script hours, voice, reveal assets, field-testing trips, VPS scanning — the Foundry's most important report is **cost & time per city** (Playbook KPI).

## Expansion mechanics (unchanged from Playbook, restated as system constraints)

- **80% Rule** gates city #2: Rome must run nearly alone (economics, reviews >4.7, diversified acquisition, documented processes) first.
- **Waves:** Rome → Italian consolidation (Florence, Venice, Milan, Naples) → European capitals → global. Each city must make the others better (culture principle 9): shared entities in the graph, cross-city narrative bridges, TLTV recommendations.
- **Selection matrix** (Ch. 33/37 factors) drives city choice; the best city is the one that adds most platform value, not the most visited.

## What would break scaling (anti-patterns to watch)

1. Hand-crafted one-offs in Rome that can't repeat (the slice must be produced *through* the pipeline).
2. Threshold tiers whose per-city cost grows linearly with no reuse (reveal/reconstruction tooling must amortize).
3. Foundry-as-product distraction: the Foundry serves the catalog; it is not a SaaS to sell (at least not before the catalog is winning).
4. Language sprawl before the English+Spanish system is excellent.
