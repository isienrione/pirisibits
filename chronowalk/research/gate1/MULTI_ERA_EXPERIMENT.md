# MULTI_ERA_EXPERIMENT.md
ChronoWalk 2.0 — Gate 1 · Track C · August 2026

Is layered time (TODAY → 1800 → 1500 → AD 400 → AD 125) more powerful than binary then/now — or a gimmick? Design for the smallest experiment that answers it.

## Why it might be powerful

Binary then/now says "it was different." Layered time shows *process* — the Forum filling with churches, quarried into palaces, excavated back. Comprehension ("I understand what happened here") may be the real product ("city understanding"), and process is what makes ruins legible. The Pantheon variant is especially strong because the *building* barely changes while everything around and inside it does — multiple eras reveal what reconstruction-of-geometry cannot.

## Why it might be a gimmick

Cognitive load: five layers × unfamiliar history may produce scrubbing-as-toy, zero retention. Production cost multiplies per era. Authored narrative (setup→peak→meaning) fragments across layers.

## Experiment X-C1 (17-point spec)

1. **Hypothesis:** a small number of *authored* eras (3–4, each with one narrative beat) increases comprehension and presence over binary then/now; free-scrubbing many eras does not.
2. **User experience:** at a fixed vantage (screen-based; extends X-B1's cinematic then/now), three variants: (a) binary then/now; (b) 4 authored eras, each entered through a narrated beat ("guided descent through time"); (c) same 4 eras, free scrub slider, minimal narration. HPS v0 + the "explain to a friend" comprehension score are the key reads.
3. **Technical implementation:** pre-rendered matched-viewpoint era images/parallax layers with crossfade + per-era soundbed; simple scrub/hold interactions. No AR, no anchoring.
4. **Must build:** era artwork for ONE vantage (the expensive part), a simple interactive player.
5. **Can fake:** eras beyond the flagship vantage; historical accuracy at *sketch* fidelity for non-final eras (labeled as prototype art internally; still ledger-reviewed for gross errors).
6. **Device requirements:** any modern phone.
7. **Rome required?** No — the comprehension question tests anywhere (remote testers can even do it on a screen share, weakest-but-cheapest mode). A Rome confirmation ride-along happens when X-B2 field days run.
8. **Historical assets:** 4-era dossier for one vantage (suggest Pantheon piazza or a Forum overlook — the Forum overlook maximizes the legibility question).
9. **Implementation difficulty:** Low.
10. **Content-production difficulty:** High per vantage (4× era art + research) — this is exactly what Track F must price.
11. **Main technical failure mode:** none serious (pre-rendered).
12. **Main experience failure mode:** era soup — testers scrub, grin, remember nothing; or eras contradict what the eyes see, breaking trust.
13. **Battery/performance:** negligible.
14. **Android implications:** none (pure rendering/UI).
15. **Success metric:** comprehension score (coded "explain to a friend" accuracy) and Q2 ("I could understand what used to be here") vs. binary variant; forced choice.
16. **Kill criterion:** if authored-eras (b) does not beat binary (a) on comprehension, multi-era is shelved as a content-cost multiplier without payoff. If (b) beats (a) but free-scrub (c) doesn't, the finding is "eras are narrative, not a slider" — a UI law, not a kill.
17. **Architecture informed:** content model (scene → era-layer structure), asset pipeline requirements, and whether the engine needs a temporal state machine — impacts Foundry design more than app architecture.

## Deliberate scope limits

One vantage. No walking-between-eras, no era-anchored AR (that combination belongs to Gate 2+ only if both X-C1 and X-B3 succeed independently).
