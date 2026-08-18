# ChronoWalk iOS commerce model

**Status:** FROZEN Rome **coverage membership** for iOS 1.0  
**Identity / guest / account / entitlements:** [`IOS_IDENTITY_AND_COMMERCE_MODEL.md`](./IOS_IDENTITY_AND_COMMERCE_MODEL.md)  
**Contract:** [`IOS_1_0_CONTRACT.md`](./IOS_1_0_CONTRACT.md)  
**This file does not implement StoreKit.**

Rome consumer packaging on **native iOS** is geographic coverage, not Historica / Antica / Eterna.  
Guest-first identity is defined in the identity model. This file keeps the **audited Hero membership tables**.

Canonical scope ids: `rome-free`, `rome-ancient` (maps `rome-essential`), `rome-historic-center` (maps `rome-central`), `rome-complete`.

---

## 1. Free-entry product

ChronoWalk iOS is a **free-to-enter** consumer app.

A new traveler may enter and use the product **before** purchasing.

Do **not** require purchase, email, transaction id, or access code to:

- open the app
- complete Context
- use Discover / Near Me
- browse Map and all Rome Hero cards
- walk toward available content
- complete the canonical free Pantheon experience
- receive Best Next
- use Settings

`/access` is **external purchase claiming** (Settings → Purchases & Access), not first-run. See identity model.

---

## 2. Native iOS entry (not a paywall)

```
IF ChronoWalk Auth session exists
  → /home
ELSE IF guest has completed native onboarding
  → /home
ELSE
  → /welcome
```

| Native state | Destination |
|---|---|
| First-run guest | `/welcome` |
| Returning guest (onboarding done) | `/home` |
| Returning authenticated user | `/home` |
| Sign in | Auth — **not** `/access` |
| I bought elsewhere | Settings claim flow (may reuse `/access` internals) |

Web `/` remains the marketing landing.  
Do not use native unentitled → `/access` as the front door.

`/home` in iOS 1.0 is Discover / Near Me (see contract P0.6), for **both** free and entitled travelers.

---

## 3. Free mode

All iOS users may:

- enter the app
- complete Context
- use Discover / Near Me
- view Map
- browse **all** Rome Hero experiences (locked state visible)
- browse Discoveries **when they exist** (none ship in current inventory)
- see locked / unlocked coverage
- receive recommendations (playable vs locked distinguished)
- use walk guidance toward available content
- use Settings
- understand the full product structure

### Canonical free Hero (iOS 1.0)

**Pantheon is the full free experience:** `w17` (exterior) + `w23` (interior).

Free Pantheon includes:

- approach / navigation
- arrival
- complete existing Pantheon narrative / audio
- existing Reveal where available
- completion
- Best Next

Do **not** require entitlement for `w17` / `w23`.

**Current web free preview is different** (`src/data/freePreview.js` uses Colosseum `colosseum`, not Pantheon). iOS 1.0 does **not** copy that Colosseum-only preview as the native free product. Web preview behavior is unchanged until a separate web amendment.

---

## 4. Canonical entitlement architecture

Do **not** hardcode “exactly 3 Rome zones” as a global product shape.

Generic model:

```
city
  → product offerings[]
      → unlock scopes[]
          → content membership (Hero IDs, future Discovery IDs)
```

| Layer | Meaning | Rome 1.0 example |
|---|---|---|
| `cityId` | City catalog | `rome` |
| `offeringId` | Sellable (or free) offer in that city | `rome-ancient`, `rome-historic-center`, `rome-complete`, implicit `rome-free` |
| `unlockScopeId` | Canonical entitlement token stored on the credential | existing `contentProductId`: `rome-essential`, `rome-central`, `rome-complete` plus a **free grant** for Pantheon |
| `memberIds` | Experience IDs in that scope | Hero IDs below |

Future city example (not in 1.0): Santiago may expose **one** offering (`santiago-city-pass`) that unlocks every Santiago member. The engine must allow 1..N offerings per city.

