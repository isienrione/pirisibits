# ChronoWalk iOS sprint plan — submit 29 August 2026

**Contract:** [`IOS_1_0_CONTRACT.md`](./IOS_1_0_CONTRACT.md)  
**Checklist:** [`IOS_SUBMISSION_CHECKLIST.md`](./IOS_SUBMISSION_CHECKLIST.md)  
**Commerce:** [`IOS_COMMERCE_MODEL.md`](./IOS_COMMERCE_MODEL.md)  
**Branch:** `cursor/ios-appstore-2026-08-29` from `figma`  
**Calendar:** 17 Aug (planning) → 29 Aug (Submit for Review)

**Amendment 2026-08-18:** free-entry Welcome; `/access` is secondary; Rome IAPs are geographic coverage mapped to existing entitlements.

This plan calendarizes **P0 only**. P1 ships solely if it is already stable before RC freeze on 28 Aug. P1 must never slip 29 Aug.

No Capacitor / runtime work is included in the contract-commit. Implementation starts **18 Aug** (T01).

---

## Outcome by day

| Date | Outcome if the day succeeds | If it slips |
|---|---|---|
| Mon 17 | Contract frozen; Apple admin started | Sprint has no written P0; do not code |
| Tue 18 | Physical-device Capacitor build of current SPA | No iOS binary; everything else is theoretical |
| Wed 19 | Native shell, Welcome / free Home (not `/access` front door), permissions + audio groundwork | Wrapper-looking binary; Review 4.2 risk; paywall-before-product |
| Thu 20 | Context V0 + 21 Hero metadata | Discover cannot rank honestly |
| Fri 21 | Discover / Near Me V0 as Home (free + entitled) | Product still a linear tour |
| Sat 22 | Walk / Arrival reliable on device | Loop breaks after recommendation |
| Sun 23 | Experience + offline + 3 flagship Reveals | Reviewer cannot complete a Hero |
| Mon 24 | Best Next V0 closes the loop | No permanent product primitive |
| Tue 25 | StoreKit + entitlement mapping | **Hard Apple 3.1.1 blocker** |
| Wed 26 | Restore + Reviewer Mode + privacy | Reviewer cannot test; 5.1 / 3.1.1 |
| Thu 27 | TestFlight RC1 + full QA | No evidence the loop works off-desk |
| Fri 28 | RC freeze + ASC metadata/assets | Cannot submit a complete listing |
| Sat 29 | Final smoke + **Submit for Review** | Missed gate |

---

## Critical path

These are serial. Parallel work is allowed **beside** them, never **instead** of them.

```
Apple admin + bundle ID (17)
    → Capacitor local shell on a physical iPhone (18)
        → iOS entry: /welcome · free Home · GPS · background audio (19)
            → Hero metadata (20) ──┬── Context UI (20)
                                   └── Discover ranking (21)
                                        → Walk/Arrival on device (22)
                                            → Experience/audio/offline + flagship Reveals (23)
                                                → Best Next same engine (24)
                                                    → StoreKit IAP + entitlements (25)
                                                        → Restore + Reviewer Mode + privacy (26)
                                                            → TestFlight RC1 (27)
                                                                → Freeze + listing (28)
                                                                    → Submit (29)
```

**Cannot start Discover** until metadata exists.  
**Cannot start Best Next** until Discover scoring is real (same function).  
**Cannot submit** without StoreKit + Restore + Reviewer Mode, even if the loop is beautiful.  
**Web Paddle** must keep working on `figma`/production site in parallel — do not “fix iOS” by breaking `src/lib/paddle.js` for browsers.

---

## August 17 — Audit / contract / branch / Apple admin

**Done in the planning commit:** this document, the contract, the checklist, branch cut from `figma`.

**Still 17 Aug (people, not code):**

