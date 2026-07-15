# ChronoWalk Landing Page — QA Checklist

Use this checklist before shipping or after any change to the public landing page (`/` and `/landing`).

**Who this is for:** Anyone testing the product — you do not need to write code.

**How to start:**

1. Open a terminal in the project folder.
2. Run `npm run dev`.
3. Open the local URL shown (usually `http://localhost:5173/`).
4. Use a private/incognito window if you want to test as a new visitor (no prior purchase).

**Tip:** Resize the browser to phone width (~390px wide) for mobile checks, or use your phone on the same Wi‑Fi network.

---

## 1. Routing

Confirm the landing page does not break other parts of the app.

| Check | How to test | Expected result |
|-------|-------------|-----------------|
| `/` shows landing | Go to `http://localhost:5173/` without owning the tour | Full ChronoWalk landing page appears (not an error screen). |
| `/landing` works | Go to `http://localhost:5173/landing` | Same landing page as `/` (for visitors without access). |
| `/preview` works | Open `http://localhost:5173/preview` | Free Pantheon preview screen loads. |
| `/access` works | Open `http://localhost:5173/access` | Restore-access / code entry screen loads. |
| `/welcome` works | Open while logged in as an owner (if you have access) | Welcome/onboarding screen loads. |
| `/begin` works | Open with access + resumable journey (if applicable) | Begin/resume flow loads. |
| `/journey` works | Open with access | Journey screen loads. |
| `/map` works | Open with access | Map screen loads. |
| `/journal` works | Open with access | Journal screen loads. |
| Free users not sent to `/access` by mistake | On landing, tap **Try a free story** or **Play free story** | Goes to `/preview`, **not** `/access`. |

---

## 2. CTA tests (calls to action)

Tap each button once and note where you end up.

| CTA | Where to find it | Expected result |
|-----|------------------|-----------------|
| **Begin your journey** (hero) | Top of landing | Opens checkout in browser, **or** `/access` if checkout is not configured in dev. Page must not crash. |
| **Try a free story** (hero) | Top of landing | Navigates to `/preview`. |
| **Hear the Pantheon** / audio preview card | Hero or free-story section | Navigates to `/preview` (or plays only if safe inline preview exists — no broken play button). |
| **Start Rome without the research spiral** | “No perfect itinerary” section | Page scrolls smoothly to the **Rome journey** product section (`#rome-journey`). |
| **Begin your journey** (product card) | Rome journey section | Same as hero purchase — checkout or safe `/access` fallback. |
| **Try a free story** (product card) | Rome journey section | `/preview`. |
| **Begin your journey** (final CTA) | Bottom of page | Checkout or safe `/access` fallback. |
| **Try a free story** (final CTA) | Bottom of page | `/preview`. |
| **Mobile sticky CTA** | Scroll past hero on a phone-sized screen | Bar appears at bottom: **Begin Rome · [price]** and **Try free story** link. Primary opens checkout; secondary goes to `/preview`. |

---

## 3. Price

| Check | How to test | Expected result |
|-------|-------------|-----------------|
| Live price | Look at purchase buttons and value lines | Price matches app config (e.g. **$17.99**), not a random hardcoded value in multiple places. |
| Single fallback | Ask a developer or search code only if needed | Fallback (e.g. $17.99 full bundle) is defined **once**, not copied everywhere. |
| Currency | If product is USD | Shows **$**, not **€**, unless config explicitly uses another currency. |
| Copy consistency | Scan hero, product card, final CTA, sticky bar | Same price format everywhere on the landing page. |

---

## 4. Host attribution (hotel / partner QR links)

Partners may send travelers with a link like `/?h=hotelroma1`.

| Check | How to test | Expected result |
|-------|-------------|-----------------|
| Unknown code | Open `http://localhost:5173/?h=testcode` | Page works normally. **No** ugly raw code like “testcode” shown to the user. |
| Known code (if configured) | Open `http://localhost:5173/?h=hotelroma1` | Subtle line such as **Recommended by Hotel Roma** may appear near the top. |
| Checkout still works | With `?h=` in URL, tap **Begin your journey** | Checkout opens; host data is preserved for purchase tracking (existing behavior). |
| No debug text | Scan the whole landing | No technical host/debug messages visible. |

