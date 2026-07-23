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
6. **SQL Editor** — run `supabase/migrations/20260723_fulfillment_email_generation.sql`
   Adds `fulfillment_outbox.email_generation_id`, backfills legacy rows (`= id`), hardens `apply_resend_email_event`, and extends `operator_requeue_fulfillment(..., p_rotate_generation)`. Then run `20260723_fulfillment_email_generation_verify.sql` (rolled back).
7. **SQL Editor** — run `supabase/migrations/20260722_paddle_adjustments.sql`
   Adjustment idempotency + `apply_paddle_adjustment` / `operator_restore_purchase_access`. Then run `20260722_paddle_adjustments_verify.sql` (rolled back).
8. **SQL Editor** — run `supabase/migrations/20260724_bundle_invite_canonical.sql`
   Canonicalizes bundle invites (`trim` + lowercase) inside `redeem_bundle_invite` before rate-limit bucketing and hashing. Then run `20260724_bundle_invite_canonical_verify.sql` (rolled back). Existing unconsumed lowercase-hashed invites become redeemable from upper/mixed-case clients without reminting.
9. **SQL Editor** — run `supabase/migrations/20260725_walk_session_discovery.sql`
   Adds `get_active_walk_session_for_credential` so Couple/Family members discover the organizer’s active shared session using only device credential + binding. Hardens create (owner-only), emits `mySeatId`, rejects stale `expectedUpdatedAt` patches. Then run `20260725_walk_session_discovery_verify.sql` (rolled back). Existing active Sandbox sessions remain discoverable — no remint required.
10. **SQL Editor** — run `supabase/migrations/20260726_walk_session_participant.sql`
   Adds `walk_session_participants` + `detach_walk_session_for_credential` / `rejoin_walk_session_for_credential` so a follower can walk independently without ending the group session. Payload includes `syncParticipation`. Then run `20260726_walk_session_participant_verify.sql` (rolled back). Existing active Sandbox sessions stay valid (missing participant rows mean `synced`).
11. **SQL Editor** — run `supabase/migrations/20260727_webhook_failed_reclaim.sql`
   Allows Paddle to replay a previously **failed** webhook event (operator review) so ChronoWalk can reclassify effective-full item refunds. Adds `complete_paddle_webhook_event`. Processed/processing events stay duplicates. Then run `20260727_webhook_failed_reclaim_verify.sql` (rolled back).
12. **Local operator (not Cursor)** — dry-run then execute the catalog seed:
   ```bash
   export PADDLE_API_KEY=…   # never commit
   export PADDLE_ENV=sandbox
   node scripts/seed-paddle-catalog.mjs
   node scripts/seed-paddle-catalog.mjs --execute --env=sandbox
   ```
   Paste the five printed `pri_…` into Cloudflare Pages (`VITE_PADDLE_PRICE_*`) and Supabase Edge secrets (`PADDLE_PRICE_*`). Also set `CLAIM_ENCRYPTION_KEY` (32-byte base64).
13. **Edge Functions** — deploy (see `docs/FULFILLMENT_OUTBOX.md` for secret names, no values):
   - `paddle-webhook` build `2026-07-27-v13-effective-full-refund` (no Resend inline; handles `adjustment.*`; effective-full partial coverage; failed-event reclaim)
   - `process-fulfillment-outbox` build `2026-07-23-v2-email-generation` + cron every minute with `FULFILLMENT_CRON_SECRET`
   - `resend-webhook` build `2026-07-23-v2-email-generation` with `RESEND_WEBHOOK_SECRET` (Svix)
14. **Paddle notification destination** — subscribe to `transaction.completed`, `customer.created`, `customer.updated`, **`adjustment.created`**, and **`adjustment.updated`** (see `docs/PADDLE_SETUP.md`).
15. **Smoke** — sandbox purchase: inbox → purchase + claim hash + pending outbox (+ bundle/seats for couple/family) → cron worker sends email → Resend `email.delivered` → `/access?token=` redeems once (second redeem fails). Optional: simulator adjustment pending→approved → purchase `refunded` and device validate fails. Also confirm Couple/Family invite links redeem regardless of invite-code letter case. Confirm Seat 2 discovers “Start shared tour syncing” from the organizer and observes Pause/Resume for everyone (or “Resume with group” when autoplay blocks). Confirm a follower leaving the group stop is warned, can walk independently, and can rejoin without a second session. After an approved dashboard “Full refund” that arrives as top-level `partial` with full item coverage, confirm purchase/`credentials`/bundle revoke on replay of the failed webhook if needed.
16. **Confirm** — anon cannot `select` from `purchases`, `purchase_claim_tokens`, `access_credentials`, `family_*`, `fulfillment_outbox`, `purchase_adjustments`, `walk_sessions`, or `walk_session_participants`.

### Existing Sandbox recovery stuck on `http_409`

After step 6 (migration) and step 13 (redeploy worker + resend-webhook), requeue the **existing encrypted claim** without minting another:

```bash
node scripts/retry-fulfillment-outbox.mjs <order_id> --rotate-generation --execute
```

Do **not** run `restore-purchase-access.mjs` again for that row — the recovery claim ciphertext is still present and unexpired.

## Do not run

- `supabase/family_walk.sql` (retired insecure RPCs)
- `supabase/journey_progress.sql` (legacy `access_token` PK)
- Any `*.example.sql` / `*.local.sql` / `*.private.sql` customer backfills as migrations

## Client offline lease

Device credentials keep a **≤ 48 hour** offline lease from the last successful online `validate_device_access`. After expiry, online revalidation is required. `VITE_ALLOW_DEV_ACCESS` may unlock only explicit `dev` / `local` tokens in local/sandbox builds — never arbitrary UUIDs — and must be absent/false in production.
