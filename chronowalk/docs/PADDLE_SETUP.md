# Paddle commerce — ChronoWalk Rome packs

Lemon Squeezy approval stalled; ChronoWalk checkout now targets **Paddle Billing** (one-time prices, overlay checkout, webhook unlock).

## Buyer journey

1. **Landing** — pick Roma Historica / Antica / Eterna  
2. **Checkout** — Paddle.js overlay (`Paddle.Checkout.open`)  
3. **Webhook** — Supabase Edge Function `paddle-webhook` writes `purchases` + emails magic link  
4. **Unlock** — `/access?token=<uuid>` → `cw_access`  
5. **Setup** — `/setup` → walk  

Staging without Paddle: `/purchase?tier=rome-complete&devUnlock=1` (local / `VITE_ALLOW_DEV_ACCESS` only).

## What this agent already did

- Installed `@paddle/paddle-js` (client) and `@paddle/paddle-node-sdk` (seed script)  
- Client module: `src/lib/paddle.js`  
- Checkout entry: `src/lib/checkout.js` → `openCheckout()`  
- Edge Function: `supabase/functions/paddle-webhook/`  
- Catalog seed: `node scripts/seed-paddle-catalog.mjs`  
- Agent skills under `.agents/skills/paddle-*`  
- MCP template: `.cursor/mcp.json` (fill in your API keys locally)

## What you must do (credentials)

Paddle MCP and the live catalog need **your** API keys. This cloud agent cannot create products or open checkouts without them.

### 1. Create a Paddle sandbox account

https://sandbox-vendors.paddle.com/

### 2. API key + client token

**Developer tools → Authentication**

- **API key** (`pdl_sdbx_apikey_…`) — server / seed / MCP (`product.write`, `price.write`, notifications)  
- **Client-side token** (`test_…`) — safe for `VITE_PADDLE_CLIENT_TOKEN`

### 3. Seed the Rome catalog

```bash
export PADDLE_API_KEY=pdl_sdbx_apikey_...
export PADDLE_ENV=sandbox
node scripts/seed-paddle-catalog.mjs
```

Paste the printed `VITE_PADDLE_PRICE_ROME_*` ids into `.env.local` and Cloudflare Pages.

Tax category used by the seed script: `standard` (walking tour / digital access). Confirm in the dashboard if Paddle asks you to change it.

### 4. Frontend env (Cloudflare Pages + `.env.local`)

```bash
VITE_PADDLE_CLIENT_TOKEN=test_...
VITE_PADDLE_ENV=sandbox
VITE_PADDLE_PRICE_ROME_CENTRAL=pri_...
VITE_PADDLE_PRICE_ROME_ESSENTIAL=pri_...
VITE_PADDLE_PRICE_ROME_COMPLETE=pri_...
# optional
# VITE_SITE_URL=https://chronowalk.com
```

Optional Supabase override (JSONB): `app_config.paddle_prices` =

```json
{
  "rome-central": "pri_...",
  "rome-essential": "pri_...",
  "rome-complete": "pri_..."
}
```

### 5. Checkout settings (Paddle dashboard)

| Setting | Value |
| --- | --- |
| Default payment link | `https://chronowalk.com` (sandbox accepts localhost) |
| Website approval | Automatic in sandbox; approve `chronowalk.com` for live |
| Success redirect | App sets `successUrl` → `/access/confirmed` |

### 6. Deploy the webhook

```bash
supabase secrets set \
  PADDLE_API_KEY=pdl_sdbx_apikey_... \
  PADDLE_NOTIFICATION_WEBHOOK_SECRET=pdl_ntfset_... \
  PADDLE_ENV=sandbox \
  SITE_URL=https://chronowalk.com \
  RESEND_API_KEY=re_...   # required in production — sends /access unlock email
  # RESEND_FROM='ChronoWalk <access@chronowalk.com>'  # verified Resend domain

supabase functions deploy paddle-webhook
```

Without `RESEND_API_KEY`, live `transaction.completed` fails and buyers never receive their unlock link.

### Live production secrets (required)

