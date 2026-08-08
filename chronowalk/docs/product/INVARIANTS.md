# INVARIANTS_AND_REPLACEABLE_ASSUMPTIONS.md
ChronoWalk 2.0 — Gate 0 · August 2026

The Playbook is a **constitution, not a technological ceiling**. This document separates what must survive every redesign from what may — and in some cases should — be replaced in the 2.0 rebuild.

## A. Invariants (constitutional — never trade away)

| # | Invariant | Source | Practical consequence |
|---|-----------|--------|----------------------|
| I1 | The city is the protagonist | Pack | UI recedes; no gamified point-farming; no app-first branding moments during the walk |
| I2 | Historical rigor with claim classification | Playbook Ch. 7, Pack | Every published sentence traceable to an evidence dossier; confidence classes surface honestly in-product |
| I3 | Traveler freedom (self-paced, non-linear, interruptible) | Playbook, Pack | No forced routes, no timed sessions, resume-anywhere; offline tolerance is a design requirement |
| I4 | Quality gates before scale (15-point standard, 80% Rule) | Playbook Ch. 36–37 | Nothing ships that weakens the brand; city #2 waits for Rome's system proof |
| I5 | Technology serves the story | Playbook, Pack | Every frontier feature must raise Historical Presence Score or it doesn't ship |
| I6 | Emotion never built on falsehood | Playbook Ch. 7 | Dramatizations are labeled; legends are framed as legends |
| I7 | City-agnostic architecture | Pack | No `RomePage.tsx` patterns; Rome is configuration + content, never code |
| I8 | Frugality & founder-financed discipline | Playbook Ch. 15–16 | No architecture that presumes venture-scale infra spend; unit economics per city must close |
| I9 | Systems before hires; documentation as an asset | Playbook Ch. 35, 40 | Pipeline, prompts, QA, decisions all documented; Foundry/CMS thinking from day one |
| I10 | Never fully automated: narrative choice, quality standard, sensitive-fact verification, emotional design, strategy | Playbook Ch. 34 | AI drafts and assists; the human editorial gate is structural, not optional |

## B. Replaceable assumptions (challenge in 2.0)

| # | Legacy assumption | Status in 2.0 | Rationale |
|---|-------------------|---------------|-----------|
| R1 | **PWA-first delivery** | **Replace.** 2.0 is explicitly a real native-class mobile product, iOS first | Founder decision in the Gate 0 brief; the Playbook's PWA reflects v1 constraints, not the vision. Camera, precise location, spatial audio, background audio, offline packs all favor native capability |
| R2 | **"Hold to restore Rome" camera reveal as *the* signature interaction** | Example, not sacred (Pack says so explicitly) | Threshold tiers A/B/C are the frame; the specific gesture/reveal should be won in prototyping, not inherited |
| R3 | Audio-dominant experience with static imagery | Open to evolution | Spatial audio, live camera overlays, splat reconstructions are all candidates — gated by I5 and battery/heat/attention reality |
| R4 | Web SEO as a primary acquisition surface for the *product itself* | Partially replaceable | SEO/content remains an acquisition moat, but the product no longer needs to *be* a website to serve it; a companion web layer can exist for discovery |
| R5 | Merchant of Record (Lemon Squeezy/Paddle) | Reconfirm per platform | iOS App Store distribution changes the payments/commission calculus (IAP rules, EU alternative terms). Must be re-decided at Gate 1+, not assumed |
| R6 | Specific stack choices in legacy artifacts (React PWA, etc.) | Fully replaceable | Legacy artifacts are the lowest tier in the source-of-truth hierarchy |
| R7 | Content stored as flat scripts per stop | Replace with structured content model | Knowledge Graph + claim ledger + scene/beat model enables reuse, multi-language, and future adaptivity (Playbook Ch. 34 endorses this direction) |
| R8 | Distribution via marketplaces/OTAs as primary channel | Re-evaluate for a native app | App Store discovery, partnerships, and OTA dynamics differ; keep multi-channel principle (risk table Ch. 42), rework the mix |

## C. Tensions between invariants (must be managed, not resolved by fiat)

1. **I2 rigor vs. presence-driven emotion (I5).** The most emotionally powerful reconstructions are the least certain. Resolution pattern: confidence-honest presentation ("we believe / sources disagree / legend says") can itself be a differentiating, trust-building narrative voice — but this must be *tested*, not assumed.
2. **I3 traveler freedom vs. crafted narrative arcs.** Non-linear entry breaks setup/payoff structures. Requires a content model with self-sufficient scenes plus optional arc threads — a real design problem for Gate 2.
3. **I8 frugality vs. frontier tech (splats, VPS, on-device ML).** Capture, processing, and per-city calibration of frontier assets cost real money per city. Every frontier tier must have a cost-per-city model before adoption.
4. **I4 quality gate vs. iOS-first speed.** Native excellence is slower to build than a PWA iteration. The 80% Rule applies to cities, but a version of it must apply to the vertical slice: don't widen before the three Rome stops are extraordinary.
5. **I7 city-agnostic vs. site-specific magic.** The best Threshold moments may exploit unique geometry of the Pantheon oculus. Pattern: city-agnostic *engine*, site-specific *content and calibration data* — the line between the two is an architectural decision for Gate 1.
