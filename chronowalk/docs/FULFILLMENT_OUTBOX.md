# Durable fulfillment outbox

Paid-access email is **not** sent inside the Paddle webhook. The webhook commits the purchase, one initial claim hash, and a `fulfillment_outbox` row, then returns. Delivery is handled by `process-fulfillment-outbox`.

## Flow

1. `paddle-webhook` (`transaction.completed`) → purchase + `ensure_initial_purchase_claim` + encrypted outbox row (`pending`).
2. Supabase cron → `process-fulfillment-outbox` (Bearer `FULFILLMENT_CRON_SECRET`).
3. Worker claims due rows (`FOR UPDATE SKIP LOCKED`), decrypts the claim, sends Resend with `Idempotency-Key: purchase-access/<order_id>`.
4. Resend webhook (`resend-webhook`) updates `delivered` / bounce / failure using Svix event id dedupe.
5. Ciphertext is wiped on delivery, claim consume/revoke, or expiry.

## Retry policy

| Item | Value |
|---|---|
| Max attempts | **8** (`fulfillment_outbox.max_attempts`) |
| Backoff | `min(30s × 2^(attempt-1), 6h)` |
| Transient | timeout, network, HTTP 429, 5xx → status `failed`, schedule `next_attempt_at` |
| Permanent | HTTP 4xx (except retryable), decrypt failure, missing purchase → `fulfillment_failed` |
| Provider terminal | `email.bounced` / `complained` / `failed` → `fulfillment_failed` + wipe ciphertext |

## Cron (Supabase)

Schedule **every minute** (or every 1–5 minutes):

```
POST https://<project-ref>.supabase.co/functions/v1/process-fulfillment-outbox
Authorization: Bearer <FULFILLMENT_CRON_SECRET>
Content-Type: application/json

{"limit": 10}
```

Use Supabase Dashboard → Edge Functions → Schedules (or `pg_cron` + `net.http_post`). Do not put the secret in the repo.

## Required secrets (names only)

| Secret | Used by |
|---|---|
| `CLAIM_ENCRYPTION_KEY` | paddle-webhook (encrypt), process-fulfillment-outbox (decrypt) — 32-byte base64 |
| `FULFILLMENT_CRON_SECRET` | process-fulfillment-outbox auth |
| `RESEND_API_KEY` | process-fulfillment-outbox |
| `RESEND_FROM` | process-fulfillment-outbox |
| `RESEND_WEBHOOK_SECRET` | resend-webhook (Svix `whsec_…`) |
| `SITE_URL` | access link host in email |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | all Edge functions |
| `PADDLE_*` / `PADDLE_PRICE_ROME_*` | paddle-webhook (unchanged) |

## Operator CLIs

```bash
# Masked audit (read-only)
node scripts/audit-fulfillment-outbox.mjs
node scripts/audit-fulfillment-outbox.mjs --status=fulfillment_failed --limit=50

# Requeue by order id (dry-run default)
node scripts/retry-fulfillment-outbox.mjs txn_01…
node scripts/retry-fulfillment-outbox.mjs txn_01… --execute
```

Requeue **never** mints a new claim and **never** prints the access link. It only works when encrypted claim ciphertext is still present.

## Idempotency

- Paddle `event_id` → inbox dedupe (no second entitlement path).
- `ensure_initial_purchase_claim` → at most one active initial claim.
- Resend `Idempotency-Key: purchase-access/<order_id>` → provider-side send dedupe.
- Svix `svix-id` → delivery event dedupe.
