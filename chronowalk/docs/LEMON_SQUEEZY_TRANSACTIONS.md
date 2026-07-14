# Lemon Squeezy transactions — how payments work on ChronoWalk

ChronoWalk is waiting on Lemon Squeezy store confirmation. The **buyer journey is already built** as placeholders. When the checkout URL and webhook secret arrive, flip env vars — no redesign.

## Buyer journey (live once configured)

1. **Landing** (`/landing`) — traveler picks Central / Ancient / Complete  
2. **Checkout** — Lemon Squeezy hosted payment (`VITE_LEMON_CHECKOUT_URL`)  
3. **Webhook** — Supabase Edge Function writes `purchases` + emails magic link  
4. **Unlock** — `/access?token=<uuid>` grants device access (`cw_access`)  
5. **Ceremony** — optional `/access/confirmed` (“Rome is yours.”)  
6. **Setup** — `/setup` → `/begin` → walk  

While Lemon is pending, step 2 opens **`/purchase`** instead: calm instructions + tier summary + restore/dev paths.

## What to do when Lemon confirms

### 1. Create products in Lemon Squeezy

Create one checkout (or three variants) aligned to Rome tiers:

| Tier id (`product_id`) | Suggested price |
| --- | --- |
| `rome-central` | €9 |
| `rome-essential` | €12 |
| `rome-complete` | €17 (AB may be €14 / €19) |

Copy the **share / checkout URL** for the main Complete product (or a single “Rome” product if you use one link + custom metadata).

### 2. Set frontend env

Local `.env.local` and Cloudflare Pages (preview + production):

```bash
VITE_LEMON_CHECKOUT_URL=https://YOUR_STORE.lemonsqueezy.com/checkout/buy/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Optional: also store the same URL in Supabase `app_config.checkout_url` (JSONB string) so you can rotate without redeploying.

### 3. Lemon checkout settings

| Setting | Value |
| --- | --- |
| Success / thank-you redirect | `https://chronowalk.com/access/confirmed` |
| Button overlay / hosted | Hosted checkout (current code uses full-page `location.assign`) |
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

- `public.purchases` (email, order_id, host, ab_variant, access_token)  
- `public.validate_access_token(p_token)` for `/access`

### 6. Test a real transaction (test mode)

1. Enable **Test mode** in Lemon Squeezy  
2. Set `VITE_LEMON_CHECKOUT_URL` to the **test** checkout link  
3. Open `/landing` → Begin Journey on a tier  
4. Pay with Lemon’s test card  
5. Confirm webhook logs + a row in `purchases`  
6. Open the emailed `/access?token=…` link → lands in `/setup`  
7. Device has `localStorage.cw_access === 'true'`

### 7. Staging without Lemon

```bash
# .env.local or Cloudflare preview only — never production
VITE_ALLOW_DEV_ACCESS=true
```

Then visit: `/access?token=dev` (or `local`).

## In-app routes

| Route | Role |
| --- | --- |
| `/purchase` | Placeholder steps when Lemon URL missing; live “Continue to checkout” when set |
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

- [ ] Lemon store approved / live mode  
- [ ] `VITE_LEMON_CHECKOUT_URL` on Cloudflare production  
- [ ] Webhook signature verified in production  
- [ ] Magic-link email delivers in &lt; 1 minute  
- [ ] Test purchase → `/access` → `/setup` on a clean phone  
- [ ] `VITE_ALLOW_DEV_ACCESS` **unset** on production  
- [ ] Refund path decided (manual revoke vs webhook `order_refunded`)  

## Related code

- `src/lib/checkout.js` — open / build checkout  
- `src/redesign/screens/APurchasePending.jsx` — placeholder UI  
- `src/landing/landingCheckout.js` — tier cents + metadata  
- `src/lib/access.js` — token validation  
- `src/lib/config.js` — `grantAccess` / `hasAccess`
