# ChronoWalk iOS 1.0 — App Store submission checklist

**Status:** Working checklist for the August 29, 2026 submission  
**Contract:** [`IOS_1_0_CONTRACT.md`](./IOS_1_0_CONTRACT.md)  
**Plan:** [`IOS_SPRINT_PLAN_2026-08-29.md`](./IOS_SPRINT_PLAN_2026-08-29.md)  
**Commerce:** [`IOS_COMMERCE_MODEL.md`](./IOS_COMMERCE_MODEL.md)  
**Branch:** `cursor/ios-appstore-2026-08-29`  
**Base:** `figma`

**Amendment 2026-08-18:** free-entry iOS; `/welcome` first-run; geographic IAPs. `/access` is secondary restore only.

Mark each item `[x]` only when objectively true. If an item cannot be verified, it is **FAIL**.

Owner initials and date may be added after the checkbox, e.g. `[x] 2026-08-28 AL`.

---

## A. Apple Developer / App Store Connect

- [ ] Apple Developer Program membership is **Active** (not expired, not pending).
- [ ] App Store Connect user who will submit has **App Manager** or **Admin**.
- [ ] App record **ChronoWalk** exists (or exact shipping name is decided and created).
- [ ] Bundle ID is reserved in Apple Developer → Identifiers.
- [ ] SKU / Apple ID for the app record is recorded in this sprint’s notes (not committed secrets).
- [ ] Primary category decided (likely **Travel** or **Education**) and set.
- [ ] Age rating questionnaire completed; result matches actual content (no user-generated chat, no gambling).
- [ ] Pricing tier for the **app binary** is Free (IAPs sell coverage unlocks). Travelers can enter without purchasing.
- [ ] Availability / countries list is set (at minimum markets we already sell Rome in).
- [ ] Agreements, Tax, and Banking are **Active** (Paid Apps agreement).
- [ ] Paid Applications contract is not blocked on missing bank / tax forms.
- [ ] App Store Connect → Users and Access → sandbox Apple IDs exist for IAP testing.

**Pass/fail:** A is FAIL if the Paid Apps agreement is incomplete or no app record exists by freeze.

---

## B. Bundle ID / signing / certificates

- [ ] Bundle ID is explicit, e.g. `com.chronowalk.app` (record the real value here when created: `________________`).
- [ ] Bundle ID matches Xcode target, App Store Connect, and IAP parent app.
- [ ] Development certificate exists and is not expired.
- [ ] Distribution certificate exists and is not expired.
- [ ] App ID has **In-App Purchase** capability enabled.
- [ ] App ID does **not** enable Background Location Modes.
- [ ] App ID enables **Background Modes → Audio** if lock-screen narration is claimed.
- [ ] Development provisioning profile includes the physical test device UDIDs.
- [ ] App Store Distribution provisioning profile is generated for this bundle ID.
- [ ] Team ID is recorded: `________________`.
- [ ] Code signing in Release uses **Apple Distribution**, not a personal/dev cert.
- [ ] No secrets (`.p12`, profiles, API keys) are committed to git.

**Pass/fail:** B is FAIL if Release cannot be signed for App Store or IAP capability is missing.

---

## C. Capacitor / Xcode

- [ ] `ios/` Xcode project exists on this branch (not only docs).
- [ ] Capacitor config points at the **local Vite `dist/`**, not `https://chronowalk.com`.
- [ ] `npx cap sync ios` completes without error against a production `npm run build`.
- [ ] Debug build runs on Simulator.
- [ ] Debug build runs on a **physical iPhone**.
- [ ] Release configuration (`Release`) archives in Xcode without warnings treated as errors that fail the archive.
- [ ] Archive uploads to App Store Connect (or Transporter) without bitcode/signing errors.
- [ ] WKWebView loads the packaged app shell (view source / proxy confirms no document request to `chronowalk.com` for the SPA).
- [ ] Remote content allowed only for declared hosts (Mapbox, media CDN, Supabase, PostHog EU, Apple) via ATS exceptions if required — each exception is listed and justified.
- [ ] Capacitor iOS version is pinned in `package.json` / lockfile.
- [ ] `ios/` `www` / derived Capacitor copy is not a stale build from another branch.
- [ ] Debug vs Release: debug tools, Santiago geofences, `?debugGeo`, and Capacitor inspector are **absent** from Release.

