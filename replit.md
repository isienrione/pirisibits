# ChronoWalk 2.0

## Project overview
Greenfield rebuild of ChronoWalk — a premium **Historical Immersion Platform** for travelers ("from sightseeing to city understanding"). iOS-first native mobile product, Android next, eventually 100+ cities. Rome is the laboratory (vertical slice: Pantheon, Forum, Colosseum).

**Status: Gate 1 delivered (docs/gate1/) and the Gate 2 execution plan delivered (docs/gate2/: experiment matrix, frozen HPS v0 instrument, Rome trip GO/NO-GO gate, build order + 7-day plan) — August 2026, awaiting founder approval. Nothing is built yet — no stack chosen, no scaffolding, no content generated. Do not build until the founder approves the Gate 2 plan.**

## Gated process (strict)
The founder runs a gated process (Gates 0–9, defined in the Master Pack). Never skip ahead of the approved gate. Gate 0 deliverables live in `docs/gate0/` (11 analysis documents).

## Source-of-truth hierarchy
1. Founder Playbook (Spanish PDF in `attached_assets/`, extracted at /tmp/playbook.txt during Gate 0) — the "constitution"
2. Replit Master Pack (`attached_assets/CHRONOWALK_REPLIT_MASTER_*.md`)
3. Founder decisions in chat
4. Legacy artifacts
5. Agent preference (lowest)

The Playbook is a constitution, not a technological ceiling: preserve principles, challenge implementations (e.g., PWA-first is replaced by native iOS in 2.0).

## Product invariants (never violate)
City is the protagonist · historical rigor with claim classification (never Wikipedia→LLM→TTS→publish) · traveler freedom · quality before scale (15-point standard, 80% Rule) · technology serves the story · city-agnostic architecture (no RomePage.tsx patterns) · frugality · AI drafts, humans decide.

## Required ongoing docs (once building starts)
ASSUMPTIONS.md, DECISIONS.md, PRODUCT_DEBT.md per the Master Pack.

## User preferences
- Follow the gated process; stop at gate boundaries for approval.
- Surface conflicts instead of silently choosing.
- Label capabilities honestly: established / needs prototyping / expensive / device-dependent / speculative / not recommended.
