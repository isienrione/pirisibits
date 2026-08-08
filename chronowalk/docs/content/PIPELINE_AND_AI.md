# HISTORICAL_CONTENT_AND_AI_SYSTEM.md
ChronoWalk 2.0 — Gate 0 · August 2026

The content system is the company. This document evolves the Pack's pipeline (never Wikipedia→LLM→TTS→publish) into the 2.0 content & AI architecture concept.

## The pipeline (human-gated, AI-amplified)

```
1. EVIDENCE DOSSIER (per site/story)
   Primary & scholarly sources, archaeology, iconography — AI-assisted collection,
   human-verified. Nothing enters the system without provenance.
        ↓
2. CLAIM LEDGER
   Every assertable statement classified:
   accepted fact · probable interpretation · hypothesis · reconstruction ·
   legend · dramatized device — each with sources + confidence + license notes.
        ↓
3. NARRATIVE DESIGN (human-led)
   Editorial choice of which stories deserve telling; scene structure
   (setup → arrival → peak → meaning); Threshold tier assignment per stop.
        ↓
4. SCRIPT & SCENE PRODUCTION (AI drafts, human directs)
   Scripts referencing claim-ledger IDs inline — every emotional beat traceable.
   Sound design briefs, visual reconstruction briefs with confidence classes.
        ↓
5. ASSET PRODUCTION
   Directed voice (human or AI voice with human direction + per-language QA),
   ambient design, reveal/reconstruction assets (each visual element tagged with
   its claim confidence → drives the "certain=solid / hypothesis=ethereal" style).
        ↓
6. QA GATES
   Historical review (sensitive claims human-verified — never automated, Ch. 34) ·
   editorial voice check · technical QA · on-location field test · 15-point standard.
        ↓
7. PUBLISH as versioned CITY PACK (offline-capable bundle)
```

## The Knowledge Graph (the compounding moat)

Entities and relations — people ↔ places ↔ events ↔ monuments ↔ eras ↔ works ↔ routes ↔ questions — populated *as a by-product* of dossier/ledger work, not as a separate project. Payoffs, in order of arrival:

1. **Now:** consistency checking (same fact told two ways), reuse across stops and languages.
2. **City #2+:** cross-city production acceleration ("this figure also appears in Florence"), cross-sell narrative bridges (TLTV engine).
3. **Later:** retrieval substrate for constrained Q&A and adaptive walks.

## AI system boundaries (per Playbook Ch. 34)

**AI does:** research collection drafts, script drafts, translations, metadata, QA linting (repetition, coherence, length, flagging *possible* historical errors for human verification), voice synthesis under direction, ops reporting.

**AI never finally decides:** what stories deserve telling · the quality bar · sensitive historical verification · emotional experience design · strategy.

**Runtime AI (in-app), rigor-safe pattern:** any conversational "ask about this place" feature retrieves *only* from the reviewed claim ledger and reconstruction notes for that stop, answers with confidence framing, and refuses beyond its corpus. On-device (Apple Foundation Models) preferred: offline, private, zero marginal cost. Label: `needs prototyping`. Unconstrained generative answers: `not recommended` — they would break I2 in one hallucination.

## Multilingual system

- English first (commercial priority), Spanish second (Playbook Ch. 39), cultural adaptation not mechanical translation.
- AI voice makes per-language marginal cost low; the 80%-rule-for-languages stands: no language ships below the English experience bar. Per-language human QA is a budgeted pipeline stage, not an afterthought.

## Prompt library & Living Manual

Every prompt (research, script, tone, QA, translation) is a versioned asset in the Foundry (I9). Each pipeline stage documents objective, steps, tools, expected time, and KPIs — the Playbook's Manual Vivo, implemented as working software + docs rather than a binder.

## Open questions for Gate 1

1. Claim-ledger data model: granularity (sentence-level vs. claim-level), versioning, and how confidence surfaces in narration scripts.
2. Whether the ledger/graph lives in the Foundry CMS from day one or starts as rigorously structured documents (frugality vs. tooling).
3. AI-voice vs. human-voice for the English flagship: prototype both against presence testing — voice quality is a Tier A presence lever, not a cost line.
