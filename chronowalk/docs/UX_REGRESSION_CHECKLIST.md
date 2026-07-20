# ChronoWalk UX Regression Checklist

Use this checklist after meaningful product, routing, audio, or journey changes.

## Dev tester (local only)

1. Run `npm run dev`
2. Open any route — a **QA** pill appears top-right (development only)
3. Use **Personas** for whole-product starting points
4. Use **Journey scenes** to force emotional states at the Colosseum (default QA stop)
5. Use **Routes** to jump directly to screens
6. Work through the sections below manually

The QA panel is mounted only when `import.meta.env.DEV` is true. It is not included in production builds.

---

## A. Landing

- [ ] **Free preview** — “Try the free story” / preview CTA navigates to `/preview`
- [ ] **Paid CTA** — purchase button opens checkout (or `/access` when checkout URL is unset)
- [ ] **Price** — displayed price matches config (`usePrice` / Supabase `app_config`, not hardcoded in the screen)
- [ ] **Media** — hero / demo images load; no blank or broken placeholders on first paint

---

## B. Access

- [ ] **First-time purchase** — after validating access, traveler lands on `/welcome` (not `/begin`)
- [ ] **Returning traveler** — with real in-progress journey, home redirect offers resume via `/begin`
- [ ] **No access** — protected routes redirect appropriately; no dead ends

---

## C. Welcome / setup

- [ ] **Cinematic sequence** — welcome/onboarding plays without layout jumps
- [ ] **Location copy** — permission prompts read human, not technical
- [ ] **Rhythm choice** — classic / heroic / own pace selection persists into My Tour

---

## D. Journey

- [ ] **Walking** — quiet companion UI; map/walking card is calm, not noisy
- [ ] **Approaching** — subtle pre-arrival cue; no chrome overload
- [ ] **Arrival** — bottom tab bar and app chrome hidden
- [ ] **Story** — immersive player; chrome hidden
- [ ] **Threshold** — full-screen overlay; chrome hidden
- [ ] **Map CTA** — “Route” / map companion actions are clear during walking

---

## E. Audio

- [ ] **Play / pause** — toggles reliably in the immersive player
- [ ] **Scrub** — seek bar moves narration correctly
- [ ] **±15s** — skip back / forward works
- [ ] **Transcript** — tab opens readable text; font size respects settings
- [ ] **Completion** — when narration ends, next action / reveal CTA appears

---

## F. Threshold

- [ ] **Hold** — press-and-hold reveals the “then” layer / loop
- [ ] **Release** — releasing before full reveal returns toward “now”
- [ ] **Reduced motion** — with OS reduced motion on, reveal still works without requiring hold animation
- [ ] **Caption** — honesty / reconstruction caption visible when provided
- [ ] **Analytics** — if analytics enabled, threshold hold fires (check network / console in dev)

---

## G. Completion

- [ ] **Letter** — `/letter` renders after tour completion with canonical stats
- [ ] **Stats** — stop count / duration labels match product truth layer (not stale hardcoded copy)
- [ ] **Share / save** — letter share and save actions complete without crash

---

## Optional QA scenes (dev tester)

| Scene | What to verify |
|---|---|
| First-time visitor | `/landing`, no access, empty journey |
| Purchased · first open | `/welcome`, access granted, fresh journey |
| Returning · in progress | `/begin` resume offer with mid-tour progress |
| Walking / Approaching / Arrived | Correct screen + chrome rules |
| Story / Threshold | Immersive layers, audio, hold interaction |
| After story | Advanced to next leg in walking state |
| Day complete | Classic day-break screen |
| Full complete | Letter route with completion stats |
| Off route | Walking UI while simulated GPS is far from stop |
| Missing media | `?debugMedia=true` — broken URLs logged, graceful fallbacks |
| Offline ready | Settings sheet shows offline package ready (simulated) |

---

## Sign-off

- **Date:**
- **Branch / commit:**
- **Tester:**
- **Notes:**
