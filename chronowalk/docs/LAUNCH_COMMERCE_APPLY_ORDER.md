# Launch commerce hardening — dashboard apply order

**Do not apply from an agent session to production.**

## Non-production / staging apply order

1. **Supabase → SQL Editor** — run `scripts/paddle-customers-migration.sql`  
   Schema only (`paddle_customers` + RLS). No customer backfills.
2. **SQL Editor** — run `supabase/migrations/20260721_launch_commerce_hardening.sql`  
   Idempotent. Safe when `purchases` exists, `journey_progress` is absent, and `family_bundles` is empty (also safe if test rows already exist).
3. **SQL Editor** — run `supabase/migrations/20260721_launch_commerce_hardening_verify.sql`  
   Synthetic contract checks inside a rolled-back transaction. All `OK` notices must appear.
4. **Service role** — seed `paddle_price_catalog` with sandbox/live `pri_…` → launch SKU rows for:
   - `rome-central`, `rome-essential`, `rome-complete`, `rome-couple`, `rome-family`  
   Unknown price IDs fail closed in the webhook.
5. **Edge Functions → `paddle-webhook`** — redeploy the function body (build `2026-07-21-v8-claims`).  
   Confirm logs show the new build id. Fulfillment uses price-derived entitlement, one-time claims, and `fulfillment_outbox` (never emails `purchases.access_token`).
6. **Smoke** — complete one sandbox purchase: inbox row → purchase row → claim email → `/access?token=` redeems once → device credential validates; replay fails.
7. **Confirm** — anon cannot `select` from `purchases`, `purchase_claim_tokens`, `access_credentials`, `family_*`, or `walk_sessions`.

## Do not run

- `supabase/family_walk.sql` (retired insecure RPCs)
- `supabase/journey_progress.sql` (legacy `access_token` PK)
- Any `*.example.sql` / `*.local.sql` / `*.private.sql` customer backfills as migrations

## Client offline lease

Device credentials keep a **≤ 48 hour** offline lease from the last successful online `validate_device_access`. After expiry, online revalidation is required. `VITE_ALLOW_DEV_ACCESS` may unlock only explicit `dev` / `local` tokens in local/sandbox builds — never arbitrary UUIDs — and must be absent/false in production.