**Pass/fail:** C is FAIL if the binary is a remote website wrapper or Release still contains debug UI.

---

## D. Native permissions

- [ ] `NSLocationWhenInUseUsageDescription` exists and matches When-In-Use behavior (navigation + arrival unlock while the walk is open).
- [ ] Copy does **not** claim background tracking, always-on location, or “we recognize you across the city when the app is closed.”
- [ ] `NSLocationAlwaysAndWhenInUseUsageDescription` is **absent**.
- [ ] `NSLocationAlwaysUsageDescription` is **absent**.
- [ ] `UIBackgroundModes` contains `audio` if background narration is shipped; does **not** contain `location`.
- [ ] Location prompt appears only after Context / Discover needs it (not on first paint of Welcome as a hard gate).
- [ ] Denying location still allows: Context (minus live Near Me), “I'm here”, reviewer path, free Pantheon, and later access/purchase.
- [ ] Motion / orientation permission is requested only if DeviceOrientation is actually used; otherwise omitted.
- [ ] Microphone permission is **absent** unless a shipped feature records audio (it must not for 1.0).
- [ ] Photo library / camera permissions are **absent** unless a shipped feature uses them (camera overlay is not P0).
- [ ] Tracking (`NSUserTrackingUsageDescription`) is **absent** unless ATT is required (contract: prefer no ATT).

**Pass/fail:** D is FAIL if Always location exists, purpose strings mismatch, or deny-location dead-ends the app.

---

## E. Golden Loop

Contract loop: Context → Discover → Walk → Arrive → Experience → Reveal → Best Next → repeat.