- Create / confirm Apple Developer + App Store Connect app record
- Reserve bundle ID; enable IAP + audio background; **do not** enable Always location
- Decide iOS IAP set: Ancient Rome / Historic Center / All Central Rome (Apple IDs in commerce model). Couple/Family default **out**. Record upgrade/crossgrade as open until 25 Aug.
- Create sandbox testers
- Start Paid Apps agreement / tax / bank if not already Active
- Pick 3 flagship Reveals (recommendation from current repo: `w01` Colosseum loop, plus the two Heroes with distinct then stills `w10` Rostra and `w11_12` Arch of Severus — confirm visually on device 23 Aug)
- Confirm who watches Resolution Center 29 Aug–5 Sep

**Exit:** Contract is the source of truth; Apple paperwork is in motion.

---

## August 18 — Capacitor / Xcode first physical-device build

**Build:** T01 native container (P0.1)

- Add Capacitor iOS project wrapping `chronowalk` Vite `dist/`
- Production build packaged **locally**
- Run on Simulator **and** a physical iPhone
- Record bundle ID, team, and any ATS issues (Mapbox, media, Supabase)

**Do not yet:** redesign Home, IAP, or recommendation engine.

**Exit:** `npx cap run ios` shows the current app from a local bundle. FAIL if WKWebView loads `https://chronowalk.com` as the document URL.

**Parallel (non-blocking):** icon/splash asset collection; App Store Connect IAP records using `com.chronowalk.rome.*` IDs (do not implement StoreKit yet).

---

## August 19 — Native shell, Welcome / free Home, permissions, audio groundwork

**Build:** P0.2, P0.3, start P0.15/P0.16 constraints

- iOS root ≠ marketing `/` and ≠ A2HS / Prepare-as-install
- **First run → `/welcome`** (new native first-run screen; do not reuse web post-purchase `WelcomeFlow` as the front door)
- Primary CTA starts free exploration → Context; secondary CTA → existing `/access`
- Returning free user → `/home` (Discover); entitled → `/home`
- **Do not** send unentitled first-run users to `/access` or a purchase wall
- Purchase UI may still be a stub until 25 Aug, but **must not** open Paddle
- When-In-Use Info.plist strings
- Capacitor Geolocation wired to existing `watchPosition` path
- Native haptics plugin on existing `src/utils/haptics.js` stub
- App lifecycle resume hook
- `UIBackgroundModes=audio`; HTMLAudio lock-screen smoke
- Do **not** re-enable the service worker
- Hide debug / Santiago / `debugGeo` in Release

**Exit:** Cold launch looks like an app. New traveler reaches Welcome then free Home without buying. Location deny does not freeze. Narration continues when the phone locks (or a tracked gap is filed as P0 bug, not ignored).

---

## August 20 — Context + Hero metadata

**Build:** P0.4, P0.5

- Context V0: interests (closed set), time budget, location
- Persist selections
- Structured metadata for all 21 Heroes in the content layer (not a new DB)
- Fields: id, geo, interestTags, timeCostMin, whyWorthIt, intrinsicPriority, unlockScopes, reveal availability
- Keep data city-scoped (`rome`) without a City Factory refactor

**Exit:** A unit test can load 21 rows and score a fake user at the Colosseum with a 60-minute budget. Context UI persists after reload.

**Dependency:** Metadata schema must be the input type Discover uses tomorrow — no throwaway JSON.

---

## August 21 — Discover / Near Me deterministic ranking

**Build:** P0.6, P0.17 events `recommendation_*`

- Entitled **and free** Home = Discover
- 1 primary + up to 2 alternatives
- Transparent scoring: distance, interest, time fit, completed, entitlement/lock, intrinsicPriority
- Locked Heroes remain visible; starting them is paywall (stub OK until 25 Aug) — not a dead end to `/access`
- “Why this?” only from those inputs
- Accept → Walk (may still be the existing journey jump)
- No ML, no Discoveries, no generative itinerary
- Path A/B is not Home

**Exit:** On a device in/near a Hero (or with a **dev-only** location override that will be replaced by Reviewer Mode on 26 Aug), Discover shows eligible Heroes only.

