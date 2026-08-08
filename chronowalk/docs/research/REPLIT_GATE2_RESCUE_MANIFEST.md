# Replit Gate 2 rescue manifest

**Salvage type:** documentation / research archive only.  
**Date:** 2026-08-08  
**Rescue source commit:** `9d85bb22` (`origin/replit/gate2-rescue`)  
**Salvage branch:** `cursor/gate2-research-salvage-8ed4`

## 1. Where this material came from

Experimental ChronoWalk 2.0 / Gate 0–2 R&D executed in a separate Replit project, later mirrored on the `replit/gate2-rescue` branch. That work produced claim-ledger methodology, constrained-Q&A (X-D0) evidence, HPS instrumentation, and X-VPG (Control / B1 / Lantern) prototypes — **not** a replacement for production ChronoWalk.

## 2. Why it was preserved

The Replit work incurred significant metered model usage. Frozen datasets, responses, grades, and founder adjudication already answer the Gate 2 questions. Preserving them here prevents accidental regeneration and keeps the intellectual property inside the production repository as **research**, without polluting runtime code.

## 3. What is frozen

| Artifact | Location | Freeze meaning |
|----------|----------|----------------|
| X-D0 dataset v2 | `research/xd0/dataset/cases.v2.frozen.jsonl` + `VERSION.txt` | Authoritative 200-case eval set (sha256 in VERSION.txt) |
| Prompt `constrained_v3` | `docs/research/xd0/PROMPTS_CONSTRAINED_V3_FROZEN.md` | Founder-ratified prompt-only baseline |
| X-D0 run trail | `research/xd0/runs/` | Paid responses/grades/adjudication |
| X-D0 policies + v3 review | `docs/research/xd0/` | Policy + verdict documents |
| HPS v0 instrument | `docs/product/HPS_V0.md` | Frozen measurement instrument |
| X-VPG protocol | `research/gate2/XVPG_PROTOCOL_FROZEN_V1.md` | Frozen study protocol |

## 4. Experiments that must NOT be rerun casually

- **X-D0** (`research/xd0/harness/`): DO NOT RERUN WITHOUT EXPLICIT FOUNDER AUTHORIZATION. Scripts call paid model APIs. Canonical outputs already live under `research/xd0/runs/`.
- Do not regenerate images, audio, or LLM adjudications “to verify files exist.”

## 5. Reference-only assets

- `research/xvpg/art0/` — ART-0 stimulus JPEGs (not production media)
- `research/audio/a1-campidoglio/` — provisional narration prototype
- `research/xvpg/prototypes/` — B1Shell / HPS form (not imported into `src/`)

## 6. Future product candidates (not authorized by this salvage)

These ideas may deserve later implementation tasks; **this commit does not authorize them**:

- Ledger-backed captions / honesty on Threshold
- Structured constrained Q&A (needs claim-ID grounding + verifier)
- Optional Lantern stills reveal mode
- B1 true multi-layer depth (needs real layered art)
- City Graph stop-class routing (extend domain/catalog later)

Production priorities remain: native iPhone reliability, maps, directions, offline, stop experience, audio, Then/Now, outdoor UX, launch reliability.

## 7. Non-authorization statement

Copying these files into `docs/` and `research/` does **not**:

- merge Replit Git history into production
- change production runtime behavior
- replace ADR-001 or other production architecture decisions
- approve shipping Q&A, B1, Lantern, or a ChronoWalk 2.0 greenfield rebuild

Gate 2 Replit decisions/assumptions are preserved separately as:

- `docs/research/REPLIT_GATE2_DECISIONS.md`
- `docs/research/REPLIT_GATE2_ASSUMPTIONS.md`

## 8. Index of important destinations

### Canonical (product / content knowledge)

| Topic | Path |
|-------|------|
| Campidoglio claim ledger | `docs/content/rome/campidoglio-overlook/CLAIM_LEDGER.md` |
| Historical verification method | `docs/content/HISTORICAL_VERIFICATION_METHOD.md` |
| Content + AI pipeline | `docs/content/PIPELINE_AND_AI.md` |
| City Graph strategy | `docs/architecture/CITY_GRAPH.md` |
| Product thesis | `docs/product/PRODUCT_THESIS.md` |
| Invariants | `docs/product/INVARIANTS.md` |
| HPS v0 | `docs/product/HPS_V0.md` |
| X-D0 policies | `docs/research/xd0/XD0_CONSTRAINED_POLICIES.md` |
| X-D0 v3 final review | `docs/research/xd0/XD0_V3_FINAL_REVIEW.md` |
| Frozen v3 prompt | `docs/research/xd0/PROMPTS_CONSTRAINED_V3_FROZEN.md` |
| This manifest | `docs/research/REPLIT_GATE2_RESCUE_MANIFEST.md` |

### Research archives

| Topic | Path |
|-------|------|
| X-D0 dataset | `research/xd0/dataset/` |
| X-D0 runs | `research/xd0/runs/` |
| X-D0 harness | `research/xd0/harness/` |
| X-VPG | `research/xvpg/` |
| Gate 2 protocols | `research/gate2/` |
| Gate 0 / Gate 1 remainder | `research/gate0/`, `research/gate1/` |
| A1 audio prototype | `research/audio/a1-campidoglio/` |

## 9. Explicitly excluded from this salvage

- `artifacts/api-server/**`, `lib/**`
- Generic shadcn UI kit
- `.replit*`, pnpm workspace scaffolding, Replit env files
- Retired ART-0 cutout PNGs
- Greenfield ChronoWalk replacement app scaffolding
- `node_modules`, caches, temporary files
- Any `src/`, `native-review/`, `plugins/`, Supabase, package manifests, or lockfile changes
