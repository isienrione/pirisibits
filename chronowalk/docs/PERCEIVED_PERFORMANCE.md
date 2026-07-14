# Perceived performance (no visual change)

Invisible optimizations that reduce main-thread work, JS parse/download, GPU paint, and idle contention while keeping pixels identical when the tab is foregrounded.

## Audio / re-renders

| Change | Why |
| --- | --- |
| `src/audio/audioProgressStore.js` — shared progress store with quarter-second dedupe | Scrubber subscribers update without forcing every `useAudioEngine` consumer to re-render on each tick. |
| `useAudioEngine` publishes fine ticks (~200ms) to the store; React state only gets **coarse** progress (≤1Hz playing / 2.5s idle) | JourneyShell / map / GPS tree stop re-rendering ~5×/sec while audio plays. |
| `useAudioProgress()` (`useSyncExternalStore`) | Floating docks, transit mini-player, C6 immersive, walking companion read live time from the store. |
| `FloatingAudioPlayer` / `FloatingTransitAudioPlayer` wrapped in `memo`; shell passes stable `currentTime={0}` while live | Parent coarse updates no longer invalidate the dock via props; store drives the bar. |
| Transit / immersive builders stop piping living `currentTime` props | Avoids 1Hz prop identity churn into large screen trees. |

## Analytics / cold start

| Change | Why |
| --- | --- |
| `track.js` dynamic-imports `posthog-js` and inits on `requestIdleCallback` | Removes PostHog from the critical import graph; analytics starts after first paint. |
| Offline audio + map cache hydrate deferred to idle (`AppRouter`) | Keeps boot / first interaction free of background decode work. |

## Lazy loading / navigation

| Change | Why |
| --- | --- |
| `JourneyThresholdLayer` + `PwaUpdatePrompt` lazy + `Suspense` | Threshold / update UI leave the initial route graph. |
| `PrefetchThresholdWhenNear` when journey is ARRIVED / STORY / THRESHOLD / WALKING | Prefetches threshold chunk before the cinematic moment so transition stays snappy. |
| `ShellTabBar` idle + hover/focus prefetch of `/tour`, `/stops`, `/map`, `/journal` | Companion tab switches hit warm chunks. |
| Settings sheet already lazy; actions context split (below) | Sheet chunk + open/close don’t thrash the whole tree. |

## Memoization / context

| Change | Why |
| --- | --- |
| `SettingsSheetContext` split into actions vs state; call sites use `useSettingsSheetActions()` | Opening settings no longer re-renders My Tour / Journal / JourneyShell for `openSettings` only. |
| `useFamilyWalk` returns a memoized API object | Downstream consumers avoid pointless object-identity churn. |
| `CinematicImage` / `PhotoHero` memoized | Parent journey updates don’t remount image frames. |

## Images / decoding

| Change | Why |
| --- | --- |
| `CinematicImage` / `PhotoHero`: `priority` → `eager` + `fetchPriority="high"` + `decoding="sync"`; else lazy + async | LCP heroes decode promptly; below-fold stills don’t compete. |
| Landing hero: `loading="eager"` + `fetchPriority="high"` | First-viewport photo prioritized. |
| After cinematic load, CSS clears `will-change` on media | Avoids long-lived compositor layers once the fade finishes. |

## Fonts

| Change | Why |
| --- | --- |
| Removed CSS `@import` of Google Fonts from `index.css` | `@import` blocks stylesheet application; fonts load via `<link>` in `index.html` with `display=swap`. |
| Font URL includes Fraunces 300; drops unused DM Sans 700 | Smaller font CSS payload; same faces actually used in UI. |

## Animations / GPU

| Change | Why |
| --- | --- |
| `html[data-cw-hidden='true']` pauses decorative infinite animations (presence pulse, seam breathe, gold seam, press-hold idle) | Background tabs stop burning GPU/CPU; set from `visibilitychange` in `main.jsx`. |
| Existing `cw-reduce-motion` / reduced-motion media rules unchanged | Respects user preference without altering default look. |

## Bundle size

| Change | Why |
| --- | --- |
| Vite `manualChunks`: `lucide-react` → `lucide` (not mixed into `app-shared`) | Icon library caches separately; shared chunk stays smaller for routes that don’t need all icons. |
| PostHog no longer statically imported | Analytics weight no longer in the main entry graph. |

## What we intentionally did **not** change

- Motion durations, easing, or layout composition
- Image assets, grades, overlays, or hero crops
- Audio bitrates / chapter content
- Tab bar chrome or navigation destinations

## How to verify

- Play a long narration with the dock open: JourneyShell / map console render counts should not spike at ~5Hz; scrubber still advances smoothly.
- Background the tab: GPU process activity for decorative loops should drop (animations `paused`).
- Cold load network waterfalls: fonts via HTML link (not CSS `@import`); PostHog after idle; threshold chunk absent until near cinematic states (or after prefetch).
- Companion tab hover: corresponding page chunk prefetched before click.