**Do not** ship production `?debugGeo` as the Discover test strategy.

---

## August 22 — Walk / Arrival native reliability

**Build:** P0.7, P0.8 (except polished Reviewer Mode)

- Recommendation accepted uses existing geofence / Mapbox directions
- Approaching + dwell/accuracy Arrival
- Keep “I'm here”
- Kill/resume during walk
- Location deny → I'm here still works
- Instrument `walk_started`, `arrival_detected`

**Exit:** One Hero can be walked from Discover to Arrival on a physical device without a Chrome tab.

---

## August 23 — Experience / audio / offline + flagship Reveal validation

**Build:** P0.9, P0.10, P0.16, P0.17 experience/reveal events

- All 21 Heroes reachable/playable (checklist F)
- EN/ES smoke
- Offline package: download → airplane → audio
- Journey resume after kill
- Threshold remains the implementation; user-facing **Reveal** naming where cheap
- Validate **3 flagship Reveals**; do not author 20 new reconstructions
- Honest reveal availability flags (no fake Then)

**Exit:** Flagship Reveal path is demo-quality. Remaining Heroes still play audio even if Reveal is absent.

---

## August 24 — Best Next + complete Golden Loop

**Build:** P0.11

- Same scoring function as Discover, with completed Hero removed / downranked and remaining time updated
- UI: Best Next + why + up to 2 alternatives (closer / different)
- Accept → Walk
- Analytics: `best_next_impression`, `best_next_accepted`
- Manual Golden Loop rehearsal: Context → Discover → Walk → Arrive → Experience → Reveal → Best Next → Walk

**Exit:** Loop closes twice in one session (two Heroes) without opening Tour list as the only continuation.

---

## August 25 — StoreKit / IAP + entitlement integration

**Build:** P0.12

- Non-consumable IAPs: `com.chronowalk.rome.ancient` / `.historiccenter` / `.complete`
- Map Apple product IDs → existing `rome-essential` / `rome-central` / `rome-complete`
- Native UI names: Ancient Rome / Historic Center / All Central Rome (not Historica / Antica / Eterna)
- Contextual paywall on **start locked content** (StoreKit localized prices; Restore)
- iOS compile-time/runtime gate: **no** Paddle/Lemon checkout
- Free Pantheon (`w17`/`w23`) remains playable without IAP
- Sandbox buy on device
- Web Paddle regression on desktop
- Couple/Family IAP **not** in 1.0 unless already validated
- Decide and document upgrade/crossgrade (commerce model §13)

**Exit:** Sandbox purchase unlocks the same Heroes web Paddle would for that `contentProductId`. Website checkout still Paddle. New traveler can finish Pantheon without paying.

**This is the highest-risk engineering day.** If it slips, 26–29 compress Restore + Reviewer Mode. Do not steal time from 25 Aug to polish Journal.

---

## August 26 — Restore + Reviewer Mode + privacy / analytics

**Build:** P0.13, P0.14, P0.15, finish P0.17

- Native Restore Purchases
- Email restore remains for web purchases only, labeled, reached from Welcome secondary CTA / Settings — **not** first-run
- Reviewer Mode: not a debug panel, not production `debugGeo` URL
- Reviewer can finish one full loop outside Rome without paying
- PostHog replay **off** on iOS; no Google Ads in native binary
- Privacy policy wording: service + iOS app
- Draft App Privacy answers
- Location purpose string audit

**Exit:** A teammate who is not in Rome can follow draft Review Notes and hit Best Next.

---

## August 27 — TestFlight RC1 + full QA

**Build:** checklist A–O as far as possible; first upload

- Archive Release; upload TestFlight
- Internal testers: Golden Loop, IAP sandbox, restore, offline, EN/ES, location deny, background audio
- File only P0 bugs
- Confirm 21 Heroes still reachable
- Confirm web Paddle untouched

**Exit:** RC1 installed on ≥2 physical iPhones. Written QA notes. No known P0 crash.

---

