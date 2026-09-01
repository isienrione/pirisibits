# ChronoWalk iOS 1.0 Contract

**Status:** FROZEN source of truth for the August 29, 2026 App Store submission sprint  
**Branch:** `cursor/ios-appstore-2026-08-29` (cut from `figma` HEAD)  
**App root:** `chronowalk/`  
**This document overrides** informal audit scope cuts that reduced iOS 1.0 to “the existing linear Rome tour.”

**Amendment 2026-08-18 (identity):** Guest → optional ChronoWalk account → canonical entitlements. Access codes are external purchase claiming only. Details: [`IOS_IDENTITY_AND_COMMERCE_MODEL.md`](./IOS_IDENTITY_AND_COMMERCE_MODEL.md). Geographic Rome coverage membership remains in [`IOS_COMMERCE_MODEL.md`](./IOS_COMMERCE_MODEL.md).

Do not treat this file as a wishlist. If a later task conflicts with this contract, the contract wins unless a later written amendment is committed to this path.

---

## Mission

Submit a credible, stable ChronoWalk iOS 1.0 to Apple App Review by **August 29, 2026**.

This is not a generic native-wrapper milestone.

The release must establish the **permanent ChronoWalk consumer loop** while reusing the substantial Rome product already built on `figma`.

---

## Product truth

ChronoWalk iOS 1.0 is:

A location-aware city exploration app where the traveler gives ChronoWalk a small amount of context, ChronoWalk curates what is worth experiencing nearby, the traveler experiences the place physically, and ChronoWalk recommends what is worth doing next.

The permanent interaction loop is:

```
CONTEXT
→ DISCOVER
→ WALK
→ ARRIVE
→ EXPERIENCE
→ REVEAL
→ BEST NEXT
→ repeat
```

Rome is City #1. History is the launch wedge.

The app **must not** present itself as merely a fixed 21-stop audio tour, even though the **21 existing Hero experiences are the launch inventory**.

---

## Rome inventory

All current **21 Hero experiences** remain available.

Do not delete, hide, rewrite, or rebuild them unnecessarily.

They become the first recommendation inventory for Discover / Best Next.

Canonical Hero IDs (exclude scripted Forum rest `pause`):

| ID | Title |
|---|---|
| `w01` | The Colosseum |
| `w02` | Colosseum interior |
| `w03` | Arch of Titus |
| `w04` | The Palatine |
| `w06` | Basilica of Maxentius |
| `w07` | Via Sacra |
| `w08` | Temple of Vesta |
| `w10` | The Rostra |
| `w11_12` | Arch of Septimius Severus |
| `w13` | Capitoline Hill |
| `w14` | Trajan's Market |
| `w15` | Spanish Steps |
| `w16` | Fontana di Trevi |
| `w17` | The Pantheon |
| `w23` | Pantheon interior |
| `w18` | Piazza Navona |
| `w19` | Campo de' Fiori |
| `w20` | Largo di Torre Argentina |
| `w21` | Castel Sant'Angelo |
| `enc_circus` | Circus Maximus View |
| `w22` | Via Appia Antica (encore) |

Source of truth in code today:

- Manifest: `src/content/rome/manifest.json`
- Hero ID list: `src/i18n/audio/heroStopAudioMap.js` (`HERO_STOP_IDS`)
- Product counts: `src/content/tourProductTruth.js`

Canonical paid unlock scopes remain the existing `contentProductId`s (`rome-essential`, `rome-central`, `rome-complete` in `commerce/launchCatalog.json`). Native iOS **must not** present those as Roma Historica / Antica / Eterna to customers. Native display names are geographic (see commerce model). Web Paddle catalog names may remain until a separate web amendment.

Existing EN/ES content and audio remain.

Existing path A/B sequences remain as **fallback / compatibility** behavior where useful. They **must not** define the primary home / discovery experience.

---

## P0 — required before App Review submission

P1 may never delay these items.

### P0.1 — Native iOS container

- Capacitor iOS project
- Production Vite build packaged **locally**, not a remote `chronowalk.com` shell
- Native launch screen
- App icon
- Safe areas
- Status bar
- Portrait behavior
- Release / debug separation

### P0.2 — iOS-native integration

- When-In-Use location permission
- Foreground GPS
- Native haptics where appropriate
- App lifecycle / resume handling
- Background narration audio
- Lock-screen playback behavior
- **No** background location requirement

### P0.3 — iOS app entry (guest)

ChronoWalk iOS is **guest-first**. Purchase, access code, email, and account creation are **not** required to enter or to complete the free product loop.

The native binary must **not** open on:

