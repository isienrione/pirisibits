# CONTEXTUAL_INTELLIGENCE_EXPERIMENTS.md
ChronoWalk 2.0 — Gate 1 · Track D · August 2026

How much context-awareness makes ChronoWalk feel intelligent — without becoming "ChatGPT tourism." Hard constraint across all of Track D: **every historical response is constrained by approved evidence (the claim ledger).** An unconstrained model never speaks history in this product.

## Context signals available (cheap → expensive)

location · current stop · heading (direction facing) · route progress · time available · previous stories heard · active reconstruction/beam target · question asked · what the camera sees.

## D1 — Contextual historical Q&A (X-D0/X-D1)

1. **Hypothesis:** ledger-constrained Q&A answers ≥90% of real traveler questions at a stop either correctly-with-confidence-framing or with a graceful, in-voice refusal — with zero hallucinated claims.
2. **User experience:** mid-walk, the traveler asks by voice ("who actually built this?", "is the gladiator movie accurate?"); the answer arrives in the product's narrative voice, cites its certainty ("historians still argue…"), and declines gracefully outside its corpus ("that story isn't in this walk yet — but here's what we do know…").
3. **Technical implementation:** retrieval over the stop's dossier + ledger; generation with strict grounding; two engine arms — on-device (Apple Foundation Models; offline, private) vs. server LLM (quality ceiling) — same corpus, same eval.
4. **Must build:** eval harness (notebook-level): E1's Pantheon ledger corpus + 60 questions (40 in-corpus, 20 traps including plausible-falsehoods and adjacent-history bait).
5. **Can fake:** everything user-facing — Phase 0 is a pure desk eval; live voice UX comes later, Wizard-of-Oz if user-tested at all in Gate 2.
6. **Device requirements:** Apple Intelligence-class device for the on-device arm.
7. **Rome required?** No.
8. **Historical assets:** one complete stop ledger (shared with Track A/B production).
9. **Implementation difficulty:** Low (harness) / Medium (production behavior later).
10. **Content difficulty:** none extra — reuses the ledger, which is the point: rigor pays twice.
11. **Technical failure mode:** hallucination under paraphrase pressure; refusal over-firing until the product feels dumb.
12. **Experience failure mode:** breaking narrative spell — Q&A that turns a crafted walk into a chatbot session ("ChatGPT tourism"). Mitigation to test later: Q&A only *between* scenes, answers in scene voice.
13. **Battery/performance:** minor (on-device arm measured).
14. **Android implications:** on-device arm is Apple-specific; Android needs Gemini Nano-class or server fallback — Track E datum.
15. **Success metric:** hallucination rate = 0 on trap set; ≥90% useful-answer-or-graceful-refusal on in-corpus set; on-device vs. server quality gap quantified.
16. **Kill criterion:** any hallucinated historical claim surviving grounding tuning → feature deferred until the eval passes; product ships without Q&A rather than with unsafe Q&A (I2).
17. **Architecture informed:** on-device AI dependency, ledger data model (retrievability becomes a schema requirement), Android AI path.

## D2 — "What am I looking at?" camera assistance (X-D2)

- **Hypothesis:** heading + position against a per-stop *sightline map* (authored bearing ranges → named features) answers "what am I looking at?" reliably **without any computer vision** — camera-based recognition is only needed if this fails.
- **Smallest experiment:** on B2/B5 field days, log heading whenever testers ask "what is that?"; check offline whether the sightline map would have answered. Zero build beyond logging.
- **CV escalation (only if needed):** on-device recognition against reference captures of the stop's features — `needs prototyping`, Gate 2+.
- **Kill criterion:** if sightline maps answer <70% of real questions, the cheap path fails and CV gets a real probe.
- **Architecture informed:** whether the content model needs authored sightline maps per stop (cheap, Foundry-side) vs. a CV pipeline (expensive, engine-side).

## D3 — Adaptive explanation by physical viewpoint (X-D3)

- **Hypothesis:** narration that acknowledges where the traveler actually stands/faces ("from here you can just see…") measurably increases presence over fixed narration.
- **Smallest experiment:** rides inside Track A's X-A4 (Walking Score) — two versions of one scene, viewpoint-aware vs. fixed, HPS comparative. No new build.
- **Kill criterion:** no Q1/Q4 lift → viewpoint-awareness is production cost without payoff; drop.

## D4 — Intelligent re-routing without destroying authored narrative (X-D4)

- **Hypothesis:** travelers need *resequencing* (time pressure, closures, crowds) but authored scene integrity must survive it; the right model is scenes-as-self-sufficient-units + a router that re-orders and re-bridges, never rewrites.
- **Smallest experiment:** paper/Wizard-of-Oz on X-A/X-B field days: operator simulates "you only have 40 minutes" resequencing mid-walk; measure completion, confusion, and whether narrative payoffs still land (comprehension block).
- **Kill criterion:** none (this is a design-learning probe); the finding shapes the content model either way.

## D5 — More powerful concept: **"The Thread"** (proposed)

Context accumulated *across stops* becomes narrative memory: the walk knows what you've already felt ("remember the procession you heard at the Forum? It ended here."). Cross-stop callbacks are cheap (authored conditionals on route progress + stories-heard), emotionally compounding, and unique to a walk that knows your path — no LLM required, pure authored intelligence over context signals.
- **Smallest experiment:** one authored callback pair in the Phase 2 walk; check whether testers spontaneously mention it (they will or they won't — the cheapest possible signal).
- **Architecture informed:** listening-history as first-class state in the content/runtime model.

## Track D posture

D is deliberately the *cheapest* track: one desk harness (D1), and everything else rides along on A/B field days as logging, Wizard-of-Oz, or authored variants. Intelligence in ChronoWalk should feel like a guide who knows where you are and what you've seen — not a chatbot with a view.
