# ChronoWalk iOS identity and commerce model

**Status:** FROZEN product architecture (amended 2026-08-18, identity revision)  
**Contract:** [`IOS_1_0_CONTRACT.md`](./IOS_1_0_CONTRACT.md)  
**Rome coverage membership (Hero tables):** [`IOS_COMMERCE_MODEL.md`](./IOS_COMMERCE_MODEL.md)  
**This file does not implement auth, StoreKit, or Welcome.** Runtime ships in later tasks.

The native app is **not** an access-code product. The model is:

```
GUEST
  → optional CHRONOWALK ACCOUNT
    → canonical ENTITLEMENTS
```

Purchases (Apple, Paddle/web, Viator, other authorized channels) are **evidence**.  
Entitlements are **what the traveler may play**.  
Access codes are **legacy / external purchase claiming only**.

---

## 1. Four objects (must not collapse)

| Object | Question | iOS 1.0 meaning |
|---|---|---|
| **A. User / Account** | Who is this traveler? | Optional ChronoWalk account (Apple / Google / email). Guests have a local identity, not an account. |
| **B. Journey state** | What have they done / chosen? | Context, interests, time budget, progress, completed Heroes, journal, recommendation context. Local for guests; attachable to an account. |
| **C. Purchase** | What transaction happened? | StoreKit, Paddle, Viator, etc. Immutable commercial evidence. Not a login. |
| **D. Entitlement** | What content may they access? | Canonical rows: city + scope + source + status. Derived from purchases, free grants, reviewer grants, or claims. |

**Anti-patterns (current web, must not remain the iOS architecture):**

- Treating `hasValidLocalAccess()` / device credential as “the user”
- Treating `purchases.content_product_id` as the only identity key
- Sending first-run travelers to `/access` to become a person
- Keying cloud journey progress only to a purchase claim token

---

## 2. Audit: what exists today (reuse vs replace)

Inspected: `src/lib/supabase.js`, `access.js`, `accessSession.js`, `accessHandoff.js`, `journeyCloud.js`, `deviceId.js`, `familyWalk.js`, `services/tourEntitlements.js`, `requireAccess.jsx`, `nativeAppEntry.jsx`, `supabase/migrations/20260721_launch_commerce_hardening.sql`, Paddle webhook / `request-access-email`, `purchase_claim_tokens`, `access_credentials`, `journey_progress`.

### 2.1 There is no ChronoWalk account

| Finding | Evidence |
|---|---|
| No Supabase Auth API usage | Client is `createClient(url, anonKey)` only. **Zero** `signInWithOAuth`, `signInWithIdToken`, `signInWithOtp`, `auth.getSession` in app code. |
| No `auth.users` / profiles schema | Migrations are commerce + walk-session, not identity. |
| Closest “who” | `purchases.email` (Paddle buyer, not a login) and `cw_device_id` (anonymous install id). |

**Implication:** Account is a **new** layer on top of existing Supabase. Do not pretend device credentials are users.

### 2.2 Reuse (keep)

| Piece | Role after this architecture |
|---|---|
| `purchases` | **Purchase** records (Paddle/web). Add `source` later for `apple` / `viator` without replacing the table. |
| `content_product_id` / `launch_sku_entitlement()` | Map paid SKUs → canonical **scope** (`rome-essential` ↔ ancient, `rome-central` ↔ historic-center, `rome-complete`). |
| `purchase_claim_tokens` + `redeem_purchase_claim` | **External purchase claiming** (email / code). One-time hashed claims, 7-day expiry, purposes `initial` / `restore` / `operator_recovery`. |
| `request-access-email` + fulfillment outbox + Resend | Email a claim link to web/Viator buyers. Keep. Relabel UX as “I bought elsewhere.” |
| `access_credentials` | Device-bound **session secret** after a claim. Keep for claimed web purchases and offline lease (48h). Do **not** require it to use the app as a guest. |
| `validate_device_access` | Revalidate a claimed credential. Keep for claimed sessions. |
| Paddle webhook | Continues to write **purchases** + claim tokens. Does not create accounts. |
| `getDeviceId()` / `cw_device_id` | Install id for binding and analytics buckets — not an account. |
| Local journey snapshot | Guest **journey state**. Must remain writable with no credential. |
| Family bundles / seats / invite codes | Seat sharing for Couple/Family **web** products. P1 for native IAP. Do not make invites the iOS identity system. |