**Invariant:** one content-truth table. Web Paddle SKUs and Apple IAP product IDs both resolve to `unlockScopeId`s. There is no separate iOS-only inventory of Heroes.

Couple / Family remain **web seat bundles** (`rome-couple`, `rome-family` → `contentProductId: rome-complete`). They are **not** iOS 1.0 IAP products.

---

## 5. Proposed Apple product IDs

Treat as **non-consumable** one-time unlocks, subject to App Store Connect.

| Apple product ID | iOS display name (native) | Target list price | Canonical `unlockScopeId` (`contentProductId`) | Current web SKU / name |
|---|---|---|---|---|
| `com.chronowalk.rome.ancient` | Ancient Rome | EUR 6.99 | `rome-essential` | `rome-essential` / Roma Antica |
| `com.chronowalk.rome.historiccenter` | Historic Center | EUR 4.99 | `rome-central` | `rome-central` / Roma Historica |
| `com.chronowalk.rome.complete` | All Central Rome | EUR 9.99 | `rome-complete` | `rome-complete` / Roma Eterna |

There is **no** StoreKit product for free Pantheon.

**Price note (not guessed membership):** web catalog list is €9.99 / €9.99 / €14.99 (`commerce/launchCatalog.json`). Current web **promo** is €4.99 Historica / €6.99 Antica / €10.00 Eterna (`src/lib/launchOffer.js`). iOS targets match the promo band, except Complete €9.99 vs web promo €10.00. Aligning web list/promo with iOS is a **separate** decision.

Do **not** hard-code currency strings in iOS UI. StoreKit supplies localized prices.

---

## 6. Audit sources (do not invent stops)

Inspected for this amendment:

| Source | What it is |
|---|---|
| `src/i18n/audio/heroStopAudioMap.js` `HERO_STOP_IDS` | Canonical **21 Hero** IDs |
| `src/content/rome/manifest.json` | Geo, acts, sequences, `w11_12` combined label |
| `src/data/tourTiers.js` `TOUR_TIER_WAYPOINTS` | Paid **journey pace** membership |
| `commerce/launchCatalog.json` | Launch SKUs + marketed `stopCount` |
| `src/data/central-rome-tour.js` | Historica landing 8 slugs |
| `src/data/rome-antica-tour.js` | Antica landing slug walk |
| `src/landing/landingTierRoutes.js` | Landing map walk order |
| `src/data/forumWaypoints.js` | 8 Forum **landing** slugs (not all are Heroes) |
| `src/data/freePreview.js` | Current **web** free preview = Colosseum |

### Count mismatches (real, do not paper over)

| Claim | Actual |
|---|---|
| Catalog `rome-central` `stopCount: 8` | Landing `CENTRAL_ROME_TOUR` = 8 slugs. Journey `CENTRAL` pace = **10** IDs (`w14…w21` plus `w23` and `w22`). |
| Catalog `rome-essential` `stopCount: 12` / manifest `classicVisitStopCount: 12` | Journey `CLASSIC` visit Heroes = **11** IDs (excludes `pause`). `w11_12` has `publicPlaceCount: 2` (Severus + Curia), which is how marketing can say 12 **places**. |
| Forum landing slugs = 8 | Hero Forum experiences = **6** IDs (`w03`, `w06`, `w07`, `w08`, `w10`, `w11_12`). `forum-temple-saturn` has **no** Hero ID. `forum-curia-julia` is a **chapter of `w11_12`**, not a separate Hero. |
| Path A sequence includes `w22` | `w22` is act `encore`, ~30 min from centro. Not Historic Center geography. |

---

## 7. Proposed Rome zone membership (Hero IDs)

**Proposal rule:** iOS geographic scopes reuse **current paid contentProductId membership** (Antica / Historica / Eterna), minus putting Via Appia in Historic Center, plus an explicit free Pantheon grant.

