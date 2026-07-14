# ChronoWalk v2 Launch Path

Branch: `redesign-launch`  
Production `main` stays stable until Stage 5 field-test gate.

## Stage gates (merge policy)

| Gate | Criteria | Merge to `main`? |
|------|----------|------------------|
| 1 | Branch deploy works, env vars documented | No |
| 2 | M1–M5: tokens, manifest, journey SM, config, analytics | Optional preview |
| 3 | M6–M17: E2E with placeholder media on phone | No |
| 4 | `npm run check:content` 100% green | No |
| 5 | Real content walk + fix list | **Yes** |
| 6 | Offline Day 1 + field test | Before Aug 1 go-live |

## Prompt order

1. M1 tokens → M3 manifest (`src/content/rome/manifest.json` + `npm run check:content`) → M2 routes/journey → M4 config → M5 analytics
2. M6 Threshold → M7 welcome → M8 landing → M9 access → M10 begin (pace + acts, not days) → M11–M17 screens
3. M18–M21 content pipeline (parallel after M3)
4. M22 remove dev panel (after Stage 5)
5. M23–M25 bulletproof

## Local env

Copy `chronowalk/.env.example` → `chronowalk/.env.local`. Never commit secrets.

## Lemon Squeezy (commerce)

Until the store is confirmed, tier CTAs open **`/purchase`** (placeholders + instructions).  
When ready: set `VITE_LEMON_CHECKOUT_URL`, deploy `supabase/functions/lemon-squeezy-webhook`, follow **`docs/LEMON_SQUEEZY_TRANSACTIONS.md`**.

## Stage 4 (local)

```bash
cd chronowalk
npm run check:content:local          # schema only
npm run check:content                # needs reachable VITE_MEDIA_BASE (R2 CDN)
npm run measure:durations            # ffprobe over CDN, or --from-dir=/path/to/rome/audio
npm run generate:rome-manifest
npm run check:content:strict
```

If `media.chronowalk.app` does not resolve, set `VITE_MEDIA_BASE` in `.env.local` to your R2 public `*.r2.dev` URL, or configure the custom domain in Cloudflare DNS first.

## Reuse from v1

- `scripts/normalize-audio.sh`, GPS/distance utils, `AudioOrchestrator`, Supabase client, Mapbox patterns

## Retire (do not extend)

- Tab nav (`AppNavigation`), `TourHud`, pre-tour ivory screens — replaced by v2 routes