### 2.3 Replace / stop using as primary iOS identity

| Piece | Why |
|---|---|
| `getNativeRootRedirect()` → `/access` if `!hasValidLocalAccess()` | T02 runtime. **Superseded.** First-run is `/welcome`; guests go to `/home`. |
| `RequireAccess` wrapping product Home / walk | Blocks guests. Paid **start** of locked Heroes should paywall; browsing and free Pantheon must not require a credential. |
| `journeyCloud.js` keyed only by purchase token | Progress must survive guest use and later attach to an account. |
| `tourEntitlements.js` local owned-tour list as source of truth | Display cache only. Canonical entitlements live on the server once an account or validated purchase exists. |
| `accessHandoff.js` (`cw_h` / cookie) | PWA Home Screen partition hack. Not needed as native identity. Do not delete for **web** PWA. |
| Treating `purchases.access_token` as a reusable bearer | Already retired in hardening migration. Do not revive. |

### 2.4 Add (new)

- Supabase Auth (Apple, Google, email) — see §6
- `profiles` (minimal) keyed by `auth.users.id`
- `entitlements[]` rows independent of a single `purchases.content_product_id`
- Guest local id + **guest → account** migration of journey state
- In-app **account deletion**
- Settings → Purchases & Access → “I bought ChronoWalk elsewhere” (reuses claim RPCs)

---

## 3. Guest mode

A new iOS traveler must **not** be required to purchase, enter an access code, enter an email, or create an account before understanding ChronoWalk.

### Capabilities (guest)

- Complete Context
- Use Discover / Near Me
- Browse Map and all visible Rome inventory
- Receive recommendations
- Walk / navigate toward available content
- Complete the **canonical free Pantheon** (`w17` + `w23`)
- See locked premium content
- Reach contextual paywalls (purchase may then prompt account — §5)
- Use Settings that do not require an account

### Persistence

- Store a stable **guest id** locally (new key; not the device credential).
- Persist Context, progress, completed Heroes, journal drafts **locally**.
- Design the blob so it can be **copied onto a ChronoWalk account** on first sign-in (merge rules in §11).
- Do not call `redeem_purchase_claim` to “create” a guest.

### Free grant

Every guest and every account implicitly holds entitlement scope `rome-free` (Pantheon full experience + browse). This is not a StoreKit product and not a Paddle SKU.

---

## 4. ChronoWalk account

Optional persistent identity. **Not** the first screen.

Will eventually own / reference:

- profile (minimal)
- language
- interests / preferences
- journey progress
- completed experiences
- journal
- canonical entitlements
- purchase claims / linked purchases

### iOS 1.0 auth targets (do not implement in this commit)

1. **Sign in with Apple** (required if any other social login ships — App Store 4.8)
2. **Continue with Google**
3. **Continue with email**
4. **Not** Facebook

Exact provider wiring: §6.

---

## 5. When account creation appears

Do **not** make signup the first screen.

```
WELCOME
  → FREE EXPLORATION
    → FREE EXPERIENCE
      → account at a persistence / purchase moment
```

**May** prompt when the traveler wants to:

- save / sync journey across devices
- purchase / unlock premium Rome
- restore / link external purchases
- use other account-dependent features

**Must not** prompt for:

- opening the app
- Context
- Discover browse
- starting or completing free Pantheon

Welcome secondary CTA is **Sign in** (for returning account holders), not access-code paste.

