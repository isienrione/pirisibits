# Landing — post-launch A/B plan

**Do not test everything at once.** Run one experiment to a decision, then the next.

Founder promise under test: ChronoWalk does not merely give visitors information about Rome — it changes what they are able to perceive while walking through it.

Provider: PostHog (`LANDING_ANALYTICS.md`). Filter path `/` or `/landing`. Break down by experiment key once flagged (ship flag → property before enabling each test).

---

## Final target page (beat jobs)

The visitor arrives needing something to do in Rome. Each beat has one job:

| # | Beat (live section) | Job |
|---|---------------------|-----|
| 1 | Hero `#top` | Make them **curious** |
| 2 | Cinematic interlude `#interlude` | Make them **feel** something |
| 3 | Threshold `#threshold` | Prove ChronoWalk is **genuinely different** |
| 4 | How it works `#how-it-works` | Remove **confusion** |
| 5 | Real Rome Moments `#real-moment` | Make it **personally relevant** |
| 6 | Route `#monuments` | Prove **substance** |
| 7 | Benefits `#benefits` | Remove **risk** |
| 8 | Preview `#try-free` | Reduce **uncertainty** |
| 9 | Pricing `#pricing` | Make the **choice easy** |
| 10 | Trust `#trust` | Answer **doubts** |
| 11 | After Rome `#after-rome` | Raise **emotional value** |
| 12 | Final CTA `#final-cta` | Close with **memory**, not functionality |

Supporting (keep unless a test kills them): early CTA after Threshold, Why ChronoWalk, FAQ.

Live order already matches this implementation sequence (Act I Promise → Act II Experience → Act III Decision). See `LANDING_EDITORIAL_ARCHITECTURE.md`.

---

## Metric map (shared)

| Plain language | PostHog / events |
|----------------|------------------|
| Preview-start rate | `landing_view` → `landing_cta_preview` → `preview_start` |
| Route-view rate | `landing_view` → `landing_route_view` |
| Checkout-start rate | `landing_view` → `checkout_open` (also track `landing_cta_begin`) |
| Threshold completion | `threshold_demo` `action: complete` ÷ starts (or unique sessions with start) |
| Scroll depth | PostHog scroll-depth / section visibility (`landing_route_view`, `landing_pricing_view` as depth proxies) |
| Preview completion | Preview-app retention (complete free stop) — instrument on `/preview` if not already |
| Paid conversion | `landing_view` → `purchase` |
| Product mix | `landing_cta_begin` / `checkout_open` / `purchase` by `tier` |
| Average order value | Mean `price_cents` on `checkout_open` / `purchase` |
| Checkout conversion | `landing_pricing_view` → `checkout_open` → `purchase` |

---

## Test 1 — Hero positioning

**Question:** Does curiosity-first or clarity-first hero copy start more journeys?

| | Copy |
|-|------|
| **A (control)** | Walk until the city starts talking. |
| **B** | Walk Rome freely—with the history you’d miss on your own. |

**Status: PAUSED 2026-08-02 — insufficient traffic for significance.**  
Pin: `LANDING_EXP_HERO_ENABLED = false` in `landingExperiments.js` forces control **A** for 100% of traffic and clears any persisted `b` assignment.  
Re-enable at >500 clicks/week (flip the constant back to `true`).  
QA override still works: `?landing_exp_hero=a` or `?landing_exp_hero=b`.  
Property on funnel events: `landing_exp_hero` (do not use `ab_variant` — price cents keep firing separately for history).

Default copy in `LANDING_CONTENT.hero.headline` remains A for tests / SEO docs.

**Measure:** Preview-start rate · Route-view rate · Checkout-start rate

**Guardrail:** Keep hero budget (brand + one headline + short support + CTAs). Do not add stats or secondary marketing.

---

## Test 2 — Early Threshold placement

**Question:** Is Threshold proof most powerful right after the emotional cinematic beat, or after How It Works has removed confusion?

| | Order |
|-|-------|
| **A (live)** | Hero → Interlude → **Threshold** → … → How it works |
| **B** | Hero → Interlude → How it works → **Threshold** → … |

**Measure:** Threshold completion · Preview-start rate · Scroll depth · Checkout-start rate

**Implementation note:** Reorder mount in `ChronoWalkLanding.jsx` / `LANDING_SECTION_ORDER` + act markers only — no redesign.

---

## Test 3 — Primary CTA

**Question:** Does a place-specific free offer beat a generic free stop?

| | Label (hero / try-free / sticky where unified) |
|-|------|
| **A (live)** | Try one stop free |
| **B** | Hear the Pantheon free |

**Measure:** Preview-start rate · Preview completion · Paid conversion

**Guardrail:** Keep destination `/preview` (Pantheon). Change label only; do not invent a second free stop.

---

## Test 4 — Pricing order

**Question:** Does featuring Complete first raise AOV without hurting overall checkout conversion?

| | Card order |
|-|------------|
| **A (live)** | Central → Ancient → Complete (`ROME_TIERS` order) |
| **B** | Complete → Ancient → Central |

**Measure:** Product mix · Average order value · Checkout conversion

**Guardrail:** Same prices, copy, and featured badge treatment — order only. Featured styling on Complete may need a conscious keep/drop when it becomes first.

---

## Suggested sequence

1. Resolve **Test 1** (headline) — largest early-funnel leverage.  
2. Resolve **Test 3** (CTA label) — cheap, high signal on preview path.  
3. Resolve **Test 2** (Threshold placement) — structural; needs clean traffic.  
4. Resolve **Test 4** (pricing order) — money mix; run after traffic knows the offer.

Only escalate to a new redesign pass if a winner still underperforms the Founder beat jobs above.
