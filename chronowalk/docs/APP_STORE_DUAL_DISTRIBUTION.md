# Dual distribution: PWA + App Store

## Goal

Ship ChronoWalk on the Apple App Store **without changing** the production web/PWA on `chronowalk.com`.

Two distribution channels, one product experience:

| Channel | How travelers get it | Build path |
|---------|----------------------|------------|
| **Web / PWA** (power app) | Browser + Add to Home Screen | `npm run build` → Cloudflare Pages |
| **App Store** | Native iOS binary | `npm run build:ios` → Xcode / TestFlight |

## Hard boundary (do not blur)

1. **Never** change Cloudflare deploy, PWA install UX, or service-worker behavior for the sake of native — except behind `isNativeApp()` guards that are false on the web.
2. **One React/Vite source tree.** The iOS shell loads the same `dist/` the web build produces.
3. **Separate npm scripts.** `build` stays the PWA pipeline. `build:ios` = web build + `cap sync ios`.
4. **Native-only plugins** (status bar, splash, Capacitor haptics) must no-op when `isNativeApp()` is false.
5. Do not merge old Capacitor branches wholesale onto `figma`; port the shell onto current `figma` so PWA fixes stay intact.

## Implementation

- Capacitor config: `capacitor.config.json` (`com.chronowalk.app`)
- Xcode project: `ios/`
- Detection: `src/utils/nativePlatform.js`
- Boot: `src/native/bootstrapNativeShell.js`
- Operator guide: [`CAPACITOR_IOS.md`](./CAPACITOR_IOS.md)

Inside the native shell we:

- Skip service-worker registration (assets ship via `cap sync`)
- Hide PWA “Add to Home Screen” install UI
- Enable Capacitor status bar / splash / haptics

## Commerce note (before App Store submission)

Web purchases today go through **Paddle**. App Store review may require Apple IAP (or an approved external-purchase model) for digital tour access sold inside the iOS app. Decide before TestFlight public listing:

- **A.** Native app is restore / access-link / login only; purchase stays on the website
- **B.** Add StoreKit IAP and sync entitlements with the existing backend
- **C.** Use Apple’s allowed external-link / reader-style exceptions if applicable

This ADR does not pick A/B/C; shipping the shell does not require that decision, but **submission** does.

## Android later

Same Capacitor app: `npx cap add android`. PWA path remains unchanged.

## History

- PR #165 added the first Capacitor shell; PR #201 reverted an accidental merge.
- This document reactivates that plan on current `figma` without altering PWA deploy.
