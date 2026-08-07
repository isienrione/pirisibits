# AUDIO_PRESENCE_EXPERIMENTS.md
ChronoWalk 2.0 — Gate 1 · Track A · August 2026

Track A determines what each audio layer *genuinely adds* — without assuming spatial audio is transformative, and without gatekeeping Track B (founder correction #1).

## The audio ladder

- **A1 — Premium conventional narration.** Best-in-class writing + directed voice. The honest control: this is what a great audio product already is.
- **A2 — A1 + cinematic environmental sound design.** Layered, mixed ambiences of the past (crowd, ritual, construction, animals, acoustics of the intact space) composed like film sound.
- **A3 — A2 + head-tracked spatial audio** where hardware supports it (AirPods-class, CMHeadphoneMotionManager): sounds positioned in real space around the standing traveler; world-locked as they turn.
- **A4 — Identified stronger approach: "Walking Score."** Position- and motion-reactive mixing: the mix evolves continuously with the traveler's movement along an approach path (procession grows as you walk the Via Sacra; the Pantheon's acoustics bloom as you cross the threshold; narration ducks when you stop to look). Presence through *synchronized arrival*, not just positioned sound. Technically: GPS/heading/pedometer-driven mix automation — no camera, no anchoring.

## Experiment X-A (17-point spec, one design covering the ladder)

1. **Hypothesis:** each ladder step adds measurable presence over the previous; the size of each step tells us where audio investment stops paying.
2. **User experience:** tester stands/walks at a real monument, phone in pocket, ordinary earbuds; experiences 2–3 ladder variants (counterbalanced) of the same 4–5 min scene; HPS v0 after each.
3. **Technical implementation:** pre-authored audio scenes; a throwaway iOS player app (any framework) implementing: background playback, head-tracking spatial rendering (PHASE/AVAudioEnvironmentNode), GPS/heading-driven mix automation for A4.
4. **Must build:** the audio scenes (the real work — writing, voice, sound design), the disposable player.
5. **Can fake:** location triggers can be operator-driven (Wizard-of-Oz walk-along); A4's automation can be manually ridden on a phone/laptop by the operator following the tester.
6. **Device requirements:** any iPhone; A3 needs AirPods (3rd gen+/Pro-class). Ordinary consumer hardware is the point.
7. **Rome required?** No for the ladder comparison (any evocative local ruin/monument stand-in works and removes novelty-of-Rome bias). Yes for a confirmation pass at the actual three stops (noise floor, crowds, echo, heat behavior differ).
8. **Historical assets:** one scene per test site through the full pipeline (dossier → claim ledger → scene script → directed voice + sound design). Voice A/B: human narrator vs. directed AI voice — rides along in this experiment.
9. **Implementation difficulty:** Low–Medium (established APIs; craft is the hard part).
10. **Content-production difficulty:** Medium — this is a film-sound production exercise; contractor sound designer likely.
11. **Main technical failure mode:** head-tracking drift/latency making A3 feel broken (sounds swim); earbud diversity (non-AirPods testers lose A3).
12. **Main experience failure mode:** cinematic sound reads as "podcast with effects" rather than *this place* — sound not matching what the eyes see breaks rather than builds presence.
13. **Battery/performance:** trivial (audio-only). Measure anyway across a 2h walk for the record.
14. **Android implications:** A1/A2/A4 fully portable; A3 head-tracking is fragmented on Android (device/bud-specific) — a real finding for Track E.
15. **Success metric:** HPS v0 comparative read per ladder step; forced-choice shares; unprompted presence narratives mentioning *sound* placement/space.
16. **Kill criterion:** if A3 fails to beat A2 on forced choice and Q1 with any consistency, head-tracked spatial is demoted to nice-to-have (not a product pillar). If A2 fails to beat A1, cinematic sound design gets re-crafted once and re-tested before demotion (craft variance, not concept, is the likely cause).
17. **Architecture informed:** how deep native audio integration must go (PHASE, head-tracking, background modes) — a major input to Track E; whether A3 justifies AirPods-conditional features; whether A4's sensor-driven mixing becomes an engine requirement.

## Test conditions checklist (all variants)

Phone in pocket · earbuds (mixed brands logged) · outdoors · interruptions staged (a phone call, a vendor interaction) · airplane-mode run for offline behavior · battery logged over session.

## Relationship to Track B

None of Track A gates Track B. The combined question — does A3-class audio *plus* a B-class visual beat either alone? — is an explicit Phase 2 cell (see SPATIAL_THRESHOLD_EXPERIMENTS.md, combination test X-AB).
