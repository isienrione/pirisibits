# GATE1_DECISION_TREE.md
ChronoWalk 2.0 — Gate 1 · August 2026

How experiment outcomes map to product and architecture decisions. No outcome is pre-judged; the tree exists so results convert to decisions without re-litigating strategy each time.

## The central comparisons

```
                    ┌─ X-A ladder ─────────── how far audio investment pays
 PRESENCE ENGINE ───┤
                    ├─ X-B1 vs audio control ─ do visuals add presence at all (screen)?
                    ├─ X-B2 vs X-B1 ────────── is the LIVE CAMERA premium real?
                    ├─ X-B3 vs X-B2 ────────── is TRUE ANCHORING worth its cost/fragility?
                    ├─ X-B5 vs X-B2 ────────── is aimed discovery > whole-scene reveal?
                    ├─ X-B4 vs video ───────── does photoreal tech buy anything handheld?
                    ├─ X-C1 ────────────────── are eras narrative gold or gimmick?
                    └─ X-AB ────────────────── is the combination super-additive? (founder hypothesis)
```

## Outcome → product shape

| Evidence pattern (HPS v0 triangulated) | Product consequence | Architecture consequence |
|---|---|---|
| Audio ladder strong; B-track adds little over B1 | ChronoWalk = presence-audio product + cinematic vantages; visual tiers stay marketing moments | Cross-platform layers (RN/FL) become genuinely viable; native audio modules only |
| B2/B5 live-camera premium is real; B3 unstable | Tier B = camera-assisted 2.5D (+Lantern); true AR deferred, revisited yearly | Deep native camera/CV/GPU required → N, KMP, or SHELL; module-tax probes decide if RN survives |
| B3 stable AND presence premium over B2 | Flagship anchored-AR moments become the category bet (1–3/city) | Native AR stack mandatory; VPS provider choice (Google vs Niantic) shapes Android path; HYB/Unity-as-library evaluated only if Niantic wins |
| X-AB super-additive (combo > best single) | The Threshold = orchestrated audio+visual peak; production always pairs sound design with reveals | Engine needs synchronized audio/visual scene runtime — a content-model requirement above any stack |
| X-C1 authored eras lift comprehension | Multi-era becomes a premium-stop pattern; Foundry gets era-layer support | Temporal state machine in content runtime |
| X-B4 indistinguishable from video handheld | Photoreal pipeline shelved until anchoring makes viewpoints free | No Metal-splat module requirement yet |
| D1 eval passes with zero hallucination | Constrained Q&A ships as a differentiator ("rigor as a feature") | Ledger schema gains retrieval requirements; on-device AI dependency accepted (Apple) with Android fallback plan |
| D1 eval cannot reach zero | Q&A cut from launch scope without regret | — |

## Kill-criteria discipline

Each experiment doc carries its own kill criterion referencing HPS v0's triangulated read (forced choice + Q1 + unprompted narratives) — never a single arbitrary percentage. A killed feature is recorded in DECISIONS.md with its evidence; "revisit when X changes" is a legitimate verdict (esp. B3/B4, which track fast-moving tech).

## Stack decision procedure (end of Gate 2)

1. Take the winning experience bundle (which tiers/features are in the launch product).
2. Extract its hard native requirements from the matrix rows that actually matter now.
3. Read E-probe results (RN module tax, SHELL pack-format spike, KMP overhead).
4. Choose the *simplest architecture that does not cap the winning experience* — cross-platform convenience must not cap quality; native depth must not be bought where the experience doesn't need it.
5. Record in DECISIONS.md with the evidence trail; Android path must be stated in the same decision (no company rebuild).

## What would trigger a Gate 1 re-run

- All B-track variants failing against audio controls **and** X-AB showing no combination effect (would force a fundamental product-shape question back to the founder).
- A platform shift (e.g., consumer AR glasses inflection) invalidating the phone-centric experiment frame — watched, not assumed.
