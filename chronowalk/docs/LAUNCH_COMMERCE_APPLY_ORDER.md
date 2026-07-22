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
5. **SQL Editor** — run `supabase/migrations/20260722_fulfillment_outbox_worker.sql`  
   Outbox claim/retry RPCs, `fulfillment_failed`, Resend webhook inbox. Then run `20260722_fulfillment_outbox_worker_verify.sql` (rolled back).
6. **SQL Editor** — run `supabase/migrations/20260722_paddle_adjustments.sql`  
   Adjustment idempotency + `apply_paddle_adjustment` / `operator_restore_purchase_access`. Then run `20260722_paddle_adjustments_verify.sql` (rolled back).
7. **Local operator (not Cursor)** — dry-run then execute the catalog seed:
   ```bash
   export PADDLE_API_KEY=…   # never commit
   export PADDLE_ENV=sandbox
   node scripts/seed-paddle-catalog.mjs
   node scripts/seed-paddle-catalog.mjs --execute --env=sandbox
   ```
   Paste the five printed `pri_…` into Cloudflare Pages (`VITE_PADDLE_PRICE_*`) and Supabase Edge secrets (`PADDLE_PRICE_*`). Also set `CLAIM_ENCRYPTION_KEY` (32-byte base64).
8. **Edge Functions** — deploy (see `docs/FULFILLMENT_OUTBOX.md` for secret names, no values):
   - `paddle-webhook` build `2026-07-22-v11-adjustments` (no Resend inline; handles `adjustment.*`)
   - `process-fulfillment-outbox` + cron every minute with `FULFILLMENT_CRON_SECRET`
   - `resend-webhook` with `RESEND_WEBHOOK_SECRET` (Svix)
9. **Paddle notification destination** — subscribe to `transaction.completed`, `customer.created`, `customer.updated`, **`adjustment.created`**, and **`adjustment.updated`** (see `docs/PADDLE_SETUP.md`).
10. **Smoke** — sandbox purchase: inbox → purchase + claim hash + pending outbox (+ bundle/seats for couple/family) → cron worker sends email → Resend `email.delivered` → `/access?token=` redeems once (second redeem fails). Optional: simulator adjustment pending→approved → purchase `refunded` and device validate fails.
11. **Confirm** — anon cannot `select` from `purchases`, `purchase_claim_tokens`, `access_credentials`, `family_*`, `fulfillment_outbox`, `purchase_adjustments`, or `walk_sessions`.

## Do not run

- `supabase/family_walk.sql` (retired insecure RPCs)
- `supabase/journey_progress.sql` (legacy `access_token` PK)
- Any `*.example.sql` / `*.local.sql` / `*.private.sql` customer backfills as migrations

## Client offline lease

Device credentials keep a **≤ 48 hour** offline lease from the last successful online `validate_device_access`. After expiry, online revalidation is required. `VITE_ALLOW_DEV_ACCESS` may unlock only explicit `dev` / `local` tokens in local/sandbox builds — never arbitrary UUIDs — and must be absent/false in production.