Discoveries: **none exist in the current catalog.** When they ship (P1), each Discovery must declare `cityId` + `unlockScopeId`s. Do not invent Discovery IDs here.

### FREE (platform grant, not IAP)

| Hero ID | Title | Notes |
|---|---|---|
| `w17` | The Pantheon | Full experience |
| `w23` | Pantheon interior | Full experience |

Also contained in Historic Center and All Central Rome (overlap is correct).

### ANCIENT ROME → `rome-essential`

Archaeological cluster. Matches current Roma Antica / `CLASSIC` visit Heroes.

| Hero ID | Title | Lat, lng (manifest) |
|---|---|---|
| `w01` | The Colosseum | 41.8902, 12.4922 |
| `w02` | Colosseum interior | 41.8904, 12.4924 |
| `w04` | The Palatine | 41.8886, 12.4872 |
| `enc_circus` | Circus Maximus View | (expansion / Palatine terrace view) |
| `w03` | Arch of Titus | 41.8905, 12.48835 |
| `w06` | Basilica of Maxentius | 41.89175, 12.488 |
| `w07` | Via Sacra | 41.89255, 12.48535 |
| `w08` | Temple of Vesta | 41.89182, 12.48715 |
| `w10` | The Rostra | 41.89282, 12.48518 |
| `w11_12` | Arch of Septimius Severus | 41.89301, 12.48442 — **includes Curia Julia chapter** |
| `w13` | Capitoline Hill | Forum west / Campidoglio |

**11 Hero IDs.** Not in this scope: Saturn landing pin, `pause`.

### HISTORIC CENTER → `rome-central`

Centro corridor. Matches current Roma Historica landing 8, plus Pantheon interior (`w23`) which is already on the Historica **journey** list.

| Hero ID | Title |
|---|---|
| `w14` | Trajan's Market |
| `w15` | Spanish Steps |
| `w16` | Fontana di Trevi |
| `w17` | The Pantheon (also FREE) |
| `w23` | Pantheon interior (also FREE) |
| `w18` | Piazza Navona |
| `w19` | Campo de' Fiori |
| `w20` | Largo di Torre Argentina |
| `w21` | Castel Sant'Angelo |

**9 Hero IDs.** **Exclude `w22` Via Appia** from this scope (see flags).

### ALL CENTRAL ROME → `rome-complete`

Union of Ancient Rome + Historic Center + encore Appia = **all 21** `HERO_STOP_IDS`.

| Extra vs the two zones | Title |
|---|---|
| `w22` | Via Appia Antica (encore) |

Owning Complete unlocks every current Rome Hero (and future Discoveries tagged `rome-complete` / city-wide).

---

## 8. Overlaps / gaps / flags

| Item | Status | Recommendation |
|---|---|---|
| Pantheon in FREE and Historic Center | Overlap | Keep. Paywall must **not** fire for `w17`/`w23`. Buying Historic Center still includes them. |
| Ancient ∩ Historic Center Heroes | **Empty** (if membership above is used) | Keep disjoint zones; Complete is the union + Appia. |
| `w13` Capitoline | In current Antica; user copy named Forum cluster, not Capitoline | **Keep in Ancient Rome** (Forum western hill; current `rome-essential`). |
| `w15` Spanish Steps | In current Historica landing 8; user corridor copy did not name it | **Keep in Historic Center** (centro; current `rome-central`). |
| `w22` Via Appia | On Historica **journey** list and Eterna; **not** on Historica landing 8; 30 min south | **Complete only**, not Historic Center. |
| `forum-temple-saturn` | Landing pin, no Hero ID | Do **not** sell as a Hero. Gap vs some landing maps. |
| Curia Julia | Chapter of `w11_12`, not `HERO_STOP_IDS` | Covered by Ancient Rome via `w11_12`. |
| `pause` | Scripted rest | Never a product member. |
| Discoveries | Zero in repo | No membership to assign. |
| Catalog stop counts 8 / 12 vs Hero ID counts 9 / 11 | Marketing vs ID systems | iOS copy should describe **places / coverage**, not reuse mismatched stopCount blindly. |
| Web free preview = Colosseum | iOS free = Pantheon | Platform-specific; do not silently change web `/preview`. |
| Existing `/welcome` | Web post-purchase `WelcomeFlow` | Native first-run `/welcome` is a **new** screen. Do not reuse city-prism WelcomeFlow as the free front door. |

