# ChronoWalk iOS native development (T01+)

Capacitor wraps the same Vite build as the Cloudflare PWA. The iOS binary serves **local** assets from `dist/` — never `https://chronowalk.com` as the app shell.

## Prerequisites

- macOS with **Xcode** (from the Mac App Store)
- Apple Developer account (free or paid) for device install
- Node.js 20+ (matches Cloudflare Pages)

## Normal cycle

From the **`chronowalk/`** directory:

```bash
npm run ios:sync
```

This runs `npm run build`, copies `dist/` into the Xcode project, and refreshes native config.

Open Xcode:

```bash
npm run ios:open
```

In Xcode: select your iPhone or a Simulator → **Product → Run** (⌘R).

After React changes, always **`npm run ios:sync`** before Run so the bundled web assets are current.

Regenerate branded AppIcon / Splash (after emblem changes):

```bash
npm run generate:ios-assets
```

## First-time device install (manual)

1. Terminal: `cd chronowalk && npm install && npm run ios:sync`
2. Terminal: `npm run ios:open` — opens `ios/App/App.xcodeproj` in Xcode
3. Xcode left sidebar: click the blue **App** project icon
4. Target **App** → **Signing & Capabilities**
5. Check **Automatically manage signing**
6. **Team**: choose your Apple Developer team (sign in via Xcode → Settings → Accounts if empty)
7. **Bundle Identifier**: must be `com.chronowalk.app`
8. Connect iPhone via USB; unlock the phone; trust the computer if prompted
9. Xcode toolbar device menu: select your iPhone (not “Any iOS Device”)
10. **Product → Run** (⌘R)
11. First install: on the iPhone, **Settings → General → VPN & Device Management** → trust your developer certificate if iOS blocks launch

## What T01 success looks like

- App icon is ChronoWalk emblem on obsidian (not generic Capacitor)
- Launch screen shows the same branding briefly
- App loads the **marketing landing** or existing web routes (entry redesign is T02+)
- No “Add to Home Screen” requirement
- React Router works; no blank white screen
- Console (Safari Web Inspector → your device) shows no fatal module load errors

## Web product unchanged

Deploying `figma` to Cloudflare Pages is unchanged. Capacitor packages are dev/build-time only for the native tree; the website does not require `@capacitor/core` at runtime beyond the small stub that resolves to `web` in browsers.