## August 28 — RC freeze + App Store metadata / assets / compliance

**Freeze:** no features. Fixes only per contract.

- Screenshots (Discover, Walk, Reveal, Best Next — not the marketing site)
- Metadata: name, subtitle, description as **city exploration**, not “PWA audio tour”
- Review Notes: outside Rome, no real purchase, IAP IDs, Restore
- Privacy Nutrition submitted
- IAP attached to the version
- RC SHA + build number recorded in the checklist
- P1 leftovers explicitly listed as deferred (Discoveries, Grounded Ask, Couple/Family, Santiago, …)

**Exit:** ASC version is complete except the Submit button. Binary is frozen.

---

## August 29 — Final smoke test + Submit for Review

- Cold install from TestFlight RC
- One Golden Loop
- One sandbox IAP + Restore on a second sandbox account if possible
- Reviewer Mode once
- Airplane Mode audio once
- Confirm no Paddle UI
- **Submit for Review**
- Monitor email / Resolution Center

**Exit:** Status is Waiting for Review (or In Review).

---

## Parallel tracks (do not block the critical path)

| Track | When | Rule |
|---|---|---|
| Apple legal / tax / banking | 17–25 | If unpaid-apps agreement is late, IAP cannot be tested; escalate immediately |
| Icons, splash, screenshots | 18–28 | Assets can lag code; listing cannot lag 28 Aug |
| Flagship Reveal visual QA | 23 | Content, not architecture |
| Web Paddle watch | every day after 19 | Any iOS checkout gate must be platform-specific |
| EN/ES copy for Context/Discover/Best Next | 20–24 | Can trail ranking by hours, not days |

---

## Explicit non-goals this sprint (P2 + disallowed P1)

Do not schedule:

- Santiago, City Factory, graph database, ML, Grounded Ask, 20–30 Discoveries as a gate
- React Native or SwiftUI rewrite
- Always location
- Re-enabling SW as iOS offline
- Broad cleanup of `LaunchRouter` / legacy `App.jsx` except what iOS entry requires
- Couple/Family IAP unless a written P1 exception is added to the contract

---

## Risk register (schedule)

| Risk | Why it is real on `figma` today | Mitigation |
|---|---|---|
| No iOS project exists | Audit 2026-08-17 | 18 Aug is 100% Capacitor; no product UI that day |
| 3.1.1 Paddle | Only digital checkout is Paddle | Platform gate + StoreKit 25 Aug; cannot slip past 26 |
| Paywall-before-product | Prior contract sent unentitled users to `/access` | 19 Aug Welcome + free Home; paywall only on start-locked |
| Home is a tour hub | `RedesignHomeScreen.jsx` | Replace Home on 21 Aug for **all** iOS users, not a visual tweak on 28 Aug |
| No Hero ranking fields | Manifest has geo, not interest/timeCost | 20 Aug metadata is mandatory |
| Reviewer not in Rome | Geofence + production debug placement gated | Reviewer Mode 26 Aug is P0, not a notes footnote |
| Thin wrapper | PWA/A2HS/landing | 19 Aug entry rewrite |
| Offline SW disabled | Intentional | Keep disabled; test package download 23 Aug |
| 12 calendar days | — | P1 never delays; freeze 28 Aug |

---

## Staffing assumption

This plan is written for a **single engineering stream** on the critical path plus **one person** on Apple admin/metadata. If two engineers exist:

- Eng A: Capacitor / GPS / audio / IAP  
- Eng B: Context / metadata / Discover / Best Next / analytics events  

They join on **24 Aug** for loop integration and **25–26 Aug** for commerce + reviewer.

---

## Amendment rule

If reality forces a contract change (e.g. only Complete IAP ships), amend [`IOS_1_0_CONTRACT.md`](./IOS_1_0_CONTRACT.md) in a dated section **Amendments** and never silently shrink Discover / Best Next back into a linear tour. Never restore “unentitled → `/access`” as the iOS front door without a written amendment.
