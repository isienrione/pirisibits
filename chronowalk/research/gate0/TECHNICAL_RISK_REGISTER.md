# TECHNICAL_RISK_REGISTER.md
ChronoWalk 2.0 — Gate 0 · August 2026 · **Updated at Gate 1 (see "Gate 1 revisions" at end)**

Risks ranked by (impact × likelihood), with mitigations and the gate where each must be retired. Complements the strategic risks in Playbook Ch. 42.

| # | Risk | Impact | Likelihood | Mitigation / retirement plan |
|---|------|--------|------------|------------------------------|
| T1 | **Presence doesn't materialize** — Tier A audio in real Rome conditions fails to produce "the place came alive" | Existential | Medium | Experience prototypes *before* architecture (Gate 0 exp. E1); iterate writing/sound craft, not tech. Retire at Gate 2 with n≥15 field interviews |
| T2 | **Outdoor AR reliability at flagship sites** — VPS coverage/accuracy at Pantheon/Forum/Colosseum under crowds, glare, seasonal change | High (Tier B credibility) | Medium-High | Field-test ARKit Location Anchors + ARCore Geospatial + Niantic VPS2 at the actual three stops (E3) before any Tier B commitment; graceful degradation designed first-class |
| T3 | **Battery/heat/data budget** — GPS + audio + occasional AR across a 2–3h Roman summer walk | High (completion rates) | High | Power budget as an engineering KPI from the slice; pocket-first design (Tier A) is inherently battery-light; AR sessions time-boxed |
| T4 | **App Store payments vs. bundle margin model** — IAP commission and rules vs. the Playbook's MoR direct-margin assumptions | High (unit economics) | Certain (must be decided) | Dedicated Gate 1 analysis: IAP small-business 15% vs. external-purchase options (region-dependent, evolving EU/US rules in 2026) vs. hybrid web-purchase. Update the financial model before pricing decisions |
| T5 | **Per-city frontier asset cost** — Tier B/C reveals & reconstructions too expensive to repeat per city | High (scaling thesis) | Medium | Cost-per-asset modeled during the slice; stylization and tooling amortization strategies; Tier C limited to 1–3 sites by design |
| T6 | **Vendor dependency for VPS** — Google/Niantic pricing, ToS, or service changes | Medium-High | Medium | Abstraction layer over anchoring providers; site-scan data ownership where possible; degradation path to GPS+heading always exists |
| T7 | **Rigor breach via AI runtime features** — a hallucinated answer in a Q&A feature destroys the trust brand | High | Medium if built carelessly | Claim-ledger-constrained retrieval only; refuse-outside-corpus behavior; ship Q&A late, after the corpus and eval harness exist |
| T8 | **Solo-founder platform sprawl** — native app + Foundry + pipeline exceeds sustainable scope | High | High | Ruthless slice scope (3 stops, 1 language, Tier A excellent + 1 Tier B); Foundry stays documents+scripts until friction demands software; contractors for asset production |
| T9 | **Offline robustness** — packs, maps, and triggers failing without connectivity in stone-heavy areas | Medium | Medium | Offline-first pack architecture from the slice; field-test with airplane-mode walks |
| T10 | **Android debt** — iOS-first choices that make Android a rewrite | Medium | Medium | Stack decision (Gate 1) weighs shared-core options; content/pack format is platform-neutral by construction |
| T11 | **GPS canyon effects in dense centro streets** for non-flagship stops | Medium | Medium-High | Trigger design tolerant of 10–20 m error (approach zones, not points); heading-based disambiguation; never make a Threshold depend on precise GPS alone |
| T12 | **AI-voice uncanny/flatness harming Tier A presence** | Medium | Medium | A/B human vs. directed-AI narration in E1; voice is an editorial casting decision per Playbook, not a cost default |

## Gate 1 revisions (August 2026)

- **T1 reframed.** "Presence doesn't materialize" is no longer an audio-only gate (founder correction #1). The risk now reads: *no experience variant — audio, visual, or combination — produces reliable presence.* Retired only by the full Track A + Track B + X-AB program, not by E1/X-A alone.
- **T-new-13: Premature architecture convergence.** Gate 0's SwiftUI leaning was itself a risk instance (founder correction #2). Mitigation: Track E matrix without winner selection; all Gate 2 prototypes explicitly throwaway; stack decision deferred to end of Gate 2 with the evidence procedure in GATE1_DECISION_TREE.md.
- **T-new-14: Stand-in-site validity.** Phase 1 economy relies on non-Rome test sites predicting Rome responses (A-15). Mitigation: shared variants re-run on Rome field days; divergence is itself a finding.
- **T-new-15: Experiment-program sprawl.** Six tracks could consume months. Mitigation: strict phase structure (desk → remote → 2 concentrated Rome field trips); everything possible rides along on shared field days; kill criteria enforced.
- **T2, T5, T7, T12** now carry named experiments (X-B3, X-B4/Track F, X-D0, voice A/B in X-A) with kill criteria — see docs/gate1/.

## Risks accepted deliberately (per Playbook risk philosophy)

- Investing in frontier prototypes that may be discarded (E-series) — that is their purpose.
- iOS-only launch window while Android waits — focus beats coverage at this stage.
- Dependence on Apple platform APIs for differentiating features — mitigated by the fact that the *content system* (the real asset) is platform-neutral.
