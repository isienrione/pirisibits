# ChronoWalk Rome — iOS morning report

Branch: `ios-rome` (from `figma`). Web PWA behavior is unchanged unless `VITE_PLATFORM=ios` or Capacitor native.

## Phase summary

### Phase 1 – iOS build flavor ✅
- Added `.env.ios` (`VITE_PLATFORM=ios`, empty `VITE_MEDIA_BASE`), `build:ios` script, `src/lib/platform.js` (`IS_IOS`).
- `check:content:local` passed; `build:ios` copies `public/rome` + `public/waypoints` into `dist`.
- Empty `VITE_MEDIA_BASE` resolves to relative paths (covered by unit test).

### Phase 2 – Remove commerce / web-only on iOS ✅
- Entitlements / `RequireAccess` unlock all Rome content when `IS_IOS`.
- No PostHog, attribution, Google Ads, Paddle checkout, Supabase client / journeyCloud / family RPCs / config fetch.
- Cookie banner, site footer, A2HS / PWA install, SW registration gated off.
- `/` → `/home`; marketing routes redirect; Privacy + Contact kept.

### Phase 3 – Reviewer demo mode ✅
- Home CTA: **Preview the walk from anywhere** (+ hint when GPS denied / >5 km).
- Demo mode pins GPS at active stop; Next/Previous steppers on journey.
- Generated `ios-assets/rome-route.gpx` (~15 m steps, 1.4 m/s, path A waypoints).

### Phase 4 – Capacitor ✅
- Packages installed; `capacitor.config.json` (`com.chronowalk.rome`, `ChronoWalk Rome`, `webDir: dist`).
- `npx cap add ios` **succeeded on Linux** — `ios/` committed.
- Info.plist: location usage string, `UIBackgroundModes=audio`, `ITSAppUsesNonExemptEncryption=false`, portrait only.
- `TARGETED_DEVICE_FAMILY = 1`; AppDelegate sets `AVAudioSession` `.playback` / `.spokenAudio`.
- Geolocation + keep-awake replace web APIs when `IS_IOS`.

### Phase 5 – Native features ✅
- Media Session: stop title, artist **ChronoWalk Rome**, artwork; play/pause/next/prev already wired in AudioEngine (**verify on device**).
- Then/Now **Save / Share** → canvas composite → Filesystem + Share sheet.
- Haptics: medium on arrival (existing `ARRIVAL_PULSE`); light (`SOFT_TAP`) when slider snaps fully to Then.
- Offline: Capacitor Network + existing OfflineRouteMap note *You're offline — the full tour still works.*
- **Walk here in Apple Maps** on arrival screens.
- In-app review after act complete (`ReviewPrompt` / StoreKit), never at launch.
- External links via `@capacitor/browser`.

### Phase 6 – Remove website tells ✅
- `html.cw-ios-native`: no select/callout (except inputs), no overscroll, safe-area padding, tap `:active`.
- Viewport zoom locked on native boot; StatusBar style per route; splash hidden when ready.

### Phase 7 – Final
- Focused unit tests: **13 passed**.
- `npm run build:ios`: **passes** after StatusBar import path fix.
- Repo-wide `npm run lint` / `npm test` still fail on **pre-existing** Design Law + eslint issues unrelated to this branch (not introduced here).

## Screens changed (iOS-gated unless noted)

| Screen / module | Change |
|---|---|
| Home (`RedesignHomeScreen`) | Demo preview CTA |
| Journey shell | Demo Next/Prev; Apple Maps lat/lng; ReviewPrompt on day complete |
| Arrival (`C4ArrivalMoment`, `ArrivalScreen`) | Apple Maps walking link |
| Then/Now (`BeforeAfterSlider`) | Save/Share; Then haptic |
| Offline map | Offline note |
| Settings sheet | Browser for help; Contact instead of Credits on iOS |
| Router / main | Entry, gates, splash, status bar, no SW |
| Legal shell | No marketing footer on iOS |

## Must test on a physical iPhone

1. Demo mode full walk (Next/Prev through all stops — audio + reveal).
2. Xcode GPX walk with `ios-assets/rome-route.gpx`.
3. Screen-locked audio continues (spokenAudio session).
4. Lock-screen / Dynamic Island controls (play/pause/next/prev).
5. Save / Share Then+Now → Photos.
6. Airplane mode — offline map note + bundled audio.
7. Location denied — demo CTA still visible and works.
8. Arrival haptic + Then slider light haptic.
9. In-app review appears only after completing an act (not at launch).
10. Apple Maps “Walk here” opens walking directions.

## Mac commands (exact)

```bash
cd chronowalk
npm ci
npm run build:ios
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Select an iPhone team / signing for `com.chronowalk.rome`.
2. Debug → Simulate Location → Add GPX File → choose `ios-assets/rome-route.gpx`.
3. Run on a physical device (location + background audio + Share need hardware).
4. Archive → Distribute App → App Store Connect.

Optional one-liner sync after web changes:

```bash
npm run build:ios:sync
```

Reviewer copy: `ios-assets/REVIEW_NOTES.txt` (~150 words).
