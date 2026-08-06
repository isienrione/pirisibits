# Native app entry

## Status

**Native iOS product-first home.** The Capacitor shell opens into an app home
built from the runtime catalog — not the public marketing landing page.

Web/PWA `/` continues to serve `ChronoWalkLanding` unchanged.

## Web vs native entry

| Runtime | Root `/` behavior |
|---------|-------------------|
| Browser / PWA | Existing `PublicLandingRoute` → marketing landing |
| Capacitor native | `NativeAppEntry` via `shouldUseNativeAppEntry()` |

Implementation: `RootEntryRoute` in `AppRouter.jsx` wraps the decision.
AppRouter is otherwise unchanged — deep links (`/journey`, `/preview`, …) still work.

## Native route selection

```
src/native/
  nativeEntryRouting.js   # catalog model + continue/preview helpers
  NativeAppEntry.jsx      # city list | city home | products
  NativeCityHome.jsx
  NativeProductList.jsx
  nativeEntry.css
```

`getNativeEntryModel()`:

1. Load `getPublishedCities()` (fixtures like harbor never appear).
2. **One city** → present that city home directly (Rome today).
3. **Multiple cities** → city list, then drill into a selected city (no Rome-only branch).
4. **Zero cities** → controlled empty / error state.

## One-city behavior

Rome is presented as the city card with:

- Continue current walk (when `isResumableJourney`)
- Explore Rome → product list
- Try the Pantheon stop free → `/preview`
- Restore Purchases
- Offline / download status line (via download service when available)

## Product selection

Solo commerce SKUs for the city (`kind === 'solo'`):

- Roma Eterna (`rome-complete`)
- Roma Antica (`rome-essential`)
- Roma Historica (`rome-central`)

Derived from `listCommerceProducts()` + `getCityIdForProduct` — not a second
Rome-only catalog. Couples/Family stay off this list.

Prices: show StoreKit `localizedPriceString` when the purchase service returns
them; otherwise “Price unavailable until App Store products are enabled”.
Never treat Paddle/catalog cents as the native price label.

## Purchase safeguards

- `canInvokePaddleCheckout()` must be false on native; CTAs check this first.
- Purchase uses `PurchaseService` / StoreKit only when `canPurchaseProduct` allows.
- Otherwise fail closed with a controlled message (e.g. Apple IAP not configured).
- Restore Purchases is always visible on the native home.

## Progress resume

Uses existing `isResumableJourney` + `getActiveWalkPath` — no new progress store.

## Offline / download status

Reads `getDownloadService().getDownloadStatus(primaryProductId)` for a status
line (“Available offline”, etc.). Does not change download manager internals.

## Future multi-city

Adding Athens requires a published city package + commerce city mapping.
The entry model already switches to a city list when `cities.length > 1`.

## What remains for later native UX

- Richer city artwork / hero photography
- Entitlement-aware “Owned” badges after server-verified Apple grants
- Full PurchaseService migration of every CTA
- Tab-bar integration polish for native-only screens
- Offline download start from the home card
