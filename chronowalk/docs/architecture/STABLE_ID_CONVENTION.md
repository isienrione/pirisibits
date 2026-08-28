# Stable ID convention

ChronoWalk identifies catalog entities with **opaque string IDs**. IDs are stable across packages, platforms, and locales. Rome examples below are sample data only — the same rules apply to every city.

## Principles

1. **All IDs are strings** — never numeric indexes, never route positions.
2. **IDs are generic** — field names are `cityId`, `productId`, `routeId`, `stopId`, `contentId`, `assetId`.
3. **Route position is not identity** — a stop keeps one `stopId` whether it is stop 1 or stop 12 on a given route, and whether it appears on one route or many.
4. **Legacy aliases are explicit** — old Rome waypoint keys (`w01`, kebab media slugs) map into stable IDs via an alias table; they do not become the platform identity model.

## City IDs

- Lowercase kebab or single-token slug unique across the platform.
- Prefer a short geographic name, not a marketing phrase.

| Example | Meaning |
|---------|---------|
| `rome` | First published city |
| `florence` | Future city (illustrative) |

## Product IDs

- Scoped by city in the ID string when helpful: `{city}-{product-slug}`.
- One product may include one or more routes.

| Example | Meaning |
|---------|---------|
| `rome-eternal` | Sample Rome tour product |
| `florence-heart` | Illustrative Florence product |

## Route IDs

- Stable walking path identity, independent of SKU packaging renames.
- Prefer `{city}-{product}-{route-slug}` when a product may ship multiple paths.

| Example | Meaning |
|---------|---------|
| `rome-eternal-main` | Primary path for `rome-eternal` |

## Stop IDs

- Place identity inside a city. **Never** encode display order (`stop-01`, `waypoint12`) as the canonical ID.
- Prefer durable place slugs.

| Example | Meaning |
|---------|---------|
| `curia-julia` | Curia Julia stop in Rome |
| `pantheon-exterior` | Pantheon exterior stop in Rome |

The same `stopId` may appear in more than one route. Each route stores a `RouteStopReference` with `{ stopId, displayOrder }`.

## Content IDs

- Localized stop copy / narration units: `{stopId}.{locale}` or a dedicated content slug.
- Example: `pantheon-exterior.en`

## Asset IDs

- Media and transcript files referenced by content or stops.
- Prefer `{stopId}.{kind}` or `{stopId}.{kind}.{variant}`.
- Example: `pantheon-exterior.audio.main`, `curia-julia.image.now`

## Legacy ID aliasing

Today’s Rome live journey still uses parallel ID systems (`w01`…`w22`, kebab media folders, landing package IDs). The multi-city domain does **not** replace those in this PR.

When bridging:

| Legacy form | Maps toward |
|-------------|-------------|
| Manifest waypoint `w12` | stable `stopId` (e.g. `pantheon-exterior`) via alias table |
| Media folder `pantheon` | same stable `stopId` / `assetId` family |
| Landing SKU `rome-complete` | stable `productId` (may keep the same string if already durable) |

Alias tables are one-way compatibility shims. New cities must not invent a second parallel ID system.

## Why route position must not define identity

- The same place can appear in a short route and a long route at different indexes.
- Optional / GPS-optional stops reorder without changing the place.
- Offline packages, entitlements, analytics, and progress keys must survive reordering.
- Cross-route “you were already here” depends on `stopId`, not `displayOrder`.

```text
Route A: displayOrder 0 → curia-julia
Route B: displayOrder 7 → curia-julia
→ one Stop { stopId: "curia-julia" }, two RouteStopReferences
```

## Sample catalog fragment (Rome as sample only)

```js
{
  cities: [{ cityId: 'rome', name: 'Rome' }],
  products: [{ productId: 'rome-eternal', cityId: 'rome', name: 'Rome Eternal' }],
  routes: [{
    routeId: 'rome-eternal-main',
    cityId: 'rome',
    productId: 'rome-eternal',
    name: 'Rome Eternal — main path',
    stops: [
      { stopId: 'curia-julia', displayOrder: 0 },
      { stopId: 'pantheon-exterior', displayOrder: 1 },
    ],
  }],
  stops: [
    { stopId: 'curia-julia', cityId: 'rome', name: 'Curia Julia' },
    { stopId: 'pantheon-exterior', cityId: 'rome', name: 'Pantheon exterior' },
  ],
}
```
