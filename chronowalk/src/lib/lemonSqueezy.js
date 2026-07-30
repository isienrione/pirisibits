/**
 * @deprecated Lemon Squeezy commerce - superseded by Paddle (`src/lib/paddle.js`).
 * Kept for reference / archived tests. `openCheckout` no longer calls this module.
 *
 * Store: chronowalk.lemonsqueezy.com (historical).
 */

/** Hosted / overlay buy URL for Roma Eterna (rome-complete product). */
export const LEMON_CHECKOUT_BUY_URL =
  'https://chronowalk.lemonsqueezy.com/checkout/buy/1a82bca2-f4a8-4b40-812d-fb7398afb75d'

/** Lemon.js CDN (same URL Lemon’s overlay embed snippet uses). */
export const LEMON_JS_SRC = 'https://assets.lemonsqueezy.com/lemon.js'

/**
 * Prefer Supabase app_config, then env, then the baked-in Roma Eterna buy URL.
 * Empty strings fall through so store approval only needs a dashboard flip / live mode.
 */
export function resolveLemonCheckoutBaseUrl(fromConfig, fromEnv) {
  const configUrl = typeof fromConfig === 'string' ? fromConfig.trim() : ''
  if (configUrl) return configUrl
  const envUrl = typeof fromEnv === 'string' ? fromEnv.trim() : ''
  if (envUrl) return envUrl
  return LEMON_CHECKOUT_BUY_URL
}

/** No-code overlay marker Lemon.js listens for. */
export const LEMON_BUTTON_CLASS = 'lemonsqueezy-button'

const SCRIPT_ID = 'cw-lemon-js'

/**
 * Embed markup Lemon provides for the Roma Eterna overlay button.
 * Kept for docs / marketing pages; app checkout uses {@link openLemonOverlay}.
 */
export const LEMON_CHECKOUT_OVERLAY_SNIPPET = [
  `<a href="${LEMON_CHECKOUT_BUY_URL}?embed=1" class="${LEMON_BUTTON_CLASS}">Buy Chronowalk - Roma Eterna</a>`,
  `<script src="${LEMON_JS_SRC}" defer></script>`,
].join('')

/**
 * Resolve checkout presentation: overlay (default) or full-page hosted.
 * Set VITE_LEMON_CHECKOUT_MODE=hosted to force redirect.
 */
export function resolveCheckoutMode() {
  const mode = String(import.meta.env.VITE_LEMON_CHECKOUT_MODE ?? 'overlay')
    .trim()
    .toLowerCase()
  return mode === 'hosted' ? 'hosted' : 'overlay'
}

/** Append embed=1 so Lemon opens the checkout overlay when using lemon.js. */
export function withLemonEmbed(checkoutUrl) {
  if (!checkoutUrl) return checkoutUrl
  try {
    const url = new URL(checkoutUrl)
    url.searchParams.set('embed', '1')
    return url.toString()
  } catch {
    const joiner = checkoutUrl.includes('?') ? '&' : '?'
    return `${checkoutUrl}${joiner}embed=1`
  }
}

function getLemonGlobal() {
  if (typeof window === 'undefined') return null
  return window.LemonSqueezy ?? null
}

/**
 * Load lemon.js once and re-init listeners (SPA-safe).
 * @returns {Promise<boolean>} true when LemonSqueezy.Url.Open is available
 */
export function ensureLemonJs() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false)
  }

  const ready = () => {
    if (typeof window.createLemonSqueezy === 'function') {
      window.createLemonSqueezy()
    }
    return Boolean(getLemonGlobal()?.Url?.Open)
  }

  if (ready()) return Promise.resolve(true)

  const existing =
    document.getElementById(SCRIPT_ID) ||
    document.querySelector(`script[src="${LEMON_JS_SRC}"]`) ||
    document.querySelector('script[src*="lemon.js"]')

  if (existing) {
    if (!existing.id) existing.id = SCRIPT_ID
    return new Promise((resolve) => {
      if (ready()) {
        resolve(true)
        return
      }
      const done = () => resolve(ready())
      existing.addEventListener('load', done, { once: true })
      existing.addEventListener('error', () => resolve(false), { once: true })
      // Script may already be loaded but listeners not yet wired.
      window.setTimeout(done, 50)
    })
  }

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = LEMON_JS_SRC
    script.defer = true
    script.onload = () => resolve(ready())
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
}

/**
 * Open Lemon checkout in the overlay when possible.
 * @returns {Promise<{ ok: true, mode: 'overlay' } | { ok: false, reason: string }>}
 */
export async function openLemonOverlay(checkoutUrl) {
  if (!checkoutUrl) return { ok: false, reason: 'missing_url' }

  const loaded = await ensureLemonJs()
  const lemon = getLemonGlobal()
  if (!loaded || !lemon?.Url?.Open) {
    return { ok: false, reason: 'script_unavailable' }
  }

  lemon.Url.Open(withLemonEmbed(checkoutUrl))
  return { ok: true, mode: 'overlay' }
}
