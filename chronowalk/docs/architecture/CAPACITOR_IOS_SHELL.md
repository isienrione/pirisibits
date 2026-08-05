# Capacitor iOS shell

## Status

**PR 6 — native shell foundation.** Web/PWA on chronowalk.com remains the
primary distribution. Capacitor packages, config, platform detection, and a
**temporary** iOS project under `native-review/ios/` prepare App Store work
without overwriting a Mac-local untracked `chronowalk/ios/`.

## Audit findings (this workspace)

| Check | Result |
|-------|--------|
| Capacitor deps on `figma` / prior HEAD | Absent (reverted) |
| `capacitor.config.*` | Absent before this PR |
| Tracked `ios/` | Absent |
| Cursor workspace `ios/` | Absent (does **not** prove Mac `ios/` is disposable) |

### History

1. **PR #165** (`cursor/capacitor-ios-shell-d3ad`, commit `f094cbf`) added Capacitor 8,
   `capacitor.config.json`, a full `ios/` Xcode tree, `nativePlatform` helpers, SW/PWA
   install guards, and docs.
2. **PR #201** (`cursor/revert-pr165-capacitor-2754`) reverted that merge because it was
   an **accidental merge** onto `figma` — not because Capacitor itself failed QA.
3. **PR #249** (`cursor/capacitor-ios-app-store-59ee`, commit `33480df`) re-proposed a
   similar shell; it remains open and is **not** on `figma`.

This PR does **not** restore that work wholesale. It reuses the safe ideas
(detection, skip SW, hide A2HS) under `src/platform/runtime/` and keeps the
generated Xcode tree off `chronowalk/ios/`.

## Parallel distributions

| Channel | Mechanism |
|---------|-----------|
| Web / PWA | `npm run build` → Cloudflare Pages from `figma` |
| Native iOS | `npm run ios:sync` → Capacitor bundles `dist` into the iOS app |

## Config rules

- `appId`: `com.chronowalk.app`
- `appName`: ChronoWalk
- `webDir`: `dist`
- **No production `server.url`** — the WebView loads bundled assets
- Config file: `capacitor.config.json` (JSON so Capacitor CLI `require()` works with `"type": "module"`)
- `ios.path`: `native-review/ios` (see safety procedure below)

## Platform detection

`src/platform/runtime/`:

- `isNativePlatform()` / `isNativeIOS()` / `isWebPlatform()` / `getPlatformName()` / `getAppRuntime()`
- `getAppCapabilities()` — central flags for SW, A2HS, browser reset-shell, Paddle web checkout

Web is the default when Capacitor is absent.

## Service worker / PWA separation

- Web: existing `startPwaRegistration()` path unchanged in behavior when capabilities allow SW
  (still gated by `SERVICE_WORKER_BOOT_DISABLED` today).
- Native: `canRegisterServiceWorker()` is false → registration and PWA recovery/migration
  flows are skipped so Safari/Chrome reset-shell logic never runs in the shell.
- A2HS / install prompts: `canOfferPwaInstall()` false on native (`usePwaInstall` / `shouldOfferPwaInstall`).

## Existing untracked `ios/` safety procedure (Mac)

The real Mac may already have an **untracked** `chronowalk/ios/`. Never run
`npx cap add ios` aimed at that path without a backup.

1. On the Mac, inspect: `ls -la chronowalk/ios` (and `git status --short chronowalk/ios`).
2. If present, **back it up outside the repo**, e.g.  
   `cp -R chronowalk/ios ~/Desktop/chronowalk-ios-backup-$(date +%Y%m%d)`.
3. Compare with this PR’s review project: `diff -rq chronowalk/ios chronowalk/native-review/ios`  
   (or open both in Xcode).
4. Only then decide to:
   - keep the Mac `ios/` and point `capacitor.config.json` `ios.path` at `ios`, or
   - replace after backup, or
   - promote `native-review/ios` → `ios` deliberately in a later PR.
5. Sync: `cd chronowalk && npm ci && npm run ios:sync && npm run ios:open`.

**This Cursor workspace must not delete or overwrite `chronowalk/ios/`.**
`.gitignore` includes `/ios/` so a Mac-local untracked tree is not accidentally
staged while the review project lives under `native-review/ios/`.

## Mac commands

```bash
cd chronowalk
npm ci
npm run ios:doctor
npm run ios:sync    # builds web first, then cap sync ios → native-review/ios
npm run ios:copy    # copy web assets only
npm run ios:open    # opens Xcode (Mac only)
```

Signing, provisioning, App Store Connect, Associated Domains, Push, Background
Modes, and precise location are **not** configured here — add them in Xcode
Signing & Capabilities when those feature PRs land.

## Out of scope (later PRs)

- StoreKit / IAP
- Background audio / Media Session beyond current web
- Background location / geofencing plugins
- Push notifications
- Exposing Paddle checkout inside the native app

Native offline downloads: see [NATIVE_DOWNLOAD_MANAGER.md](./NATIVE_DOWNLOAD_MANAGER.md) (PR 7).

## Rollback

1. Remove Capacitor deps + `capacitor.config.json` + `native-review/ios` + platform runtime.
2. Revert the minimal SW / PWA install guards.
3. Web `npm run build` never required Capacitor; Cloudflare deploys stay valid.

## Scripts

| Script | Behavior |
|--------|----------|
| `npm run build` | Web only (unchanged) |
| `npm run ios:sync` | `build` then `cap sync ios` |
| `npm run ios:copy` | `cap copy ios` |
| `npm run ios:open` | `cap open ios` |
| `npm run ios:doctor` | `cap doctor` |