- marketing landing page (`/`) as used on the website
- Add to Home Screen flow
- website-oriented installation flow
- `/access` as the primary first-run front door
- a signup / login wall as the first screen

Four objects stay separate: **User/Account**, **Journey state**, **Purchase**, **Entitlement**. Device credentials and access codes are not “the user.”

Native root behavior:

```
IF ChronoWalk Auth session exists
  → /home
ELSE IF guest has completed native onboarding
  → /home
ELSE
  → /welcome
```

`/home` is Discover / Near Me for **guests and accounts** (Context first if Context is unset).

**Welcome (native-only first-run):** cinematic brand opening (reuse existing video/stills). Primary CTA **Start exploring — free** → Context. Secondary CTA **Sign in** (returning accounts). Not a login form. Not access-code paste.

Account creation appears later (save/sync, purchase, link external purchases) — see identity model.

**Purchases & Access** (Settings): “I bought ChronoWalk elsewhere” reuses claim/email infrastructure. `/access` may remain as that claim route.

Web `/` remains the marketing landing.

**Supersedes** native unentitled → `/access` (including T02 `nativeAppEntry.jsx` behavior until a later runtime task).

### P0.4 — Context V0

Capture at minimum:

**Interests** — closed small set appropriate to current Rome content. Suggested set (amend only if a Hero cannot be tagged):

- Ancient architecture
- Empire & power
- Sacred & ritual
- Living city
- Views & landscape

**Time available**, e.g.:

- 30 min
- 1 hour
- 2 hours
- Half day
- No rush

**Location** — native permission + current location

Persist selections.

Do not create a long onboarding survey.

### P0.5 — Hero metadata layer

Add / verify structured metadata for all 21 existing Heroes, sufficient for deterministic recommendation:

- `experienceId` / `placeId`
- geo
- `interestTags`
- `timeCostMin`
- `whyWorthIt`
- `intrinsicPriority` / ChronoWorth seed if needed
- `unlockScopes`
- completed state
- reveal availability
- basic relationships only if useful

Do **not** build a new graph database.

The manifest / structured content layer is sufficient for iOS 1.0.

### P0.6 — Discover / Near Me V0

The product Home for **every** iOS traveler (guest or entitled) must become a simple recommendation surface.

It must answer: **“What's worth experiencing from here?”**

Show:

- 1 primary recommendation
- up to 2 alternatives

using deterministic scoring over the existing 21 Heroes.

Ranking inputs stay transparent and simple:

- distance
- interest match
- time fit
- already completed
- entitlement / lock state (locked Heroes stay visible; do not present them as immediately playable)
- basic intrinsic quality / priority

No ML.  
No generative itinerary.  
No Discoveries required.

Provide a small **“Why this?”** explanation based on the actual ranking inputs, such as:

- 4 min away
- matches architecture
- fits your available time

Do not invent unsupported explanations.

### P0.7 — Walk

Reuse current navigation / geofence infrastructure.

Recommendation accepted → walking state → distance / directions → approaching → arrival.

Do not build a Google Maps replacement.

### P0.8 — Arrival

Existing dwell / accuracy logic may remain.

Keep **“I'm here”** fallback.

Add an Apple Review-safe reviewer path so a reviewer outside Rome can test the experience.

### P0.9 — Experience

All 21 Hero experiences remain reachable in Discover / Map.

**Playable without purchase:** Pantheon `w17` + `w23` (full existing experience).  
**Playable with the matching unlock scope:** remaining Heroes.  
Locked premium content stays visible; **starting** it shows a contextual paywall (commerce model), not a blank or fake experience.

Reuse current:

- narration
- EN/ES
- chapter / story UI
- offline / resume
- state machine

Avoid content rewrites unless a blocking bug requires them.

### P0.10 — Reveal

Rename / productize Threshold as **Reveal** in user-facing future architecture where practical without destabilizing current UX.

Do **not** pretend every Hero has a worthwhile Reveal.

For submission:

- preserve existing working Threshold experiences
- identify **3 flagship / reference Reveals** for App Store / demo quality
- additional existing stable reveals may remain
- do not delay submission producing 20 new reconstructions

### P0.11 — Best Next V0

After experience completion, do **not** simply dump the traveler back into a list.

Run the **same** deterministic recommendation engine again using updated context:

- current location
- remaining time where available
- interests
- completed experiences
- entitlement / lock state
- distance

Display:

- **BEST NEXT** + why it fits
- up to 2 alternatives, for example:
  - Something closer
  - Something different

Accepting Best Next returns to Walk.

This closes the Golden Loop.

