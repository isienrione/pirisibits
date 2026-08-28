# Capacitor iOS shell (ChronoWalk)

ChronoWalk stays a **web PWA** on chronowalk.com. This folder and the Capacitor config add a **parallel iOS App Store shell** that loads the same Vite build.

Architecture and non-goals: [`APP_STORE_DUAL_DISTRIBUTION.md`](./APP_STORE_DUAL_DISTRIBUTION.md).

## Prerequisites (Mac)

- Xcode (latest stable) + Command Line Tools
- CocoaPods (`sudo gem install cocoapods` or Homebrew)
- Apple Developer Program membership
- Node 20+ and npm (same as the web app)

## Daily workflow

From `chronowalk/`:

```bash
# 1. Install JS deps (once / after pull)
npm install

# 2. Build the web app and copy it into the iOS project
npm run build:ios

# 3. Open Xcode
npm run cap:ios
```

In Xcode: select a simulator or your device → Run.

After any web UI change you care about in the app:

```bash
npm run build:ios
```

Then re-run from Xcode (or use a live `server.url` during local debugging — see below).

## What stays on the web PWA

- `vite-plugin-pwa` / custom service worker
- Add to Home Screen / install prompts
- Cloudflare Pages deploy

Inside the native shell we **skip** service-worker registration and **hide** PWA install UI (`isNativeApp()`).

## Bundle ID

- App ID: `com.chronowalk.app`
- Display name: ChronoWalk

Change these in `capacitor.config.json` and Xcode Signing if you need a different ID.

## Live reload while coding (optional)

In `capacitor.config.json`, temporarily:

```json
"server": {
  "url": "http://YOUR_LAN_IP:5173",
  "cleartext": true
}
```

Run `npm run dev`, then `npx cap sync ios` and launch from Xcode. Remove `server.url` before App Store builds.

## Next steps after first Run

1. Signing & Capabilities in Xcode (Team, unique bundle ID if needed)
2. App icons / splash (Assets.xcassets + LaunchScreen)
3. Test Mapbox, geolocation permission, audio, auth redirects
4. TestFlight → App Store Connect listing

## Android later

Same Capacitor app: `npx cap add android` when you want Play Store. PWA path remains unchanged.