```bash
supabase secrets set \
  PADDLE_ENV=production \
  PADDLE_API_KEY=pdl_live_apikey_... \
  PADDLE_NOTIFICATION_WEBHOOK_SECRET=pdl_ntfset_01ky10q12t00xky3j77h2n3w1p_... \
  SITE_URL=https://chronowalk.com \
  RESEND_API_KEY=re_... \
  RESEND_FROM='ChronoWalk <hello@chronowalk.com>'

supabase functions deploy paddle-webhook
```

**Critical:** `transaction.completed` webhooks include `customer_id` but **not** the buyer email.  
ChronoWalk caches email from `customer.created` / `customer.updated` into `public.paddle_customers`, then fulfills on `transaction.completed`. Run `scripts/paddle-customers-migration.sql` once.

`PADDLE_API_KEY` should still be the **live** key (`pdl_live_…`) as an API fallback. After deploy, logs / error JSON must show `build: 2026-07-21-v5`.

After deploy, logs must show `build: 2026-07-21-v5` (or newer). If the error stack points at older line numbers without that build id, the dashboard is still running a stale paste — open `supabase/functions/paddle-webhook/index.ts`, replace the entire function body, **Deploy**.

Recover a missing email for a completed transaction:

```bash
export PADDLE_API_KEY=pdl_live_apikey_...
export PADDLE_ENV=production
export SUPABASE_URL=https://YOUR_PROJECT.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...
export RESEND_API_KEY=re_...
node scripts/resend-purchase-access.mjs txn_01...
# or:
node scripts/resend-purchase-access.mjs --email buyer@example.com
```

In Paddle → **Developer tools → Notifications** → New destination:

- URL: `https://<PROJECT_REF>.supabase.co/functions/v1/paddle-webhook`  
- Events (required):
  - **`transaction.completed`** — grant entitlement + enqueue access email
  - **`customer.created`** / **`customer.updated`** — cache buyer email (`paddle_customers`)
  - **`adjustment.created`** / **`adjustment.updated`** — refunds, credits, chargebacks (pending keeps access; approved top-level **full** refund/credit → `refunded`; approved top-level **partial** that is proven to cover every original transaction item as `full` with equal integer totals/currency → `refunded`; genuine partials → operator review / retain access; chargeback → `disputed`)
- Copy the destination secret → `PADDLE_NOTIFICATION_WEBHOOK_SECRET`

Do **not** omit `adjustment.updated`: live refunds often start as `pending_approval` and only flip to `approved` / `rejected` on update.

#### Effective-full refund recovery (failed webhook replay)

If an approved dashboard “Full refund” arrived as top-level `type: partial` and the inbox row is `failed` / `partial_operator_review`:

1. Apply `20260727_webhook_failed_reclaim.sql` and redeploy `paddle-webhook` (`2026-07-27-v13-effective-full-refund`).
2. In Paddle → Notifications, **replay** the same `adjustment.updated` notification (same event id).
3. ChronoWalk reclaims the failed inbox row, verifies item coverage + totals against the Paddle transaction, then revokes purchase credentials / bundle seats.
4. Do **not** issue another refund or remint access.

### 7. Sandbox test card

| Card | Number |
| --- | --- |
| Success | `4242 4242 4242 4242` |
| Decline | `4000 0000 0000 0002` |

Any future expiry, any CVC. Confirm: checkout overlay → webhook row in `purchases` → email (or function logs if Resend unset) → `/access?token=…`.

### 8. Cursor Desktop — Paddle MCP (optional but recommended)

Add to Cursor **Settings → MCP** (or project `.cursor/mcp.json` — replace placeholders):

```json
{
  "mcpServers": {
    "paddle-sandbox": {
      "type": "http",
      "url": "https://sandbox-mcp.paddle.com/mcp",
      "headers": {
        "Authorization": "Bearer REPLACE_WITH_SANDBOX_API_KEY"
      }
    },
    "paddle-live": {
      "type": "http",
      "url": "https://mcp.paddle.com/mcp",
      "headers": {
        "Authorization": "Bearer REPLACE_WITH_LIVE_API_KEY"
      }
    },
    "paddle-docs": {
      "type": "http",
      "url": "https://paddlehq.mcp.kapa.ai"
    }
  }
}
```