### P0.12 — Commerce

Paddle remains **WEB ONLY**.

The iOS binary must not expose Paddle or Lemon Squeezy checkout for digital content.

Do **not** put a purchase wall before the traveler sees the product.

Native iOS Rome offerings are **geographic coverage** (not customer-facing Historica / Antica / Eterna):

| iOS name | Target EUR | Apple product ID | Canonical `contentProductId` |
|---|---|---|---|
| Ancient Rome | 6.99 | `com.chronowalk.rome.ancient` | `rome-essential` |
| Historic Center | 4.99 | `com.chronowalk.rome.historiccenter` | `rome-central` |
| All Central Rome | 9.99 | `com.chronowalk.rome.complete` | `rome-complete` |

Treat as **non-consumable** one-time unlocks, subject to App Store Connect.

Exact Hero membership, overlaps, and flags: [`IOS_COMMERCE_MODEL.md`](./IOS_COMMERCE_MODEL.md). Identity / guest / account / entitlement objects: [`IOS_IDENTITY_AND_COMMERCE_MODEL.md`](./IOS_IDENTITY_AND_COMMERCE_MODEL.md).

Architecture must be **city → offerings → unlock scopes → content membership**. Do not hardcode three zones as a global rule (a later city may be one pass).

Apple transactions and web Paddle SKUs must map into the **same** canonical entitlements. No parallel iOS-only content truth.

Contextual paywall when the traveler **starts** locked premium content: relevant zone + Complete, StoreKit localized prices, Restore. No hardcoded currency strings.

Do not implement Couple / Family IAP in 1.0 (P1). Upgrade/crossgrade rules are **unresolved** (commerce model §13) and must be decided before StoreKit implementation.

### P0.13 — Restore Purchases

Native Restore Purchases must exist and restore **Apple** transactions via StoreKit. It must work **without** a ChronoWalk account and **without** an access code.

External (Paddle / Viator / web) claiming is a separate Settings flow using existing claim tokens. It is not Apple Restore and not first-run.

### P0.13a — ChronoWalk account (iOS 1.0 target)

Optional account. Providers: Sign in with Apple, Continue with Google, Continue with email. **No Facebook.**

Do not implement auth in the same commit as this contract. Guest loop must not wait on auth UI.

If Google ships, Sign in with Apple is mandatory (App Store 4.8).

### P0.13b — Account deletion

If accounts ship, in-app account deletion is required (5.1.1(v)). Minimal profile. Guest core features remain without an account.

### P0.14 — Reviewer Mode

App Review must be able to test Rome while physically outside Rome.

Build a production-safe REVIEW mechanism.

Requirements:

- not exposed as a normal-user debug panel
- no secret URL `debugGeo` production backdoor
- reviewer access documented in App Review Notes
- reviewer can access at least one full Hero experience
- reviewer can simulate / confirm arrival
- reviewer can see Reveal
- reviewer can complete the experience
- reviewer can receive Best Next
- no real purchase required for reviewer credentials

Do not compromise production customer entitlements.

### P0.15 — Privacy

Audit native binary data collection.

For iOS:

- disable PostHog session replay unless fully justified and safely masked
- prefer no Google Ads runtime tracking inside native binary
- update privacy policy wording from website / PWA to service + iOS app
- App Privacy answers must match actual collection
- no ATT unless actual cross-app / site tracking requires it
- location purpose text must match actual When-In-Use behavior
- Sign in with Apple / Google / email declared only if actually shipped
- in-app account deletion if accounts ship
- no unnecessary social profile collection

### P0.16 — Offline / resume

Existing explicit Rome offline package and journey persistence should work inside Capacitor.

Do **not** re-enable the service worker as the iOS solution.

Test:

- downloaded experience
- connectivity lost
- audio plays
- journey resumes after app kill / relaunch

### P0.17 — Analytics

Preserve essential product analytics with iOS-safe privacy configuration.

Instrument or verify:

| Event |
|---|
| `context_completed` |
| `recommendation_impression` |
| `recommendation_accepted` |
| `walk_started` |
| `arrival_detected` |
| `experience_started` |
| `experience_completed` |
| `reveal_started` |
| `reveal_completed` |
| `best_next_impression` |
| `best_next_accepted` |
| `offline_session` |
| `session_resumed` |

Properties should include where safe:

- `city`
- `experience_id`
- `recommendation_rank`
- distance bucket
- time budget
- interest tags
- language

Do not send sensitive free-text / user inputs.

---

## P1 — ship only if stable before freeze

P1 may **NEVER** delay P0 submission.

