# Lemon Squeezy transactions — **superseded by Paddle**

> **Migration (2026-07):** Checkout now uses **Paddle Billing**. See [`docs/PADDLE_SETUP.md`](./PADDLE_SETUP.md).
> This document is kept for historical Lemon wiring. `openCheckout` no longer opens Lemon.

ChronoWalk’s buyer journey was originally wired for the **Roma Eterna** Lemon product.

## Buyer journey (live once configured)

1. **Landing** (`/landing`) — traveler picks Central / Ancient / Complete  
2. **Checkout** — Lemon Squeezy overlay (default) or hosted payment  
3. **Webhook** — Supabase Edge Function writes `purchases` + emails magic link  
4. **Unlock** — `/access?token=<uuid>` grants device access (`cw_access`)  
5. **Ceremony** — optional `/access/confirmed` (“Rome is yours.”)  
6. **Setup** — `/setup` → `/begin` → walk  

If checkout ever fails to open, step 2 falls back to **`/purchase`**: calm instructions + “Continue to secure checkout”.

**Paywall:** choosing a pack always opens checkout (or **`/purchase`**). Setup, begin, tour, journey, map, stops, and journal are blocked until `cw_access` is granted. There is no free continue.

**Dev unlock only:** `/purchase?tier=rome-complete&devUnlock=1` shows “simulate paid unlock” (local / `VITE_ALLOW_DEV_ACCESS`). Never the default traveler path.

## Store links (Roma Eterna)

| Kind | Value |
| --- | --- |
| Checkout (hosted) | `https://chronowalk.lemonsqueezy.com/checkout/buy/1a82bca2-f4a8-4b40-812d-fb7398afb75d` |
| Checkout overlay | same URL + `?embed=1`, with Lemon.js |

Overlay embed Lemon provides:

```html
<a href="https://chronowalk.lemonsqueezy.com/checkout/buy/1a82bca2-f4a8-4b40-812d-fb7398afb75d?embed=1" class="lemonsqueezy-button">Buy Chronowalk - Roma Eterna</a>
<script src="https://assets.lemonsqueezy.com/lemon.js" defer></script>
```

In-app code uses the same buy URL + `LemonSqueezy.Url.Open()` (`src/lib/lemonSqueezy.js`). Custom query params (`host`, `ab_variant`, `product_id`) are still appended.

## What to do when Lemon confirms live mode

### 1. Products already created

| Tier id (`product_id`) | Suggested price | Notes |
| --- | --- | --- |
| `rome-central` | €9.99 | Same buy link + `product_id` metadata until separate variants exist |
| `rome-essential` | €9.99 | Same |
| `rome-complete` | €14.99 | Roma Eterna — primary checkout UUID above |

### 2. Frontend env (optional override)

Local `.env.local` and Cloudflare Pages (preview + production). The app already defaults to the Roma Eterna URL when unset:

```bash
VITE_LEMON_CHECKOUT_URL=https://chronowalk.lemonsqueezy.com/checkout/buy/1a82bca2-f4a8-4b40-812d-fb7398afb75d
# overlay (default) | hosted
# VITE_LEMON_CHECKOUT_MODE=overlay
```

Optional: also store the same URL in Supabase `app_config.checkout_url` (JSONB string) so you can rotate without redeploying.

### 3. Lemon checkout settings

| Setting | Value |
| --- | --- |
| Success / thank-you redirect | `https://chronowalk.com/access/confirmed` |
| Button overlay / hosted | **Overlay** by default (`lemon.js`); set `VITE_LEMON_CHECKOUT_MODE=hosted` for full-page `location.assign` |
| Custom data | Already appended by the app: `host`, `ab_variant`, `product_id` |

### 4. Deploy the webhook

Placeholder: `supabase/functions/lemon-squeezy-webhook/index.ts`

```bash
# In Lemon: Settings → Webhooks → URL
# https://<PROJECT_REF>.supabase.co/functions/v1/lemon-squeezy-webhook
# Events: order_created

supabase secrets set LEMON_SQUEEZY_WEBHOOK_SECRET=whsec_...
supabase secrets set SITE_URL=https://chronowalk.com
supabase functions deploy lemon-squeezy-webhook
```

