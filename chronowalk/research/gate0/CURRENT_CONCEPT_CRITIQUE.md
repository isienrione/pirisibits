# CURRENT_CONCEPT_CRITIQUE.md
ChronoWalk 2.0 — Gate 0 · August 2026

An honest critique of the current concept (v1 PWA + Playbook + Pack), written as the founder asked: preserve principles, challenge implementations, surface conflicts instead of silently choosing.

## What the current concept gets deeply right

1. **Category framing.** "Historical Immersion Platform / from sightseeing to city understanding" is genuinely differentiated positioning, not marketing gloss. The Presence Gap is a real, articulable problem.
2. **The claim ledger / editorial rigor system.** Almost no competitor does this. It is simultaneously a quality system, a trust brand asset, and a legal/reputational shield. It should become *visible* product surface, not just internal process.
3. **The repeatable-system framing.** Treating Rome as a lab for a city production system (Foundry) is the correct business architecture. The Knowledge Graph as compounding moat is the strongest long-term idea in the Playbook.
4. **Discipline artifacts.** 80% Rule, 15-point standard, hire-last policy, three-questions-before-hiring — these prevent the classic content-platform death (many mediocre cities).
5. **Honest AI posture.** "AI drafts, humans decide" with named never-automate zones is a defensible editorial position in a market flooding with Wikipedia→LLM→TTS audio tours.

## Where the current concept is weak or at risk

### 1. The PWA ceiling (acknowledged; being replaced)
The v1 PWA cannot deliver the thesis. Background/lock-screen audio reliability, precise heading, camera-based experiences, offline robustness, spatial audio, and App Store presence (where travelers actually look) all argue native. This is already a founder decision for 2.0 — noted here for the record.

### 2. "Presence" is asserted more than designed
The Playbook defines the Historical Presence Score but the *mechanism* of presence is underspecified. Threshold A/B/C tiers exist, but what actually produces the shiver — narrative craft? spatial audio? visual reveal? synchronized arrival? — is unknown. **This is the single most important unknown in the company** and the reason Gate 0 recommends experience prototypes before architecture (see EXPERIMENTS_BEFORE_ARCHITECTURE.md).

### 3. The signature moment is inherited, not proven
"Hold to restore Rome" is a beautiful sentence and an unproven interaction. Camera-up AR in crowded tourist plazas has known failure modes: arm fatigue, social awkwardness, glare, occlusion by crowds, battery/heat, and the deeper problem that *looking at a screen can reduce presence rather than create it*. The Pack itself labels it an example. 2.0 should treat audio-first presence as the robust baseline and visual reveal as a tiered enhancement — then let prototypes decide.

### 4. Underweighted competitive motion
The 2026 landscape is crowding: AI audio-tour generators (low quality, high volume), museum/heritage AR pilots, and platform owners (Google's Geospatial creator tools, Niantic Spatial) commoditizing the tech layer. ChronoWalk's answer — editorial rigor + narrative craft + brand — is right, but the Playbook underestimates how *fast* "good enough" AI tours will get. Speed to a visibly superior experience matters more than the Playbook's calendar implies.

### 5. Single-founder execution risk vs. scope
The Playbook's scope (content system + native app + Foundry + multi-language + partnerships) is a multi-year, multi-discipline program run on founder time + automation. The gates help, but Gate 0 flags: the vertical slice must be ruthlessly small (three Rome stops, one language, one tier fully excellent) or nothing ships.

### 6. Metrics risk: Historical Presence Score is not yet operational
As defined it mixes surveys, behavior, and completion without weights. Fine as a north star; dangerous if used to gate releases before it is instrumented and baselined. Gate 1 should define a v0 measurement protocol (even if it's just structured post-walk interviews with n=10 travelers).

### 7. Monetization friction unexamined for native
Bundle-first ~$12–17 direct pricing meets Apple's IAP rules in 2.0. Options (IAP with 15% SBP rate, external-purchase entitlements in some regions, hybrid web-purchase + app-redeem) each have UX and margin consequences the Playbook (written PWA-first) never had to face. Must be decided at Gate 1; flagged in TECHNICAL_RISK_REGISTER.md.

## Conflicts surfaced (not silently resolved)

| Conflict | Position A | Position B | Recommendation |
|---|---|---|---|
| Delivery | Playbook: PWA-first frugality | Gate 0 brief: real iOS product | Follow the brief (higher authority: founder decision) — but preserve the frugality *principle* via lean native scope |
| Signature interaction | Legacy: camera reveal is the demo | Pack: example, not sacred | Prototype 2–3 presence mechanisms head-to-head before committing engineering |
| Acquisition | Playbook: SEO/web-heavy | Native app reality | Keep web as discovery/content layer; app is the product. Revisit channel mix at Gate 1 |
| Payments | Playbook: Merchant of Record | App Store rules | Undecided — requires dedicated Gate 1 analysis |
