# Verify analytics — manual QA checklist (mobile)

Walk this on a **real phone** (or DevTools device mode + throttling) against a deploy that has `VITE_POSTHOG_KEY` set. Prefer Safari iOS *and* Chrome Android once each.

Use PostHog **Live events** (or Network → `eu.i.posthog.com`) and the in-app DebugPanel (`?debug=1` or 5 taps on the logo).

**Base properties expected on every product `track()` / `capture` event** (unless noted):

| Property | Expected |
|----------|----------|
| `ab_variant` | number (price cents, currently `1499`) |
| `landing_exp_hero` | `'a'` while hero A/B is paused |
| `seconds_since_landing` | integer ≥ 0 |
| `scroll_depth_pct` | 0–100 |
| `max_scroll_pct` | 0–100 (≥ `scroll_depth_pct`) |
| `is_pwa` | boolean |
| `is_ios` | boolean |
| `host` | string (from `track.js` wrapper; always present on `track()` calls) |

Attribution extras appear when the URL has UTMs / click ids (`utm_source`, `gclid`, …).

---

## Prep

1. Clear site data (or use a private tab).
2. Open:  
   `https://<host>/?utm_source=qa_manual&utm_medium=mobile&utm_campaign=verify_analytics&landing_exp_hero=a`
3. Do **not** accept marketing cookies yet — product analytics must still fire.
4. Confirm DebugPanel or Live events shows capture starting within a few seconds.

---

## Step 0 — Cold load

| # | Event | Required key props |
|---|--------|-------------------|
| 1 | `$pageview` (PostHog autocapture) | path `/` |
| 2 | `landing_view` | `source: 'landing'`, `landing_exp_hero: 'a'`, base props |

Optional soon after (timing-dependent): `engaged_heartbeat` at 10s with `seconds_on_page: 10`, `max_scroll_pct`.

---

## Step 1 — Scroll through the story (monuments / demo)

Scroll until the stops / personas / demo area is clearly on screen (~35%+).

| # | Event | Required key props |
|---|--------|-------------------|
| 3 | `scroll_milestone` | `pct: 25` (then later 50 / 75 / 90 / 100 as you go) |
| 4 | `landing_route_view` | `source: 'landing'`, `section: 'monuments'`, `landing_exp_hero` |

---

## Step 2 — Pricing in view

Scroll to `#pricing` and leave it ≥50% visible for ≥1s.

| # | Event | Required key props |
|---|--------|-------------------|
| 5 | `landing_pricing_view` | `section: 'pricing'`, `landing_exp_hero` |
| 6 | `pricing_view` | base props (typed funnel) |
| 7 | `tier_card_view` | `tier` (once per visible tier, e.g. `rome-complete`) |

Guarantee dwell (if shown): `guarantee_view`.

---

## Step 3 — Choose a Rome walk (CTA)

Tap a pricing CTA (e.g. **Choose Roma Eterna** / hotspot).

| # | Event | Required key props |
|---|--------|-------------------|
| 8 | `tier_card_click` | `tier`, `price_eur?` |
| 9 | `cta_click` | `cta_location: 'pricing'`, `tier`, `price_eur?` |
| 10 | `landing_cta_begin` | `section: 'pricing'`, `tier`, `cta: 'begin'` |

Consent sheet opens — do not continue yet; confirm the three events above already landed.

---

## Step 4 — Consent → checkout handoff

Tap **Continue to secure checkout**.

| # | Event | Required key props |
|---|--------|-------------------|
| 11 | `checkout_open` | `section: 'pricing'` *or* `source: 'landing'`, `tier`, `price_cents` |
| 12 | `checkout_open` (second, from `openCheckout` when Paddle is configured) | `source: 'landing'`, `tier`, `price_cents` |
| 13 | `checkout_opened` | when Paddle `checkout.loaded` fires — `tier`, `price_eur?` |

If Paddle is unavailable, expect navigation to `/purchase?tier=…` after the landing `checkout_open`; `checkout_opened` may be absent.

---

## Step 5 — Preview path (separate pass)

Reload landing. Tap the free preview / Pantheon CTA.

| # | Event | Required key props |
|---|--------|-------------------|
| A | `landing_cta_preview` | `section: 'hero'` (or try-free), `cta` / preview fields |
| B | `cta_click` | `cta_location: 'hero'` (Get App / related) if that control is used |
| C | On `/preview`: `preview_start` / `preview_play_click` / `preview_audio_progress` as you play |

---

## Step 6 — FAQ

Open one FAQ question.

| # | Event | Required key props |
|---|--------|-------------------|
| D | `landing_faq_open` | `section: 'faq'`, `question_id` |
| E | `faq_open` | `question_text` |

---

## Step 7 — Engagement / exit (optional timed pass)

Keep the tab visible:

| Time / action | Event | Props |
|---------------|--------|------|
| 10 / 30 / 60 / 120 / 300s visible | `engaged_heartbeat` | `seconds_on_page` = mark, `max_scroll_pct` |
| ≥60s visible **and** ≥50% scroll | `deep_engagement` (once) | `seconds_on_page`, `max_scroll_pct` |
| Switch apps / hide tab | `exit_intent` (once) | `max_scroll_pct`, `seconds_on_page`, `deepest_funnel_step_reached`, `longest_dwell_section?` |
| Close after &lt;15s with &lt;25% scroll | `bounced_fast` | `seconds_on_page`, `max_scroll_pct` |

---

## Step 8 — Marketing consent regression

1. Decline marketing cookies → product events **continue**.
2. Accept marketing → Google Ads / marketing tags may load; product funnel unchanged.

---

## Pass criteria

- [ ] Steps 0–4 event order matches the tables (engagement heartbeats may interleave).
- [ ] Every listed product event includes the base property set.
- [ ] `landing_exp_hero` is `'a'` (paused hero test).
- [ ] `ab_variant` is present and numeric on all product events.
- [ ] DebugPanel “Copy diagnostics” JSON shows the same recent event names.

Automated counterpart: `npm run test:e2e:analytics` (Playwright — `tests/analytics.spec.ts`).