Docs: https://developer.paddle.com/sdks/ai/paddle-mcp

This cloud environment does **not** have those MCP servers wired; install them in Cursor Desktop with your keys.

## Custom data (mirrors former Lemon metadata)

Passed as Paddle `customData` on checkout open:

| Key | Meaning |
| --- | --- |
| `product_id` | `rome-central` \| `rome-essential` \| `rome-complete` |
| `host` | Partner / hotel QR (`?h=`) |
| `ab_variant` | Price cents shown |

Webhook persists these onto `public.purchases`.

## Go-live checklist

- [x] Sandbox catalog seeded; price ids in Cloudflare  
- [x] Overlay works on mobile Safari  
- [x] Webhook verifies signature; `purchases` row appears  
- [ ] Magic-link email delivers (confirm Resend on production)  
- [x] Live Paddle catalog + client token + notification destination created  
- [ ] Domain approved for checkout (**Checkout → Website approval** → `chronowalk.com`)  
- [ ] Default payment link set to `https://chronowalk.com/landing`  
- [ ] Bank / payout details added  
- [ ] Flip Cloudflare + Supabase **together** to live (see below)  
- [ ] `VITE_ALLOW_DEV_ACCESS` unset on production  

### Live catalog mapping (sandbox → live)

| Tier | Sandbox price | Live price | EUR |
|------|---------------|------------|-----|
| Roma Historica (`rome-central`) | `pri_01kxz5as6gyv8st6xf4hjt7qsz` | `pri_01ky10q0fg5vsstzmqtdepj2f0` | 9.99 |
| Roma Antica (`rome-essential`) | `pri_01kxz5asb06w5a5k5qt0rtqz4n` | `pri_01ky10q0m46g8n9zfv9zkk7nj2` | 9.99 |
| Roma Eterna (`rome-complete`) | `pri_01kxz5asfh7fjkejft3q8ga1db` | `pri_01ky10q0sv6tqcv3s6r5s84a4j` | 14.99 |

Live webhook destination (created, do not recreate — recreating rotates the secret):

`https://ajxkfneisgifapyvalue.supabase.co/functions/v1/paddle-webhook`

Local secret mapping file (gitignored): `.cursor/paddle-live-migration.json`

### Flip to live (only after domain approval)

Keep production on **sandbox** until Paddle approves `chronowalk.com`. Then update **both** in one cutover:

**Cloudflare Pages env**

```bash
VITE_PADDLE_ENV=production
VITE_PADDLE_CLIENT_TOKEN=live_…
VITE_PADDLE_PRICE_ROME_CENTRAL=pri_01ky10q0fg5vsstzmqtdepj2f0
VITE_PADDLE_PRICE_ROME_ESSENTIAL=pri_01ky10q0m46g8n9zfv9zkk7nj2
VITE_PADDLE_PRICE_ROME_COMPLETE=pri_01ky10q0sv6tqcv3s6r5s84a4j
```

**Supabase Edge Function secrets**

```bash
PADDLE_ENV=production
PADDLE_API_KEY=pdl_live_apikey_…
PADDLE_NOTIFICATION_WEBHOOK_SECRET=pdl_ntfset_…   # from live destination; cannot be re-read
SITE_URL=https://chronowalk.com
```

Redeploy the Cloudflare site after changing `VITE_*` values (they bake at build time).

### Webhook IP allowlist note

Paddle publishes live egress IPs at `https://api.paddle.com/ips` (`data.ipv4_cidrs`).  
Supabase Edge Functions do not expose a simple per-function IP allowlist UI; ChronoWalk already **verifies `Paddle-Signature`** in `paddle-webhook`, which is the required integrity check. Prefer signature verification over hard-coded IP lists.

## Related code

- `src/lib/paddle.js` — init + overlay  
- `src/lib/checkout.js` — `openCheckout`  
- `supabase/functions/paddle-webhook/` — unlock  
- `scripts/seed-paddle-catalog.mjs` — products/prices  
- Legacy Lemon helpers remain in `src/lib/lemonSqueezy.js` (unused by `openCheckout`)
