# Launch commerce hardening — dashboard apply order

**Do not apply from an agent session to production.**

## Non-production / staging apply order

1. **Supabase → SQL Editor** — run `scripts/paddle-customers-migration.sql`  
   Schema only (`paddle_customers` + RLS). No customer backfills.
2. **SQL Editor** — run `supabase/migrations/20260721_launch_commerce_hardening.sql`  
   Idempotent. Safe when `purchases` exists, `journey_progress` is absent, and `family_bundles` is empty (also safe if test rows already exist).
3. **SQL Editor** — run `supabase/migrations/20260721_launch_commerce_hardening_verify.sql`  
   Synthetic contract checks inside a rolled-back transaction. All `OK` notices must appear.
4. **SQL Editor** — run `supabase/migrations/20260721_paddle_price_fulfillment.sql`  
   Adds outbox claim ciphertext + `last_event_occurred_at` for out-of-order protection.
5. **Local operator (not Cursor)** — dry-run then execute the catalog seed:
   ```bash
   export PADDLE_API_KEY=…   # never commit
   export PADDLE_ENV=sandbox
   node scripts/seed-paddle-catalog.mjs
   node scripts/seed-paddle-catalog.mjs --execute --env=sandbox
   ```
   Paste the five printed `pri_…` into Cloudflare Pages (`VITE_PADDLE_PRICE_*`) and Supabase Edge secrets (`PADDLE_PRICE_*`). Also set `CLAIM_ENCRYPTION_KEY` (32-byte base64).
6. **Edge Functions → `paddle-webhook`** — redeploy the function directory (build `2026-07-21-v9-price-map`).  
   Startup must load all five `PADDLE_PRICE_*` secrets without duplicates. Entitlement is derived only from `data.items[].price.id`.
7. **Smoke** — sandbox purchase: inbox → purchase + claim hash + pending outbox (+ bundle/seats for couple/family) → async email worker → `/access?token=` redeems once.
8. **Confirm** — anon cannot `select` from `purchases`, `purchase_claim_tokens`, `access_credentials`, `family_*`, or `walk_sessions`.

## Do not run

- `supabase/family_walk.sql` (retired insecure RPCs)
- `supabase/journey_progress.sql` (legacy `access_token` PK)
- Any `*.example.sql` / `*.local.sql` / `*.private.sql` customer backfills as migrations

## Client offline lease

Device credentials keep a **≤ 48 hour** offline lease from the last successful online `validate_device_access`. After expiry, online revalidation is required. `VITE_ALLOW_DEV_ACCESS` may unlock only explicit `dev` / `local` tokens in local/sandbox builds — never arbitrary UUIDs — and must be absent/false in production.
