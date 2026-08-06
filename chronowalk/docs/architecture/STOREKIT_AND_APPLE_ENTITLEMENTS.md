# StoreKit and Apple entitlements

## Status

**PR 8 — StoreKit architecture foundation.** Paddle remains the exclusive web/PWA
checkout provider. Native iOS digital products must use Apple In-App Purchase.
This PR adds purchase-provider selection, Apple product mappings (disabled by
default), transaction normalization, Restore Purchases architecture, and a
server-verification contract.

**No App Store Connect products were created. No real StoreKit purchases were
completed in CI.** Local Xcode StoreKit testing is documented below.

## Channel rule

| Runtime | Checkout |
|---------|----------|
| Browser / PWA | Paddle (`openCheckout` → `openPaddleCheckout`) |
| Capacitor iOS | StoreKit via `@capgo/native-purchases` (StoreKit 2) |
| Other native | Fail closed (`provider: none`) |

`openCheckout` returns `{ ok: false, reason: 'paddle_unavailable_on_native' }`
when `canUseWebCheckout()` is false. Capabilities expose:

- `paddleCheckout` / `webCheckout` — web only
- `storeKitPurchase` — native iOS only

## StoreKit dependency decision

**Chosen:** [`@capgo/native-purchases`](https://www.npmjs.com/package/@capgo/native-purchases) **v8**

| Criterion | Finding |
|-----------|---------|
| Maintenance | Actively published (v8.x, Capacitor 8 line) |
| Capacitor 8 | Major version matches `@capacitor/core@^8.5.0` |
| StoreKit 2 | Yes — plugin documents StoreKit 2 on iOS 15+ |
| Cordova-era | Not used; modern Capacitor plugin with SPM support |

**Rejected alternatives:** abandoned Cordova IAP plugins; Capawesome Purchases
(also StoreKit 2, but Capgo aligns cleanly with our Capacitor 8 + SPM iOS tree).

Plugin id constant: `STOREKIT_PLUGIN_ID = '@capgo/native-purchases'`.

## PurchaseService API

`src/purchases/` — `createPurchaseService()` / `getPurchaseService()`:

- `getPurchaseProvider()`
- `getAvailableProducts(productIds?)`
- `purchaseProduct(productId)`
- `restorePurchases()`
- `canPurchaseProduct(productId)`
- `normalizeAppleTransaction(transaction)`
- `verifyPurchaseResult(result)`
- `refreshEntitlements()`
- `verifyAppleTransaction(request)` (contract stub)

Production screens are **not** fully migrated to PurchaseService in this PR.
Web continues to call `openCheckout` directly (now native-guarded).

## Apple product mappings

Internal IDs unchanged:

| Internal `productId` | Apple product id | Enabled |
|----------------------|------------------|---------|
| `rome-central` | `com.chronowalk.city.rome.historica` | **false** (default) |
| `rome-essential` | `com.chronowalk.city.rome.antica` | **false** |
| `rome-complete` | `com.chronowalk.city.rome.eterna` | **false** |
| `rome-couple` | deferred | **false** + deferred |
| `rome-family` | deferred | **false** + deferred |

- Prices are **not** business truth in mappings — StoreKit supplies
  `localizedPriceString` at runtime (`amountCents: null` on StoreKit products).
- Couple / Family need App Review + seat / Family Sharing design — deferred.

Commerce `providerMappings.js` Apple placeholders remain disabled / unresolved
so existing Paddle commerce tests stay unchanged. Apple id → internal id
resolution lives in `src/purchases/storeKitProductMappings.js`.

## Transaction normalization

`normalizeAppleTransaction` → `CommerceEntitlement` with:

- `source: 'apple'`
- `externalTransactionId` / metadata `originalTransactionId`
- `metadata.serverVerified: false`
- `metadata.verificationState: 'local_unverified'`

Idempotent dedupe uses `entitlementDedupeKey` (`apple::txn::…`).
Revoked / refunded → inactive. A bare `paid=true` boolean is not trusted.

## Restore Purchases

`processRestoredTransactions` / adapter `restorePurchases()`:

1. Read StoreKit transactions from the plugin
2. Normalize + dedupe
3. Optionally update the **local** entitlement view
4. Emit `preparedForVerification` records for a future server endpoint

Does **not** write fake Supabase entitlements or grant server-authoritative
permanent access.

## Server verification boundary

`verifyAppleTransaction({ signedTransaction, transactionId, productId, appAccountToken, idempotencyKey })`

Current implementation always returns `status: 'not_configured'` /
`serverVerified: false` unless the request is invalid.

**Future work:**

- App Store Server API v2 verification of JWS
- App Store Server Notifications V2 for refunds / revokes
- Idempotent grant keyed by `originalTransactionId` / `idempotencyKey`
- Edge Function + secrets in server env (never commit private keys)

## Account linking (`appAccountToken`)

| Scenario | Behavior |
|----------|----------|
| Signed-in user | Server issues UUID `appAccountToken` bound to `subjectId`; pass into StoreKit purchase |
| Guest purchase | Allowed without token; keep local candidate; link on later signup via restore + verify |
| Later account creation | Restore + server verify attaches `originalTransactionId` to the new subject |
| Second device | Restore + server verify — never grant from local boolean alone |

Do not invent anonymous permanent cross-device matching.

## Xcode / App Store Connect (future, manual)

1. In Xcode: Signing & Capabilities → add **In-App Purchase**.
2. Attach local StoreKit config: `native-review/ios/ChronoWalkLocal.storekit`
   (scheme → Run → Options → StoreKit Configuration).
3. Create non-consumable products in App Store Connect matching the Apple ids above.
4. Use sandbox / TestFlight Apple IDs for purchase + restore tests.
5. Configure signing / provisioning for the ChronoWalk app id.
6. Flip mapping `enabled: true` only after products exist and sandbox works.
7. Deploy server verification + ASSN before treating grants as permanent.

## Rollback

1. Remove `src/purchases/` and this doc.
2. Remove `@capgo/native-purchases` + sync iOS.
3. Revert capability / `openCheckout` native guard if desired (web-only guard is
   still correct even without StoreKit).
4. Remove local `.storekit` file.

## What remains unimplemented

- Enabling Apple mappings for production
- Full UI migration to PurchaseService
- App Store Server API / Notifications
- Couple / Family Apple products
- Real device / sandbox purchase certification in CI
