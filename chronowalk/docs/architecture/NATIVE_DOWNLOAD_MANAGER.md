# Native download manager

## Status

**PR 7 — download infrastructure.** Shared, versioned download manifests and
platform adapters (web + Capacitor iOS). Rome remains the only published city.
Production Rome web/PWA offline UI continues to use `src/audio/offlinePackage.js`.

PR 8 will add StoreKit and entitlement synchronization — **not** this PR.

## Shared service and adapters

```
src/downloads/
  downloadService.js      # facade: get/estimate/download/pause/resume/remove/verify
  downloadManifest.js     # city-package → versioned DownloadManifest
  downloadRegistry.js     # commerce/marketing id → package product key
  downloadState.js        # product status machine
  checksum.js             # sha256 verify; never invent checksums
  storageEstimate.js
  adapters/
    webDownloadAdapter.js     # Cache Storage compatibility layer
    nativeDownloadAdapter.js  # Capacitor Filesystem (+ Network status)
```

`createDownloadService()` selects:

| Runtime | Adapter |
|---------|---------|
| Browser / PWA | `web` |
| Capacitor native (`isNativePlatform()`) | `native` |

Web builds must not initialize native plugins; the native adapter loads
`@capacitor/filesystem` and `@capacitor/network` lazily.

## Manifest strategy

Manifests are **generated** from city packages (`assets.json`, routes, metadata):

- `schemaVersion`, `cityId`, `productId`, `locale`, `packageVersion`
- `estimatedBytes`, `files[]` with `assetId`, `type`, `url`, relative `path`,
  `bytes`, optional `checksum`, optional `duration`, `required`, `integrity`
- Types: audio, image, then_now, transcript, route_metadata, map_package, video

**Source of truth:** `src/content/cities/{cityId}/` + runtime catalog.
No second manually maintained Rome asset list.

Checksum policy: **`optional`**. If a package file has no checksum, it is
labeled `integrity: "unverified"`. Inline transcripts are `skipped`.
We never invent checksums.

## Product keys and multi-city

Downloads are keyed by:

`cityId` + **package** `productId` + `locale` + `packageVersion`

Commerce aliases:

| Commerce SKU | Download package product |
|--------------|--------------------------|
| `rome-complete` / `rome-eternal` | `rome-eternal` |
| `rome-couple` / `rome-family` | `rome-eternal` (shared assets; no duplicate package) |

Adding Athens later requires a valid city package + published catalog entry —
not new download engine code.

## Native filesystem layout

Under Capacitor `Directory.Data`:

```
chronowalk/downloads/{cityId}/{productId}/{locale}/v{packageVersion}/files/...
```

- Writes use a `.partial` sibling then rename when possible (atomic-ish finalize).
- Product removal deletes that product tree only — **never** entitlement state.
- Progress persists in an in-memory/local record store (no purchase tokens).

**Limitation:** downloads resume only while the app is active. This PR does not
implement OS background transfer.

## Web compatibility strategy

- Existing Rome prepare/offline flow (`offlinePackage.js`, IndexedDB tour
  packages) is **unchanged** and remains what production screens call.
- The web adapter implements the shared API with Cache Storage bucket
  `chronowalk-downloads-v1` for the new service/tests and future UI.
- Cutover of Rome settings UI to this service is a later PR.

## Integrity and security

- Path traversal rejection (`isSafeRelativePath`)
- Duplicate file id rejection
- Manifest schema validation (domain + strict)
- Checksum verify when present
- Incomplete-download resume via per-file `fileStatuses`
- Download records refuse secret field names (`purchaseToken`, etc.)

## Current limitations

- No checksums in Rome `assets.json` yet (migration: add `checksum` per asset
  when measured; manifests will flip those files to `verified_capable`)
- No background URLSession transfers
- No production download UI redesign (only `useProductDownload` hook for later)
- Map tile packs not yet emitted as first-class `map_package` files from Rome
  (type reserved; existing map offline helper remains separate)
- Web adapter does not automatically sync with `cw_offline_rome_audio_v1`

## What PR 8 does next

- StoreKit / App Store products
- Entitlement synchronization with Apple
- Wire purchase → download eligibility without exposing Paddle in the native shell

## Rollback / cleanup

1. Remove `src/downloads/` and `docs/architecture/NATIVE_DOWNLOAD_MANAGER.md`.
2. Remove `@capacitor/filesystem` / `@capacitor/network` if unused elsewhere.
3. Revert README roadmap row.
4. Web/PWA offline path remains intact without this module.

## Scripts / validation

```bash
npx vitest run src/downloads
npm run build   # still web-only; no Xcode requirement
```