- 20–30 Rome Discoveries
- additional Reveal polishing beyond the flagship references
- Grounded Ask
- Couple / Family native commerce
- richer map experience
- richer Journal
- Path A/B polish
- additional contextual signals such as live weather
- richer recommendation explanation

---

## P2 — explicitly defer

- Santiago
- City Factory
- graphical / graph database implementation
- ML recommendation
- behavioral recommendation optimization
- full AR / world tracking
- generative itineraries
- social
- gamification
- partner dashboard
- restaurant / hotel commercial infrastructure
- React Native rewrite
- SwiftUI rewrite
- background Always location
- broad architectural cleanup unrelated to release

---

## Architecture rule

Rome-specific content must be data / configuration.

Generic product behavior must not be hard-coded to “Rome” if it can reasonably be city-independent.

However:

**DO NOT** perform speculative refactors solely for future cities before submission.

Use the smallest architecture that allows a future:

```
cities/
  rome/
  santiago/
```

without rebuilding the consumer loop.

---

## Apple release gate

Submission is allowed only when:

- [ ] release build launches reliably
- [ ] no critical crashes
- [ ] all 21 Heroes remain reachable (Pantheon fully playable without purchase; others visible when locked)
- [ ] Context works
- [ ] Discover ranks valid available Heroes
- [ ] recommendation acceptance enters Walk
- [ ] Arrival works
- [ ] Experience audio works
- [ ] at least flagship Reveal path works
- [ ] completion triggers Best Next
- [ ] Best Next can start another experience
- [ ] first-run `/welcome` → guest Context/Discover/Pantheon works without purchase, email, code, or account
- [ ] Welcome secondary is Sign in, not access-code onboarding
- [ ] `/access` is claim-only, not the native front door
- [ ] contextual paywall appears only when starting locked content
- [ ] purchases work
- [ ] Restore Purchases works
- [ ] web Paddle behavior remains intact
- [ ] iOS contains no Paddle digital checkout
- [ ] location denied has graceful path
- [ ] reviewer can test outside Rome
- [ ] EN/ES smoke test passes
- [ ] offline / resume passes
- [ ] privacy disclosures match implementation
- [ ] no A2HS / PWA / browser-language UI in native binary
- [ ] no debug UI in Release
- [ ] App Store metadata is complete

---

## Feature freeze

At Release Candidate freeze, only fix:

- crashes
- broken purchase / access
- broken navigation
- audio / background failures
- broken offline / resume
- privacy / compliance
- data loss
- incorrect recommendation eligibility
- critical visual / usability blockers

**No new features.**

---

## Companion documents

- Practical pass/fail list: [`IOS_SUBMISSION_CHECKLIST.md`](./IOS_SUBMISSION_CHECKLIST.md)
- Day-by-day plan: [`IOS_SPRINT_PLAN_2026-08-29.md`](./IOS_SPRINT_PLAN_2026-08-29.md)
- Identity / guest / account / entitlements: [`IOS_IDENTITY_AND_COMMERCE_MODEL.md`](./IOS_IDENTITY_AND_COMMERCE_MODEL.md)
- Rome zone Hero membership: [`IOS_COMMERCE_MODEL.md`](./IOS_COMMERCE_MODEL.md)

This amendment is **docs only** — do not implement Welcome, Auth, StoreKit, or zone gating in the same commit.

---

## Amendments

### 2026-08-18 — Free-entry geographic unlocks

**Replaces:** native unentitled → `/access`.

**Now:** native first-run → `/welcome`; native free returning user → `/home`; native entitled returning user → `/home`; `/access` is secondary restore / existing-purchase path.

**Replaces:** iOS customer-facing packaging as Roma Historica / Antica / Eterna.

**Now:** Ancient Rome / Historic Center / All Central Rome, mapped to existing `rome-essential` / `rome-central` / `rome-complete` entitlements. Proposed Apple IDs and Hero membership live in [`IOS_COMMERCE_MODEL.md`](./IOS_COMMERCE_MODEL.md).

**Does not change:** Golden Loop, 21 Hero inventory, Paddle-web-only, Capacitor local bundle, Reviewer Mode, P1/P2 lists.

### 2026-08-18 — Guest / account / entitlement split

**Replaces:** entitlement-or-access-code as native identity; Welcome secondary “I already have access.”

**Now:** Guest (local journey) → optional ChronoWalk account (Apple / Google / email) → canonical entitlements[]. Purchases are a separate object. Access codes = Settings “bought elsewhere.” Welcome secondary = **Sign in**. Account deletion required if accounts ship.

**Does not implement:** Auth, StoreKit, Welcome UI.
