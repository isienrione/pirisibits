# EXPERIMENTS_BEFORE_ARCHITECTURE.md
ChronoWalk 2.0 — Gate 0 · August 2026

The experiments that must run before any architecture, stack, or content-volume commitment. Each retires a named risk (see TECHNICAL_RISK_REGISTER.md) and has a kill/keep criterion. Prototypes are disposable by design.

## Principle

The company's biggest unknown is not technical — it is whether we can reliably *manufacture the feeling of presence*. Architecture built before that question is answered will be architecture for the wrong product.

## E1 — The Presence Test (Tier A, the first and most important experiment)

- **Question:** Can world-class writing + directed voice + sound design (+ head-tracked spatial audio variant) make ≥70% of testers report a moment where "the place came alive" — phone in pocket?
- **Build:** One Rome stop (suggest Pantheon exterior→interior) scripted through the full pipeline (dossier → ledger → scene → directed audio). Two audio variants: (a) flat stereo, (b) head-tracked spatial. Delivered via any throwaway player — no product code.
- **Also A/B:** human narrator vs. directed AI voice (retires T12).
- **Retires:** T1, T12. **Kill/keep:** if neither variant produces presence, the problem is craft — iterate writing/sound before touching any other tier.

## E2 — The Interruption Walk (Tier A robustness)

- **Question:** Does the scene model survive real traveler behavior — pausing for gelato, wrong approach direction, skipping stops, airplane mode?
- **Build:** Three-stop walk logic (geofence triggers, resume, reorder) as the crudest possible harness.
- **Retires:** parts of T3, T9, T11. **Kill/keep:** trigger design must feel like invitation, not nagging, at 10–20 m GPS error.

## E3 — Anchoring Reality Check (Tier B feasibility)

- **Question:** At Pantheon, Forum, and Colosseum vantage points, which of ARKit Location Anchors / ARCore Geospatial / Niantic VPS2 give stable sub-meter anchoring, at what times of day, at what crowd levels?
- **Build:** Thin test apps per SDK logging accuracy/stability; a field-day protocol (morning/noon/dusk; weekday/weekend).
- **Retires:** T2, informs T6. **Kill/keep:** if no provider is stable at any flagship stop, Tier B pivots to fixed-orientation composites (still shippable) and VPS re-enters later.

## E4 — The Reveal Prototype (Tier B interaction)

- **Question:** Which reveal interaction actually adds presence beyond Tier A audio — slow-press restore, time-scrub, dwell auto-reveal, walk-through threshold?
- **Build:** One vantage point, pre-authored reveal composite (no real-time reconstruction needed), 3 interaction variants, tested with real users against an audio-only control.
- **Retires:** the R2 assumption ("hold to restore"). **Kill/keep:** any variant must beat the audio-only control on reported presence — otherwise Tier B is deferred, honestly.

## E5 — Reconstruction Cost Probe (Tier C economics)

- **Question:** What does one photoreal-class reconstruction moment actually cost (artist time, capture, splat/hybrid pipeline, on-device rendering feasibility on 2–3 device generations)?
- **Build:** Desk study + one small commissioned test asset rendered via MetalSplatter-class pipeline. No app integration.
- **Retires:** T5 (partially). **Kill/keep:** produces a cost-per-showcase number for the financial model; no experiential bar at this stage.

## E6 — Constrained Q&A Probe (rigor-safe runtime AI)

- **Question:** Can on-device Foundation Models answer traveler questions *only* from the E1 claim ledger, with acceptable refusal behavior?
- **Build:** Notebook-level eval harness: ledger corpus, 50 traveler questions (including 15 trap questions outside corpus), measured hallucination/refusal rates.
- **Retires:** T7 (design phase). **Kill/keep:** any hallucinated historical claim = feature deferred until the eval passes.

## Sequencing & gating

```
E1 (presence) ──► E2 (walk)  ──► informs Gate 1 product scope
E3 (anchoring) ─► E4 (reveal) ─► informs Gate 1 tier commitments
E5, E6 run as low-cost probes in parallel, informational only
```

- **E1 is the gate.** Nothing else matters if presence can't be manufactured. E3/E4 may run in parallel *only* because they are cheap field tests, not builds.
- Stack choice (MOBILE_PLATFORM_OPTIONS.md) is made **after** E1–E4 reveal how much native depth the winning experience requires.
- Every experiment logs to ASSUMPTIONS.md / DECISIONS.md per the Pack's ongoing-docs requirement.

## What we deliberately do NOT experiment with yet

Adaptive routing, real-time translation, Android, city #2 tooling, Foundry UI, marketplace distribution — all downstream of a proven presence engine.
