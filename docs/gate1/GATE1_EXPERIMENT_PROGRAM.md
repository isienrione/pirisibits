# GATE1_EXPERIMENT_PROGRAM.md
ChronoWalk 2.0 — Gate 1 · August 2026

The experimental program that will tell us what ChronoWalk 2.0 *should be* before we commit to its architecture. Central question:

> **"What creates the greatest believable historical presence on a real traveler, at a quality and production cost that can eventually support a global product?"**

## Founder corrections incorporated (recorded in DECISIONS.md)

1. **Audio does not gatekeep visual/spatial innovation.** Track A (audio/narrative) and Track B (visual/spatial) are **parallel discovery tracks**. Gate 0's claim "if audio can't manufacture presence, no camera trick will save the product" is retracted as unsupported. The breakthrough may be the *combination* — narrative × place × cinematic audio × spatial audio × reconstruction × camera/CV × AR × interaction × visual transformation.
2. **SwiftUI-native is a hypothesis, not a decision.** Track E evaluates all credible architectures against actual experience requirements; no winner is selected in Gate 1.

## Program structure

| Track | Question | Doc |
|---|---|---|
| A — Audio/Narrative Presence | What does each audio layer (narration → cinematic sound → spatial) genuinely add? | AUDIO_PRESENCE_EXPERIMENTS.md |
| B — Visual/Spatial Threshold | Which reconstruction experience (cinematic then/now → 2.5D camera → true AR → photoreal → invented option) creates believable presence? | SPATIAL_THRESHOLD_EXPERIMENTS.md |
| C — Multi-Era | Is layered time (TODAY→1800→1500→400→125) more powerful than binary then/now — or a gimmick? | MULTI_ERA_EXPERIMENT.md |
| D — Contextual Intelligence | How much context-awareness makes the app feel intelligent without becoming "ChatGPT tourism"? | CONTEXTUAL_INTELLIGENCE_EXPERIMENTS.md |
| E — Platform Capability Matrix | Which architectures can host the winning experience? (No selection yet) | MOBILE_CAPABILITY_MATRIX.md |
| F — Production Economics | What does one additional stop cost per experience tier? | PRODUCTION_ECONOMICS_BY_TIER.md |
| Measurement | Historical Presence Score v0 instrument | HISTORICAL_PRESENCE_SCORE_V0.md |
| Synthesis | How experiment outcomes map to product/architecture decisions | GATE1_DECISION_TREE.md |

## The three Rome test cases (deliberately different reconstruction problems)

- **Pantheon** — structure survives. Reconstruction question: what can we reveal the traveler *cannot already see*? (color, ritual, sound, interior across eras, crowd, light through the oculus) — favors multi-era, audio, interior treatments over geometry rebuilding.
- **Roman Forum** — fragments and ruins. The strongest reconstruction test: can we restore the missing city convincingly enough that the ruins become *legible*? Aggressively tests camera/spatial reconstruction (B2/B3/B4).
- **Colosseum** — monumental scale, missing structures, arena/hypogeum relationships, multiple viewpoints, historical phases. Candidate for flagship true-AR/spatial treatment — the scale-stress test.

## Prototype vs. product rule

Shortcuts are allowed to answer questions; shortcuts are never mistaken for architecture. Manual per-vantage calibration, pre-rendered assets, Wizard-of-Oz context, throwaway players — all legitimate. **Test user value first; engineer scale after.**

## Experiment inventory & recommended order

Phase 0 (desk, this environment, no Rome): 
- **X-A0** audio comparative build (assets & harness) · **X-B1** cinematic then/now build · **X-C1** multi-era layer build (extends B1) · **X-D0** constrained Q&A eval harness · **X-F** economics modeling · **X-E** capability matrix bench probes.

Phase 1 (remote user testing, any city + video-simulated Rome where honest):
- **X-A1/A2/A3** audio ladder test (local landmark stand-in + Rome field later) · **X-B1u** then/now interaction test (works remotely with testers on-screen; weaker but directional) · **X-C1u** multi-era vs binary comprehension test.

Phase 2 (Rome field days — the decisive tests):
- **X-B2** camera-assisted 2.5D at the Forum · **X-B3** anchored AR probe (Pantheon/Forum/Colosseum VPS field protocol) · **X-A3r** spatial audio at real stops · **X-B4** photoreal probe (desk + one field validation) · **X-B5** "Lantern" invented interaction · HPS v0 interviews wrap every field session.

Parallelism: A-track and B-track never block each other. C rides on B1's assets. D and F are desk work throughout. E's bench probes run alongside everything.

## What Gate 1 does NOT do

No consumer app scaffold. No stack selection. No Foundry. No full Rome content. No additional cities. This gate designs and sequences experiments; Gate 2 builds the first ones.