Wire your email provider in the TODO inside the function (Resend recommended). Email body should contain only:

`https://chronowalk.com/access?token=<access_token>`

### 5. Confirm SQL is applied

`supabase/v2_app_config.sql` creates:

- `public.purchases` (email, order_id, host, ab_variant, product_id, access_token)  
- `public.validate_access_token(p_token)` for `/access` (boolean)  
- `public.get_purchase_for_token(p_token)` → `{ ok, product_id }` so unlock opens the purchased pack  
- `public.journey_progress` + `get_journey_progress` / `upsert_journey_progress` for cross-device resume (`supabase/journey_progress.sql`)  
- Family invite seats: `supabase/family_walk.sql` (create bundle with purchase `access_token`; claim via `/invite`)
- `app_config.checkout_url` seeded with the Roma Eterna buy link

### 6. Test a real transaction (test mode)

1. Keep **Test mode** on in Lemon Squeezy until approval  
2. Confirm the app resolves the Roma Eterna checkout URL (env optional)  
3. Open `/landing` → Begin Rome on a tier — overlay should open  
4. Pay with Lemon’s test card  
5. Confirm webhook logs + a row in `purchases`  
6. Open the emailed `/access?token=…` link → lands in `/setup`  
7. Device has `localStorage.cw_access === 'true'`  
8. After Lemon approves: disable Test mode in the Lemon dashboard (same URL)

### 7. Staging without Lemon (works today)

**Option A — simulated paid unlock (QA only)**

1. `npm run dev` (or set `VITE_ALLOW_DEV_ACCESS=true` on a preview)
2. Open `/purchase?tier=rome-complete&devUnlock=1`
3. Tap **Dev only — simulate paid unlock**
4. Land on `/access/confirmed` → **Begin setup** → unlocked Rome

**Option B — shortcut token**

```bash
# .env.local or Cloudflare preview only — never production
VITE_ALLOW_DEV_ACCESS=true
```

Visit: `/access?token=dev` (or `local`).

## In-app routes

| Route | Role |
| --- | --- |
| `/purchase` | Bridge + auto-open checkout; calm steps if checkout fails |
| `/purchase?tier=rome-complete` | Same, with tier summary |
| `/checkout` | Alias → `/purchase` |
| `/access` | Paste / validate magic token |
| `/access/confirmed` | Post-purchase ceremony |

## How custom metadata is attached

`src/lib/host.js` → `buildCheckoutUrl`:

- `checkout[custom][host]` — hotel / partner QR (`?h=`)  
- `checkout[custom][ab_variant]` — price cents shown  
- `checkout[custom][product_id]` — `rome-central` \| `rome-essential` \| `rome-complete`  

Webhook must persist these onto `purchases` for analytics and support.

## Checklist before go-live

- [ ] Lemon store approved / live mode (leave Test mode)  
- [ ] Cloudflare has `VITE_LEMON_CHECKOUT_URL` **or** relies on baked-in default  
- [ ] Overlay works on mobile Safari (or `VITE_LEMON_CHECKOUT_MODE=hosted`)  
- [ ] Webhook signature verified in production  
- [ ] Magic-link email delivers in &lt; 1 minute  
- [ ] Test purchase → `/access` → `/setup` on a clean phone  
- [ ] `VITE_ALLOW_DEV_ACCESS` **unset** on production  
- [ ] Refund path decided (manual revoke vs webhook `order_refunded`)  

## Related code

- `src/lib/lemonSqueezy.js` — buy URL, lemon.js loader, overlay open  
- `src/lib/checkout.js` — resolve URL + open overlay / hosted  
- `src/redesign/screens/APurchasePending.jsx` — purchase bridge UI  
- `src/landing/landingCheckout.js` — tier cents + metadata  
- `src/lib/access.js` — token validation  
- `src/lib/config.js` — `grantAccess` / `hasAccess` / checkout fallback  