- [ ] **Context V0** collects interests (closed set), time budget, and location permission + fix (or explicit skip).
- [ ] Context selections persist across kill / relaunch (`localStorage` or equivalent Capacitor storage).
- [ ] Context is not a long survey (one short screen, not a multi-page quiz).
- [ ] Product Home is **Discover / Near Me** for free **and** entitled travelers, not a linear “stop 4 of 21” tour dashboard as the primary story.
- [ ] Discover shows **1 primary** + **up to 2 alternatives**.
- [ ] Each card has a “Why this?” line derived only from ranking inputs (distance, interest, time, entitlement/lock, not completed).
- [ ] Ranking uses only the 21 Heroes; no ML; no LLM; no Discoveries required.
- [ ] Completed Heroes are excluded or ranked last according to the documented rule (document the rule in code comments + this box: `________________`).
- [ ] Locked premium Heroes remain **visible** but are not recommended as immediately playable when a playable option exists.
- [ ] Starting a locked Hero shows the **contextual paywall** (zone + Complete, StoreKit prices) — not `/access` as the only path.
- [ ] Accepting primary or an alternative enters **Walk** for that Hero.
- [ ] Walk shows distance / directions using existing Mapbox / geofence stack.
- [ ] Approaching and Arrival still function (dwell + accuracy and/or “I'm here”).
- [ ] Experience plays the Hero narration (EN default; ES if locale is ES).
- [ ] Reveal (Threshold) is reachable for Heroes that have a working reconstruction; Heroes without a worthwhile Reveal do not fake one.
- [ ] Completing the experience opens **Best Next** (same engine, updated completed set / remaining time).
- [ ] Best Next shows 1 pick + up to 2 alternatives (e.g. closer / different).
- [ ] Accepting Best Next returns to Walk for that Hero (loop closes).
- [ ] Path A/B linear sequence is not the Home; it may still exist as fallback / compatibility.

**Pass/fail:** E is FAIL if any loop step is skipped, mocked with lorem, still “next stop on the fixed tour” as the only post-experience action, or a new traveler cannot enter the loop without purchasing.

---

## F. 21 Hero inventory

For each Hero: reachable from Discover **or** from an explicit in-app list that does not replace Discover as Home.

| ID | Reachable | Playable audio | Entitlement respected | Reveal honest (has / none) |
|---|---|---|---|---|
| `w01` Colosseum | [ ] | [ ] | [ ] | [ ] |
| `w02` Colosseum interior | [ ] | [ ] | [ ] | [ ] |
| `w03` Arch of Titus | [ ] | [ ] | [ ] | [ ] |
| `w04` The Palatine | [ ] | [ ] | [ ] | [ ] |
| `w06` Basilica of Maxentius | [ ] | [ ] | [ ] | [ ] |
| `w07` Via Sacra | [ ] | [ ] | [ ] | [ ] |
| `w08` Temple of Vesta | [ ] | [ ] | [ ] | [ ] |
| `w10` The Rostra | [ ] | [ ] | [ ] | [ ] |
| `w11_12` Arch of Septimius Severus | [ ] | [ ] | [ ] | [ ] |
| `w13` Capitoline Hill | [ ] | [ ] | [ ] | [ ] |
| `w14` Trajan's Market | [ ] | [ ] | [ ] | [ ] |
| `w15` Spanish Steps | [ ] | [ ] | [ ] | [ ] |
| `w16` Fontana di Trevi | [ ] | [ ] | [ ] | [ ] |
| `w17` The Pantheon | [ ] | [ ] | [ ] | [ ] |
| `w23` Pantheon interior | [ ] | [ ] | [ ] | [ ] |
| `w18` Piazza Navona | [ ] | [ ] | [ ] | [ ] |
| `w19` Campo de' Fiori | [ ] | [ ] | [ ] | [ ] |
| `w20` Largo di Torre Argentina | [ ] | [ ] | [ ] | [ ] |
| `w21` Castel Sant'Angelo | [ ] | [ ] | [ ] | [ ] |
| `enc_circus` Circus Maximus View | [ ] | [ ] | [ ] | [ ] |
| `w22` Via Appia Antica | [ ] | [ ] | [ ] | [ ] |

Metadata (P0.5) present for all 21:

- [ ] `experienceId` / `placeId`
- [ ] geo
- [ ] `interestTags` (subset of Context closed set)
- [ ] `timeCostMin`
- [ ] `whyWorthIt`
- [ ] `intrinsicPriority` (ChronoWorth seed)
- [ ] `unlockScopes`
- [ ] reveal availability flag (do not mark “yes” if `now === then` still and loop is missing/broken)

**Pass/fail:** F is FAIL if any of the 21 cannot be opened by a Complete-entitled tester, Pantheon cannot be fully played in free mode, or metadata is missing for ranking.

---

## G. IAP products

- [ ] Decision recorded: iOS launch IAPs are geographic non-consumables: Ancient Rome / Historic Center / All Central Rome (not customer-facing Historica / Antica / Eterna).
- [ ] Couple / Family IAP is **out** of 1.0 unless explicitly validated (default: P1, not in binary).
- [ ] Each shipping IAP exists in App Store Connect as **Non-Consumable**.
- [ ] Product IDs are stable and mapped in code (record table):

| App Store product ID | Canonical `contentProductId` | iOS display name | Heroes (see commerce model) |
|---|---|---|---|
| `com.chronowalk.rome.ancient` | `rome-essential` | Ancient Rome | Colosseum–Forum–Palatine–Circus cluster (+ Capitoline; 11 Hero IDs) |
| `com.chronowalk.rome.historiccenter` | `rome-central` | Historic Center | Trajan–centro–Castel (+ Spanish Steps, Pantheon pair; 9 Hero IDs) |
| `com.chronowalk.rome.complete` | `rome-complete` | All Central Rome | All 21 `HERO_STOP_IDS` including Appia encore |

- [ ] Target list prices recorded: Ancient EUR 6.99, Historic Center EUR 4.99, Complete EUR 9.99 (StoreKit localized; no hardcoded currency in UI).
- [ ] Membership table in [`IOS_COMMERCE_MODEL.md`](./IOS_COMMERCE_MODEL.md) is the source of truth — not landing `stopCount` 8/12 marketing numbers.
- [ ] Upgrade/crossgrade rule decided and written (commerce model §13) before StoreKit ships.
- [ ] Localization of IAP display names / descriptions is filled for EN (and ES if we ship ES storefront copy).
- [ ] Clear In-App Purchase description: one-time unlock of Rome walking experiences, not a subscription, unless we actually ship a subscription (we must not for 1.0).
- [ ] Sandbox purchase of each SKU succeeds on a physical device.
- [ ] Interrupted purchase / Ask to Buy path does not brick the app (retry or restore).
- [ ] iOS UI never calls `openPaddleCheckout` / Lemon overlay (`src/lib/paddle.js`, `src/lib/lemonSqueezy.js`).
- [ ] Web `chronowalk.com` Paddle checkout still works on a desktop browser (regression).

**Pass/fail:** G is FAIL if any digital unlock in the iOS binary uses Paddle/Lemon, or a listed IAP cannot be purchased in sandbox.

---

## H. Restore Purchases

- [ ] Settings (or Access) has a control labeled **Restore Purchases** (or localized equivalent).
- [ ] Control calls StoreKit restore / current entitlements API, not only `/access` email.
- [ ] Restoring on a second device with the same Apple ID grants the same ChronoWalk unlock scopes.
- [ ] Restore with no purchases shows a clear empty state (not a crash, not a silent no-op).
- [ ] Email / code restore remains available for **web-originated** purchases and is labeled as such (`/access` is secondary, not the first-run door).
- [ ] Email restore is not the only restore path in the iOS binary.
- [ ] Restore does not wipe tour progress unless the user confirms a separate “Start over” action.

**Pass/fail:** H is FAIL if Apple restore is missing or is implemented as “paste your email code.”

---

## I. Entitlement mapping

- [ ] Apple transaction → existing access model (`purchasedProductId` / `contentProductId` / device credential) — no second parallel “iOS-only inventory.”
- [ ] `rome-complete` unlocks all 21 Heroes (iOS name: All Central Rome).
- [ ] `rome-essential` (Ancient Rome) and `rome-central` (Historic Center) unlock sets match [`IOS_COMMERCE_MODEL.md`](./IOS_COMMERCE_MODEL.md) Hero tables (not landing `stopCount` 8/12).
- [ ] Server or on-device mapping is idempotent (replayed webhook / restore does not duplicate-corrupt seats).
- [ ] Free mode: traveler can complete Pantheon `w17`+`w23` with no paid entitlement.
- [ ] Unentitled user cannot **start** other paid Hero audio (cards remain visible; start → contextual paywall).
- [ ] Reviewer credentials do not grant production customers extra access and cannot be guessed from the UI.
- [ ] Web Paddle entitlements still redeem via `/access` on the website **and** as a secondary iOS path.

**Pass/fail:** I is FAIL if IAP unlocks a different 21-stop truth than web, paid audio plays without entitlement, or Pantheon requires purchase on iOS.

---

## J. Reviewer Mode

- [ ] Mechanism is production-safe (not `?debugGeo=` on the public site, not a visible Debug tab in Release).
- [ ] App Review Notes document exactly how to enter it (account, promo code, or Apple-review flag).
- [ ] No real purchase required.
- [ ] Reviewer, physically outside Rome, can:
  - [ ] open the app
  - [ ] complete Context (or skip location with a documented fallback)
  - [ ] see Discover recommendations
  - [ ] accept a recommendation
  - [ ] confirm arrival (“I'm here” or review-safe simulate)
  - [ ] play at least one full Hero experience
  - [ ] see a Reveal on a flagship Hero
  - [ ] complete the experience
  - [ ] receive Best Next
- [ ] Reviewer Mode does not teleport **customer** builds via a secret URL.
- [ ] Release customers cannot enable Reviewer Mode from Settings.

**Pass/fail:** J is FAIL if a US/Chile reviewer cannot finish one Golden Loop without flying to Rome, or if `debugGeo` remains a production backdoor.

---

## K. Privacy / analytics

- [ ] PostHog **session replay is off** in the iOS binary (or fully justified, masked, and declared).
- [ ] `maskAllInputs: false` is **not** shipped on iOS.
- [ ] Google Ads / gtag **does not run** in the native binary (or ATT + nutrition labels are complete — contract prefers none).
- [ ] Product analytics still fire for the P0.17 event list (see below).
- [ ] No free-text user inputs in event properties.
- [ ] Distance is sent as a **bucket**, not raw high-precision coordinates, unless privacy labels explicitly include precise location sharing with analytics (prefer buckets).
- [ ] Privacy policy text covers **iOS app**, not only “website and Progressive Web App.”
- [ ] App Store Connect App Privacy answers match SDKs actually linked (PostHog, Mapbox, Supabase, Apple, CDN).
- [ ] Data used to track is **No** unless ATT is implemented.
- [ ] Location is declared as used for **App Functionality**, When In Use, not tracking.
- [ ] Privacy Nutrition: Purchases, Product Interaction, Diagnostics as applicable — each with correct linked/not linked.
- [ ] Support URL and Privacy Policy URL are HTTPS and load.
- [ ] Location purpose string == actual behavior (foreground walk only).

P0.17 events observed in a debug build log or PostHog project (iOS source):

- [ ] `context_completed`
- [ ] `recommendation_impression`
- [ ] `recommendation_accepted`
- [ ] `walk_started`
- [ ] `arrival_detected`
- [ ] `experience_started`
- [ ] `experience_completed`
- [ ] `reveal_started`
- [ ] `reveal_completed`
- [ ] `best_next_impression`
- [ ] `best_next_accepted`
- [ ] `offline_session`
- [ ] `session_resumed`

**Pass/fail:** K is FAIL if replay/ads leak into iOS, or nutrition labels omit location / purchase / analytics that the binary uses.

---

## L. Offline / resume

- [ ] Service worker is **not** the iOS offline strategy (`SERVICE_WORKER_BOOT_DISABLED` remains true for native, or SW never registers in Capacitor).
- [ ] Prepare / download of the Rome package completes on Wi-Fi.
- [ ] After download, Airplane Mode: at least one Hero audio plays from cache.
- [ ] After download, Airplane Mode: map does not hard-crash (degraded map OK if labeled).
- [ ] Kill app during a walk; relaunch restores journey (not a blank first-run).
- [ ] Context preferences survive kill.
- [ ] Completed Heroes survive kill (so Best Next does not re-recommend as if new, unless that is the documented rule).
- [ ] Offline entitlement lease still allows walking within existing 48h (or documented native equivalent) without claiming infinite offline piracy.

**Pass/fail:** L is FAIL if kill/relaunch loses the walk, or downloaded audio cannot play offline.

---

## M. EN / ES

- [ ] Device / in-app locale EN: UI strings English.
- [ ] Device / in-app locale ES: UI strings Spanish for Context, Discover, Walk chrome, Best Next, Settings, Restore.
- [ ] Hero titles / transcripts overlay for ES still apply (`src/i18n/content/es/`).
- [ ] Spanish narration files resolve for a smoke set: `w01`, `w17`, plus one more (`________________`).
- [ ] Language toggle does not require reinstall.
- [ ] Reviewer Notes state how to switch language if not automatic.

**Pass/fail:** M is FAIL if ES UI is missing on Discover/Best Next, or EN audio plays with no ES path when locale is ES and files exist.

---

## N. Icons / launch / UI polish

- [ ] 1024×1024 App Store icon, no alpha, no rounded-rect baked incorrectly.
- [ ] Asset catalog includes required iPhone sizes.
- [ ] Native launch storyboard / splash (not HTML “Loading ChronoWalk…” as the only splash).
- [ ] Status bar readable on first screen (light content on dark, or vice versa — pick one and test).
- [ ] `viewport-fit=cover` + `env(safe-area-inset-*)` on Home, Discover, Walk, player, Best Next, Settings.
- [ ] Home indicator does not cover primary CTA.
- [ ] Portrait only **or** landscape explicitly tested; contract default is portrait.
- [ ] No “Add to Home Screen”, “Open in Safari”, “Refresh the app shell”, or PWA update toast in the native binary.
- [ ] No marketing landing (`ChronoWalkLanding`) as the iOS root.
- [ ] Cold install without entitlement opens **Welcome** (`/welcome`), not `/access` and not the website landing.
- [ ] Welcome primary CTA starts free exploration (Context); secondary CTA is “I already have access.”
- [ ] Dark/light: shipping look matches design (obsidian/bone) without iOS inverted colors glitch.
- [ ] Dynamic Type: primary CTAs remain tappable at Larger Text (spot check).

**Pass/fail:** N is FAIL if iOS root is the website landing, first-run is `/access`, A2HS appears, or safe-area CTAs are unusable on a notched device.

---

## O. TestFlight

- [ ] Internal tester group includes at least one iPhone 16-class device and one older (e.g. iPhone 12/13).
- [ ] Build processed (not stuck in Processing).
- [ ] Export compliance answered (encryption: HTTPS only typically YES with exemption).
- [ ] Build is the Release Candidate intended for Review, not a random debug archive.
- [ ] Crash-free on: cold start, Context, Discover, Walk, I'm here, Experience, Reveal, Best Next, Restore, background audio.
- [ ] TestFlight notes for testers do **not** contradict App Review Notes (no “use debugGeo”).
- [ ] Feedback from internal testers on GPS deny and offline is addressed or waived in writing.

**Pass/fail:** O is FAIL if no TestFlight build exists or RC crashes on the Golden Loop.

---

## P. Screenshots / preview

Required iPhone 6.9" and 6.7"/6.5" sizes per current App Store Connect (verify in ASC at freeze; do not ship iPad if the binary is iPhone-only).

- [ ] Screenshot: Context (short, not a survey)
- [ ] Screenshot: Discover with 1+2 recommendations and a real “Why this?”
- [ ] Screenshot: Walk / map with a Hero
- [ ] Screenshot: Arrival or Experience player
- [ ] Screenshot: Reveal (flagship then/now)
- [ ] Screenshot: Best Next
- [ ] No simulator bezels if Apple currently rejects them (follow current ASC guide).
- [ ] No placeholder “Lorem” or `w01` raw IDs in shots.
- [ ] Optional preview video ≤ 30s showing loop, not a website recording of `chronowalk.com`.
- [ ] Copyright: reconstructions we own or have rights to; no random Google Street View as Then.

**Pass/fail:** P is FAIL if required device sizes are missing or shots show the marketing site / PWA install.

---

## Q. App Store metadata

- [ ] Name ≤ 30 characters: `________________`
- [ ] Subtitle ≤ 30: `________________`
- [ ] Promotional text (optional) does not promise Discoveries / Grounded Ask / other cities.
- [ ] Description describes **city exploration + nearby worth-doing**, not “21-stop audio tour” as the identity (inventory may be mentioned factually).
- [ ] Description states travelers can start free (Pantheon) and unlock geographic coverage in-app.
- [ ] Keywords do not mention competitors deceptively.
- [ ] Support URL live.
- [ ] Marketing URL optional; if set, must not be the only way to buy (IAP is in-app).
- [ ] Privacy Policy URL live and iOS-updated.
- [ ] Copyright year / holder: `________________`
- [ ] Version `1.0.0` (or recorded) matches `package.json` / Xcode `MARKETING_VERSION`.
- [ ] What’s New for 1.0 is the first-release description.
- [ ] EN metadata complete; ES metadata if we localize the store listing.

**Pass/fail:** Q is FAIL if description still sells a PWA, other cities as available, or IAP-unlockable content as “buy on our website.”

---

## R. Review Notes

Must include, in App Store Connect:

- [ ] Reviewer account **or** Reviewer Mode steps (no real credit card).
- [ ] Statement: location is When In Use for walking navigation and arrival; deny still works via “I'm here.”
- [ ] Statement: reviewer is **not** expected to be in Rome.
- [ ] How to complete one Golden Loop (which flagship Hero, which Reveal).
- [ ] How Restore Purchases is tested in sandbox.
- [ ] Contact phone / email for reviewer questions, monitored on Aug 29–Sep 5.
- [ ] No hidden features; Couple/Family / Discoveries / Santiago explicitly **not** in this binary if absent.
- [ ] IAP product IDs listed.

**Pass/fail:** R is FAIL if notes require being in Rome or a production Paddle purchase.

---

## S. Final Release Candidate

Freeze rules: crashes, purchase/access, navigation, audio/background, offline/resume, privacy, data loss, recommendation eligibility, critical visual blockers **only**.

- [ ] RC git SHA recorded: `________________`
- [ ] Xcode build number recorded: `________________`
- [ ] `figma` web deploy is **not** accidentally the iOS webview URL.
- [ ] Apple release gate in `IOS_1_0_CONTRACT.md` is fully checked.
- [ ] No P1 feature merged after freeze without written exception in this file.
- [ ] Known issues list is empty of P0 defects (P1 issues listed as deferred).

**Pass/fail:** S is FAIL if P0.12–P0.14 or Golden Loop are incomplete.

---

## T. Submit for Review

- [ ] Date: **2026-08-29** (or earlier).
- [ ] Build selected in ASC is the frozen RC.
- [ ] IAP products are **Ready to Submit** and attached to the version.
- [ ] Advertising Identifier: not used, or declared.
- [ ] Content rights: we have rights to Rome reconstructions / photos / narration.
- [ ] Export compliance submitted.
- [ ] Submit for Review tapped; status is **Waiting for Review** or **In Review**.
- [ ] Team calendar: someone watches Resolution Center for 72 hours.

**Pass/fail:** T is FAIL until ASC status is Waiting for Review or later.

---

## Sign-off

| Role | Name | Date | Result |
|---|---|---|---|
| Engineering | | | PASS / FAIL |
| Product | | | PASS / FAIL |
| App Store submitter | | | PASS / FAIL |