---

## 9. Locked-content behavior

- Locked premium Heroes **remain visible** in Discover and Map.
- Ranker may show them; they must be labeled locked / coverage-gated.
- Ranker must **not** treat a locked Hero as the playable primary if a playable alternative exists, unless product later decides otherwise (default: prefer playable).
- Starting (play / walk-to-experience / unlock-to-play) a locked Hero opens the **contextual paywall** for the smallest covering offering, plus Complete.

---

## 10. Contextual paywall rules

Do **not** show a purchase wall before the traveler has seen the product (Welcome → free loop).

When the traveler **starts** locked premium content:

1. Identify covering `offeringId`s (zone that contains the Hero, plus Complete).
2. Show coverage copy, not Historica / Antica / Eterna in native iOS.
3. Primary CTA: unlock the relevant zone — **StoreKit localized price**.
4. Secondary CTA: unlock All Central Rome — **StoreKit localized price**.
5. Tertiary: Restore Purchases.
6. Optional: Restore Purchases (Apple) and “I bought ChronoWalk elsewhere” (claim) — not first-run.

Example (copy intent, not final strings):

> Keep exploring Ancient Rome  
> Unlock the Colosseum, Forum, Palatine and the discoveries between them.  
> [ Unlock Ancient Rome — {storekit price} ]  
> [ Unlock All Rome — {storekit price} ]  
> Restore Purchases

No hardcoded `€6.99` in runtime UI.

Paddle / Lemon checkout must **not** run inside the iOS binary.

---

## 11. Restore and web compatibility

| Path | Who | Mechanism |
|---|---|---|
| Restore Purchases | Apple buyers | StoreKit restore → map Apple product ID → `unlockScopeId` → existing access credential |
| `/access` email / code / token | Web / Viator / Paddle buyers | Existing access flow; **secondary** on iOS |
| Web site checkout | Browser | Paddle unchanged |

Same Hero membership for `rome-essential` / `rome-central` / `rome-complete` on both platforms.

Reviewer Mode remains a **non-purchase** grant for App Review (contract P0.14), not a StoreKit SKU.

---

## 12. Future city pricing extensibility

Offerings are data on the city, not globals.

```text
cities.rome.offerings = [ancient, historic-center, complete] + free grant
cities.santiago.offerings = [city-pass]          # hypothetical
```

Do not assume every city has three zones.  
Do not assume every city has a free Hero.  
Do not implement Santiago in 1.0.

---

## 13. Unresolved upgrade / crossgrade

Apple non-consumables do **not** give a built-in “pay the difference” upgrade.

Open questions (must be decided before StoreKit implementation, target 25 Aug):

1. If the traveler owns Ancient Rome, can they buy Complete at full price, or is there an upgrade SKU?
2. If they own **both** zones, do they automatically receive Complete (including Appia), or must they buy Complete for `w22`?
3. If they own Complete, zone SKUs must be treated as already satisfied (hide / disable buy).
4. Web promo €10.00 Complete vs iOS target €9.99.
5. Whether web landing copy stays Historica / Antica / Eterna while iOS uses geographic names.

Until decided: **do not** implement upgrade SKUs; document the chosen rule in this file.

---

## 14. Implementation boundary

This document is planning only.

Later tasks may add data tables for membership. They must not invent Heroes, must not point `server.url` at production, and must not ship Paddle in the iOS binary.