Exact copy/timing should minimize activation friction. Prefer after a completed free experience or at the paywall, not mid-walk.

---

## 6. Proposed auth implementation (existing repo)

**Platform:** enable **Supabase Auth** on the same project the app already uses (`src/lib/supabase.js`). No second BaaS.

| Provider | Approach | Notes |
|---|---|---|
| Apple | Native Sign in with Apple → identity token → `supabase.auth.signInWithIdToken({ provider: 'apple' })` | Capacitor plugin later; App Store 4.8 if Google is enabled. Hide email by default (`email` / `email_verified` only if user shares). |
| Google | Native Google Sign-In or OAuth → `signInWithIdToken({ provider: 'google' })` | Collect email only. No People API / social graph. ATT not required for sign-in itself. |
| Email | `signInWithOtp` (magic link or OTP) via existing **Resend** transactional path | Fits current email stack better than passwords. Do not invent a password UX for 1.0 unless OTP is blocked. |

**Do not** use the existing `purchases.email` column as Auth. That email identifies a **buyer**, who may later **claim** into an account.

**Session:** Supabase Auth session is **User**. Device credential remains a **claimed purchase session**, attachable to `user_id` when known.

**Web:** Auth can land after iOS; web may keep claim-link unlock. Do not break Paddle email claims.

---

## 7. Apple / Google / email implications

| Topic | Requirement |
|---|---|
| Sign in with Apple | Mandatory if Google (or any third-party login) ships. Hide-my-email must work. |
| Account deletion | Mandatory in-app if accounts exist (5.1.1(v)). See §12. |
| App Privacy | Declare Sign in with Apple / Google as Account data; email if collected; no tracking from login. |
| Google | Prefer no extra profile scopes. Do not enable Google Ads in the native binary (existing P0.15). |
| Email | Magic link / OTP; do not require a password. |
| Guest | Core product remains usable signed out. |
| StoreKit Restore | Uses Apple ID, **independent of ChronoWalk account**. Never require an access code for Apple purchases. Linking the Apple transaction to a ChronoWalk account is a later attach step, not a Restore prerequisite. |

---

## 8. Native first-run flow

```
IF ChronoWalk Auth session exists
  → /home
ELSE IF guest has completed native onboarding
  → /home
ELSE
  → /welcome
```

| State | Destination |
|---|---|
| First-run guest | `/welcome` |
| Returning guest (onboarding done) | `/home` |
| Returning authenticated user | `/home` |
| Sign in (Welcome secondary) | Auth sheet / `/sign-in` — **not** `/access` |
| I bought elsewhere | Settings → Purchases & Access (claim UI; may reuse `/access` internals) |

`/home` is Discover / Near Me for guests and accounts (Context first if unset).

Web `/` remains the marketing landing.

**Welcome:** cinematic ChronoWalk brand (reuse `/landing/intro-open.mp4` + poster; fallback `LANDING_HERO`). Concise proposition. Primary: **Start exploring — free** → Context. Secondary: **Sign in**. Do not invent a logo. Do not reuse post-purchase `WelcomeFlow` as this screen.

**Supersedes:** native unentitled → `/access` (T02 runtime `nativeAppEntry.jsx`).

---

## 9. Access codes = external purchase claiming

**Do not delete** claim infrastructure.

Reclassify:

```
Account or Settings
  → Purchases & Access
    → “I bought ChronoWalk elsewhere”
      → access code / email-link claim
        → redeem_purchase_claim
          → attach canonical entitlement to ChronoWalk account (or local claimed session if still guest)
```

Supports existing Paddle/web, Viator, and legacy customers.

`/access` is **not** native onboarding. It may remain as the claim route (web + deep link `?token=`) and as the Settings subflow.

Apple IAP never uses this path for a first-time Apple buy.

---

## 10. Canonical entitlements

City-independent. Offerings and scopes are **configuration**, not a global “three zones” type.