---

## 5. Mobile (iPhone-sized)

Use browser dev tools (~390×844) or a real phone.

| Check | Expected result |
|-------|-----------------|
| Page reads well | Text is large enough to read without zooming (nothing important below ~11–12px). |
| Hero text fits | Headline and buttons do not clip or overflow off screen. |
| Sticky CTA | Appears after scrolling past hero; does **not** permanently cover the final CTA at the bottom. |
| Touch targets | Buttons are easy to tap (roughly finger-sized). |
| FAQ | Questions open and close; you can tap through with keyboard or touch. |
| Threshold demo | Press and hold on the demo image reveals the “past” view; release returns to present. Works with touch. |

---

## 6. Desktop

| Check | Expected result |
|-------|-----------------|
| Editorial feel | Looks like a premium travel story, **not** a SaaS dashboard or app store grid. |
| Hero image | Full-bleed image scales cleanly; no awkward cropping of the main subject. |
| Product card | Rome product block and route artifact feel polished and intentional. |
| Line length | Paragraphs are not uncomfortably wide; content stays in a readable column. |

---

## 7. Brand & visual system

Walk the full page once and trust your eye.

- [ ] **Colors** — Dark obsidian backgrounds, warm white text, muted secondary text, ember gold accents, coral primary buttons. **No cold blue** UI.
- [ ] **Typography** — Headlines feel like Fraunces (serif/editorial); body UI feels like DM Sans.
- [ ] **Tone** — Cinematic travel companion, **not** a game, quest, or tour marketplace.
- [ ] **Layout** — No generic SaaS feature grids or “book now” marketplace clutter.

---

## 8. Copy & audience

The landing should speak to:

- [ ] **Romantic planners** — emotion and wonder (“Rome, as it once was”).
- [ ] **Night-before planners** — relief from research stress (“No planning spiral”).
- [ ] **Improvisers** — ready-made route, start today.
- [ ] **Travelers without tickets** — still a meaningful Rome day (open streets, ruins, façades).

**Words that should NOT appear on the landing:**

- hidden gems  
- quest  
- mission  
- AI-powered  
- unlock content  
- geofence  
- waypoint  

---

## 9. Trust & honesty

- [ ] **No fake reviewer names** on quotes.
- [ ] **No star ratings** or “verified review” badges unless they are real.
- [ ] **No fake historians, universities, or institutions** endorsing the product.
- [ ] **Historical accuracy** copy admits uncertainty where appropriate (reconstructions noted as interpretive).
- [ ] **Ticket FAQ** — Does **not** claim ChronoWalk replaces ticketed entry where tickets are required.

---

## 10. Performance & production safety

| Check | How to test | Expected result |
|-------|-------------|-----------------|
| Build passes | Run `npm run build` in terminal | Completes without errors. |
| No broken images | Scroll full landing | No broken-image icons; missing photos show a tasteful fallback, not a broken box. |
| No remote image URLs | Developer check if unsure | Images load from this app’s own files, not random external URLs. |
| Mapbox not required for landing | Load `/` only | Landing works without opening the map screen. |
| Journey not required for landing | Load `/` only | Landing works without starting a journey. |
| Lighthouse (manual) | Chrome DevTools → Lighthouse → Mobile | Run when landing is feature-complete; note score and any “large image” or “unused JS” warnings for follow-up. |

---

## Quick smoke test (5 minutes)

1. Open `/` in incognito — landing loads.  
2. Tap **Try a free story** → `/preview`.  
3. Go back; tap **Begin your journey** → checkout or `/access` (no crash).  
4. Open `/?h=unknowncode` — no ugly host text.  
5. On mobile width, scroll to bottom — sticky CTA hides near final CTA; FAQ opens.  
6. Run `npm run build` — passes.

---

## Sign-off

| Tester | Date | Pass / fail | Notes |
|--------|------|-------------|-------|
| | | | |

---

*Related: [UX Regression Checklist](./UX_REGRESSION_CHECKLIST.md) for the full app beyond the landing page.*
