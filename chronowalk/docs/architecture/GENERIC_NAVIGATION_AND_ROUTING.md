# Generic navigation and routing

## Status

**PR 5 — architecture bridge.** `AppRouter` and all public Rome URLs are
**unchanged**. This layer describes platform → city → product → route → journey
navigation without rewriting React Router.

## Generic routing model

```text
Platform
  └─ Published cities          getPublishedCities() / getCityRoute(cityId)
       └─ Products             getProductRoute(productId)
            └─ Routes          getJourneyRoute(routeId)
                 └─ Journey    (live experience; still /journey today)
```

Module: `src/navigation/`

| API | Role |
|-----|------|
| `getPublishedCities` | Published cities from runtime catalog |
| `getCityRoute` | Future `/{citySlug}` |
| `getProductRoute` | Future `/{city}/{product}` |
| `getJourneyRoute` | Future `/{city}/{product}/journey` |
| `resolveDeepLink` | Parse legacy + future URLs → `NavigationTarget` |
| `resolveLegacyRomeRoute` | Current public Rome paths |
| `resolveCitySlug` / `resolveProductSlug` / `resolveRouteSlug` | Slug helpers |

`NavigationTarget`: `{ kind, cityId, productId, routeId, stopId, pathname, query, isLegacy, isFuture, known }`

## Legacy compatibility

Current customer URLs continue to resolve via `resolveLegacyRomeRoute` /

`resolveDeepLink`:

| URL | Target kind |
|-----|-------------|
| `/`, `/landing` | landing |
| `/begin` | begin |
| `/journey` | journey |
| `/letter`, `/complete` | complete |
| `/free-pantheon`, `/preview…` | preview (Pantheon `w17`) |
| `/purchase`, `/checkout` | purchase |
| `/access`, `/access/confirmed` | access |
| `/invite` | invite |
| `/setup`, `/tour`, `/map`, `/journal`, `/settings`, `/walk-together` | app shell |

**Do not remove these paths.** AppRouter remains the source of truth for what
the browser mounts.

## Future city URLs (capability only — not public yet)

Examples (not wired into `AppRouter`):

- `/rome`
- `/rome/eterna`
- `/rome/eterna/journey`
- `/athens`, `/paris` (resolve as future; `known: false` until published)

Rome marketing slug `eterna` ↔ catalog product `rome-eternal`.

## Deep-link strategy

1. Parse path + query (`token`, `tier`, `code`, etc.).
2. Match **legacy** public routes first (preserve Rome UX).
3. Else match **future** `/{city}/…` capability shapes.
4. Unknown → `{ kind: 'unknown', known: false }` (safe failure).

Does not change `window.location` or React Router.

## Rome compatibility

- Only published city today: **Rome**.
- Harbor fixture never appears in `getPublishedCities()`.
- Preview stop remains Pantheon (`w17`) for `/free-pantheon` / `/preview`.

## Future App Store deep links

Later native shells can hand the same URL strings to `resolveDeepLink` /

`resolveLegacyRomeRoute` (Universal Links / App Links) without forking Rome
path tables. StoreKit purchase return URLs stay out of scope until commerce
wiring.

## PR 6 responsibilities (planned)

- Optionally register selected future city/product routes in AppRouter behind
  flags, still keeping legacy URLs.
- Wire experience entry points to `NavigationTarget` instead of hard-coded
  Rome paths where safe.
- App Store / Universal Link entitlements association.
- Still no customer-visible change unless explicitly scoped.
