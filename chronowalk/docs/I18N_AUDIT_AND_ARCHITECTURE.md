# ChronoWalk EN/ES localization — audit & architecture

Same-day Spanish launch inventory for the ChronoWalk PWA. Product design and commerce/entitlements are unchanged.

## 1) User-facing string sources

| Surface | Paths | Notes |
|---------|-------|-------|
| Rome tour content | `src/content/rome/manifest.json` | Titles, approach/arrival, chapter titles + transcripts, acts, reflections |
| Launch / companion copy modules | `src/content/launch*.js`, `mapBottomCard.js`, `companionGuidance.js`, `tourProductTruth.js`, `journey*.js`, `myTourPlan.js`, … | Centralized English helpers |
| Redesign PWA screens | `src/redesign/screens/*`, `src/redesign/ui/*`, `src/redesign/lib/walkingApproachCues.js` | Hardcoded JSX + helpers |
| Shell chrome | `src/shell/config.js`, `ShellTabBar.jsx`, `src/components/navigation/navConfig.jsx` | Walk / Tour / Map / Journal |
| Acquisition / Pantheon | `src/landing/acquisition/*`, `landingData.js`, `landingIntent.js` | Free Pantheon + ads pages |
| Marketing landing | `src/landing/**` | Large EN marketing surface (beyond core walk chrome) |
| SEO / HTML / PWA | `index.html`, `src/seo/pageMeta.js`, Vite PWA manifest | `lang="en"` historically |
| Errors / network / install | `V2ErrorBoundary`, banners, A2HS copy | In-app chrome |
| Emails | `supabase/functions/_shared/accessEmailTemplate.js` | Transactional EN (out of this launch’s commerce scope) |
| Legal | `src/content/legal/*.md` + `es/` | EN + ES legal markdown by locale |

**Localized in this pass (core experience):** message catalogs + Spanish Rome overlays + settings/shell/map/companion/Pantheon free page.

## 2) Content / audio sources

| Kind | Location | Convention |
|------|----------|------------|
| Canonical EN narration | `public/rome/audio/narration/` | `wNN.mp3`, `wNN_chN.mp3`, transit `tNN*.mp3`, Pantheon `w17_ch1–4.mp3` |
| Beds / inserts / system | `public/rome/audio/{beds,inserts,system}/` | Language-neutral |
| Waypoint media | `public/waypoints/**` | Visual only |
| Manifest | `src/content/rome/manifest.json` | Filenames + EN transcripts |
| Spanish narration (new) | `public/rome/audio/es/narration/{same-filename}` | Deterministic map in `src/i18n/audio/heroStopAudioMap.js` |
| Spanish text overlay | `src/i18n/content/es/waypoints.json` (+ acts/reflections) | Merged at `loadRomeManifest()` |

**21 hero stops:** `w01, w02, w03, w04, w06, w07, w08, w10, w11_12, w13, w14, w15, w16, w17, w23, w18, w19, w20, w21, enc_circus, w22` (excludes Forum rest `pause`).

## 3) Locale infrastructure (before → after)

**Before:** none (hardcoded `en`, no catalogs, no preference key).

**After (minimal shared i18n):**

```
src/i18n/
  locales.js, activeLocale.js, storage.js (cw_locale_v1)
  resolveLocale.js (?lang= → stored → default en)
  t.js + messages/{en,es}.js
  I18nProvider.jsx
  content/applyLocaleOverlay.js + content/es/*
  audio/heroStopAudioMap.js
```

No third-party i18n library. English paths and default locale preserve prior behavior.

## 4) Flows where language must persist

| Flow | Persistence |
|------|-------------|
| Cold start / PWA standalone | `localStorage cw_locale_v1` read in `I18nProvider` boot |
| Deep link / acquisition | `?lang=es` consumed once and stored |
| Settings change | Language segmented control writes storage + clears manifest cache |
| Tour playback | Active locale drives narration paths + overlay transcripts |
| Offline download | `collectManifestAudioPaths(manifest, locale)` uses locale-prefixed narration |
| Map directions | Mapbox `language` follows `getActiveLocale()` |
| Cross-tab | `storage` + `chronowalk:locale-changed` events |

Commerce SKUs, entitlements, access handoff, and Paddle checkout logic are untouched.

## 5) Minimal shared architecture

1. **Locale primitive** — `en` \| `es`, default `en`, stored as `cw_locale_v1`.
2. **UI strings** — flat key catalogs; `t(key, vars)` with EN fallback.
3. **Tour content** — EN manifest remains source of truth; ES overlay merges titles/lines/transcripts without changing IDs or audio filenames.
4. **Audio** — EN: `/rome/audio/narration/{file}`; ES: `/rome/audio/es/narration/{file}`. Beds/system stay shared.
5. **Provider** — wrap app; set `document.documentElement.lang`; invalidate manifest cache on change.
6. **Checks** — `npm run check:i18n` (keys + overlays + map); `npm run check:i18n:audio` requires Spanish MP3s on disk.

## Ops

Drop Spanish takes into `public/rome/audio/es/narration/` using English filenames, then run `npm run check:i18n:audio`. See `docs/I18N_PHONE_SMOKE_CHECKLIST.md`.
