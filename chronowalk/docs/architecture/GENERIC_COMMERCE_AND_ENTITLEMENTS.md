# Generic commerce and entitlements

## Status

**PR 4 — architecture bridge.** Production checkout, webhooks, access checks, and
Supabase schema are **unchanged**. This layer normalizes existing records into
provider-neutral entitlements for future multi-city / multi-store work.

## Generic entitlement model

```js
{
  entitlementId,
  subjectId,
  productId,              // purchased SKU (rome-couple stays rome-couple)
  contentProductId,       // unlocked content (rome-complete for bundles)
  cityId,
  source,                 // paddle | apple | viator | getyourguide | manual | legacy_access_token
  externalTransactionId,
  status,                 // active | revoked | refunded | pending | inactive
  grantedAt,
  revokedAt,
  seatLimit,
  kind,                   // solo | bundle
  metadata,
}
```

Access rule: `isEntitlementActive(entitlement)` — **source does not change semantics**.

No Rome-only booleans (`hasRomeAccess`, etc.).

## Provider-neutral architecture

| Module | Role |
|--------|------|
| `commerceCatalog.js` | Launch SKUs from generated catalog |
| `providerMappings.js` | productId ↔ provider external ids |
| `purchaseAdapter.js` | `normalizePaddlePurchase` / legacy / access-token |
| `legacyPurchaseAdapter.js` | Compatibility helpers, bundle unlocks |
| `entitlementService.js` | In-memory subject API (tests / future) |

## Current Paddle compatibility

**Authoritative SKU matrix:** `commerce/launchCatalog.json`  
**Generated consumer:** `src/lib/generated/launchCatalog.gen.js`  
**Drift check:** `npm run check:commerce-drift`

Actual `pri_*` price IDs stay in env / `app_config` — this layer stores env **key names**
from the catalog, never a second hand-maintained price table.

Launch product IDs (unchanged):

- `rome-central` (Roma Historica)
- `rome-essential` (Roma Antica)
- `rome-complete` (Roma Eterna)
- `rome-couple`
- `rome-family`

Marketing / package aliases resolve only inside this layer (`rome-historica` →
`rome-central`, `rome-eternal` → `rome-complete`) and do **not** rename stored SKUs.

## Legacy access-token compatibility

`normalizeAccessTokenGrant` maps `purchasedProductId` / `contentProductId` /
`seatLimit` / `role` / `bundleStatus` into `source: 'legacy_access_token'`.

Couple and Family remain **distinct** `productId`s; both unlock content
`rome-complete`.

## Source-of-truth rules

1. SKU matrix / amounts / seats / content mapping → `commerce/launchCatalog.json`
2. Runtime Paddle price ids → environment / app config
3. City package product `rome-eternal` → catalog identity (see runtime catalog docs)
4. Do not edit `launchCatalog.gen.js` by hand

## What remains legacy

- `src/lib/access.js` / `accessSession.js` production access checks
- Paddle.js checkout + webhook fulfillment
- Supabase `purchases` / tokens / outbox
- `tourEntitlements.js` localStorage owned tours
- Landing pricing UI

## Future Supabase migration (not this PR)

- Persist `CommerceEntitlement`-shaped rows (or views) beside current purchases
- Backfill from purchases + access grants via the normalizers
- Cut over `hasEntitlement` callers only after dual-read validation

## Future StoreKit / Apple (not this PR)

- Add enabled Apple mappings (`createDisabledAppleMapping` is the stub)
- Implement `PurchaseAdapter` for StoreKit; still emit the same entitlement shape
- No changes to `isEntitlementActive` / unlock helpers required

## Why production access checks are not replaced yet

Replacing access mid-flight risks checkout, email recovery, offline lease, and
bundle seat behavior. PR 4 only adds a side-by-side abstraction + tests so later
PRs can migrate callers safely.

## Next PR

**PR 5** — generic catalog navigation and future city/product routes while
preserving current public URLs. Not implemented here.
