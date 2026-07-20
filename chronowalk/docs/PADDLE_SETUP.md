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
  RESEND_API_KEY=re_...   # optional until email is wired

supabase functions deploy paddle-webhook
```

In Paddle → **Developer tools → Notifications** → New destination:

- URL: `https://<PROJECT_REF>.supabase.co/functions/v1/paddle-webhook`  
- Events: **`transaction.completed`** (minimum)  
- Copy the destination secret → `PADDLE_NOTIFICATION_WEBHOOK_SECRET`

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

- [ ] Sandbox catalog seeded; price ids in Cloudflare  
- [ ] Overlay works on mobile Safari  
- [ ] Webhook verifies signature; `purchases` row appears  
- [ ] Magic-link email delivers  
- [ ] Live Paddle account: new catalog + client token + notification destination  
- [ ] Domain approved for checkout  
- [ ] `VITE_PADDLE_ENV=production` + live `pri_` ids  
- [ ] `VITE_ALLOW_DEV_ACCESS` unset on production  

## Related code

- `src/lib/paddle.js` — init + overlay  
- `src/lib/checkout.js` — `openCheckout`  
- `supabase/functions/paddle-webhook/` — unlock  
- `scripts/seed-paddle-catalog.mjs` — products/prices  
- Legacy Lemon helpers remain in `src/lib/lemonSqueezy.js` (unused by `openCheckout`)
