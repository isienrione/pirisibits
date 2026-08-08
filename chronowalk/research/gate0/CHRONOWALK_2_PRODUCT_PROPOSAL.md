# CHRONOWALK_2_PRODUCT_PROPOSAL.md
ChronoWalk 2.0 — Gate 0 · August 2026

The product ChronoWalk 2.0 should become — principles preserved, implementations challenged. This is a proposal for founder review, not a build plan.

## Product definition

**ChronoWalk 2.0 is a native iOS experience (Android next) that lets a traveler walk a city freely while the invisible layer of its history becomes perceptible — through masterful narrative audio always, and through progressively deeper sensory tiers (spatial audio, camera reveals, photoreal reconstruction) where they genuinely add presence.**

## The experience spine

1. **Before the walk (anticipation).** Short, cinematic city primer. Download the offline pack. Set language, pace, interests. No accounts required to start feeling value.
2. **The walk (the product).** The traveler roams; the app knows where they are. Approaching a story-place triggers an invitation, never an interruption. Each stop is a self-contained *scene* (setup → presence moment → meaning) of 3–7 minutes, with optional depth branches ("what the sources actually say", "the legend", "what happened here later").
3. **The Threshold moment (the signature).** At flagship locations, one deliberately crafted presence peak per stop — the tiered system below decides its form per site and device.
4. **After the walk (retention).** A "what you now understand" recap, the traveler's walked map, claim-ledger transparency ("what was fact, what was legend"), and the bridge to the next city (TLTV engine).

## Threshold tiers, evolved (see THRESHOLD_EVOLUTION.md for full detail)

- **Tier A — Narrated Presence (robust baseline, every stop, every device).** World-class writing + directed voice + ambient sound design + head-tracked spatial audio where available. Phone stays in the pocket. This tier alone must beat every audioguide on earth.
- **Tier B — Anchored Reveal (practical frontier, flagship stops).** Precise outdoor positioning (VPS-class) aligns a held-up camera view with a historically rigorous visual overlay/reconstruction; interactions like a slow "restore" gesture are candidates, to be won in prototyping.
- **Tier C — Deep Reconstruction (flagship experimental, 1–3 sites per city).** Photoreal 3D reconstruction moments (Gaussian-splat-class rendering) of a lost interior/scene — used sparingly, as the "category-defining" showcase.

Every tier degrades gracefully to the one below; Tier A is never a consolation prize.

## Content & rigor as visible product

- The claim ledger surfaces in-product: subtle confidence framing in narration ("historians still argue about this") and an inspectable "Sources & certainty" sheet per stop.
- Legends and dramatizations are *performed as such* — this is voice, not disclaimer.

## What 2.0 explicitly is NOT

- Not an AR game or scavenger hunt. No points, streaks, or collectibles.
- Not a screen-first experience. The default posture is eyes on the city, phone away.
- Not a content firehose. Three Rome stops (Pantheon, Forum, Colosseum) built to the 15-point standard before anything widens.
- Not committed to any stack, engine, or vendor at Gate 0.

## Business skeleton (unchanged principles, re-platformed)

- Bundle-first pricing (~$12–17 anchor) with a free "first scene" that delivers a genuine presence moment — the demo *is* the marketing.
- Payments architecture (IAP vs. external purchase vs. hybrid) is a Gate 1 decision with margin modeling.
- Rome vertical slice → prove Historical Presence → codify pipeline in Foundry → city #2 per the 80% Rule.

## Success criteria for the vertical slice (proposal)

1. ≥70% of test travelers spontaneously describe a moment where "the place came alive" (structured post-walk interview, n≥15).
2. Completion of the three-stop walk ≥60% in real Rome conditions (heat, crowds, LTE).
3. Tier A works flawlessly offline; Tier B achieves stable anchoring at ≥1 flagship stop in real conditions.
4. The entire slice is produced through the documented pipeline (no hand-crafted one-offs that can't repeat in Florence).