```
user | guest
  → entitlements[]
       cityId
       scopeId
       source            // apple | paddle | viator | free | reviewer | claim
       sourceTransactionId
       grantedAt
       status            // active | revoked | refunded
```

### Rome scopes (iOS 1.0)

| Canonical `scopeId` | Meaning | Maps from today’s `contentProductId` |
|---|---|---|
| `rome-free` | Browse + full Pantheon | *(new implicit grant; not a Paddle SKU)* |
| `rome-ancient` | Ancient Rome coverage | `rome-essential` |
| `rome-historic-center` | Historic Center coverage | `rome-central` |
| `rome-complete` | All central Rome Heroes | `rome-complete` |

Future city example (not in 1.0): `santiago` + single scope `santiago-complete`.

Commerce **offerings** (what is sold) and entitlement **scopes** (what is granted) are data on the city. Apple product IDs are another mapping onto the same scopes:

| Apple product ID | Grants `scopeId` |
|---|---|
| `com.chronowalk.rome.ancient` | `rome-ancient` |
| `com.chronowalk.rome.historiccenter` | `rome-historic-center` |
| `com.chronowalk.rome.complete` | `rome-complete` |

StoreKit transaction → validation → **entitlement row**. Restore Purchases replays Apple transactions into the same table. No access code.

Paddle `product_id` / `content_product_id` → same scopes so web and Apple do not diverge.

Hero membership for each Rome scope: [`IOS_COMMERCE_MODEL.md`](./IOS_COMMERCE_MODEL.md) §7 (audited; do not guess).

Locked premium remains visible. Start locked content → contextual paywall (zone + All Central Rome, StoreKit localized prices, Restore). Hard-coded `€` strings are forbidden in runtime UI.

---

## 11. Guest → account migration

On first successful Auth:

1. Read local guest journey state.
2. If account already has cloud journey, **merge** (prefer union of completed Heroes; do not wipe the richer side without confirmation).
3. Attach any locally claimed device credentials / entitlements to `user_id`.
4. Retire guest id as the primary key; keep it as `migrated_from` for support.

If the traveler signs in **before** any local progress, skip merge.

Do not require migration to keep using the app as a guest.

---

## 12. Account deletion and privacy

Because iOS 1.0 **targets** accounts:

- **In-app account deletion** (Settings), not “email us.” Apple 5.1.1(v).
- Deletion removes Auth user + profile + cloud journey/journal bound to the account.
- Purchase / entitlement **records** may be retained as financial evidence but must be **unlinked** from personal profile (email hashed or dropped per legal review). Device may remain in guest mode with local progress if the user chooses to keep the install.
- Collect **minimal** profile: auth subject, optional email, language, preferences. No Facebook, no extra Google profile, no contacts.
- Privacy policy + App Privacy nutrition must list Apple/Google/email sign-in **only if shipped**.
- Guest usage remains available for core non-account functionality.
- PostHog: no email as distinct id unless the user is signed in and policy allows; still no session replay on iOS (P0.15).

---

## 13. Migration path for existing web / Viator customers

They already have a **purchase** + email + claim tokens. They do **not** have a ChronoWalk Auth user.

1. Install iOS app → guest Welcome → free use.
2. Settings → Purchases & Access → **I bought ChronoWalk elsewhere** → paste code or request email link (`request-access-email` / `redeem_purchase_claim`).
3. Claim creates/validates `access_credentials` and grants the matching **entitlement scope** (same `content_product_id` as web).
4. Optional: Sign in → attach that entitlement + journey to the account (so the next device does not need the code again).

Deep links `https://chronowalk.com/access?token=` remain valid for web and can open the claim flow in the app if Universal Links are added later (not required to invent in this docs task).

Couple/Family invite codes remain a **seat claim**, not account signup.

---

## 14. Implementation boundary

This document is planning only.

Later tasks must not collapse A–D into one localStorage boolean, must not restore `/access` as first-run, must not put Paddle in the iOS binary, and must not ship Facebook login.
