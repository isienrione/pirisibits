# Lemon Squeezy — ChronoWalk product copy & assets

Brand-aligned to chronowalk.com landing: **Fraunces** (display) + **DM Sans** (UI),  
obsidian `#0b0b0d`, bone `#faf6ef`, terracotta `#e4552e`, gold `#d4af37`.

Generated assets live in `marketing/lemon-squeezy/`.

## Products to create

| Lemon product name | Custom `product_id` | Price (USD) |
| --- | --- | --- |
| ChronoWalk — Roma Historica | `rome-central` | $12 |
| ChronoWalk — Roma Antica | `rome-essential` | $12 |
| ChronoWalk — Roma Eterna | `rome-complete` | $17.99 |

Attach custom checkout data: `product_id` (already appended by the app).

---

## Roma Eterna (featured / primary)

**Name:** ChronoWalk — Roma Eterna  
**Price:** $17.99 one-time  

**Short description:**
Self-guided Rome walk from the Arena to the Appian Way. Place-tied narration, Threshold reconstructions, and GPS guidance — in your phone browser. No app download. No subscription.

**Long description (HTML-friendly):**

```html
<p><strong>Walk Rome freely. Understand what you see.</strong></p>
<p>Roma Eterna is ChronoWalk’s complete Rome experience — the archaeological core, the living centro, and the outer loop — organized as one continuous story.</p>
<ul>
  <li>All Rome stops on the ChronoWalk route (Colosseum &amp; Forum through the Appian Way)</li>
  <li>Threshold historical reconstructions at key landmarks</li>
  <li>Location-aware chapters that open when you arrive</li>
  <li>Map + turn-by-turn steps when you need them</li>
  <li>One-time purchase · yours to keep · no subscription</li>
  <li>Works in your mobile browser — no app download required</li>
</ul>
<p><em>After purchase:</em> open the access link in your confirmation email on your phone, enable location, bring headphones, and begin at the first stop.</p>
```

**Gallery image order:**  
`images/00-product-cover-1000.png` → `01` … `06`

**Digital file / confirmation attachment:**  
`ChronoWalk_Access_Guide.pdf`

---

## Roma Historica

**Name:** ChronoWalk — Roma Historica  
**Price:** $12 one-time  

**Short description:**
The Pantheon and the living city around it — Trevi, Navona, Campo, Argentina, and Castel Sant’Angelo. Outside the Colosseum archaeological park.

**Long description:**

```html
<p>Walk the centro storico with place-tied narration and Threshold at the Pantheon stop you can try free first.</p>
<ul>
  <li>Pantheon chapters + Threshold</li>
  <li>Centro storico stops — no park ticket required</li>
  <li>Browser-based · one-time purchase</li>
</ul>
```

---

## Roma Antica

**Name:** ChronoWalk — Roma Antica  
**Price:** $12 one-time  

**Short description:**
The ancient core — Colosseum and Roman Forum — with stories where they happened and Threshold reconstructions at key landmarks.

---

## Checkout settings

| Setting | Value |
| --- | --- |
| Success redirect | `https://chronowalk.com/access/confirmed` |
| Confirmation email | Include access URL from webhook / magic link |
| Media | Upload PNGs from `images/` + attach Access Guide PDF |

## Buyer access guide (same content as PDF)

1. Open your purchase email (same address as checkout).  
2. Follow the access link to your tour.  
3. Open ChronoWalk on your phone browser — nothing to install.  
4. Bring headphones, start at the first stop.

Before you walk: charge your phone, allow location, load with internet, comfortable shoes. Purchase is for personal use — do not share access links or content.
