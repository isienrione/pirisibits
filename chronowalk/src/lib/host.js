const HOST_KEY = 'cw_host'
const HOST_TTL_MS = 90 * 24 * 60 * 60 * 1000

export const HOST_MAP = {
  hotelroma1: 'Hotel Roma',
  hotelcampo: 'Hotel Campo de Fiori',
  civitatis: 'Civitatis',
}

export function captureHostFromUrl(search = window.location.search) {
  if (typeof window === 'undefined') return null

  const code = new URLSearchParams(search).get('h')
  if (!code) return null

  const payload = { host: code, ts: Date.now() }
  window.localStorage.setItem(HOST_KEY, JSON.stringify(payload))
  return code
}

export function getHost() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(HOST_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.host || !parsed?.ts) return null
    if (Date.now() - parsed.ts > HOST_TTL_MS) {
      window.localStorage.removeItem(HOST_KEY)
      return null
    }
    return parsed.host
  } catch {
    return null
  }
}

export function getHostLabel(code = getHost()) {
  if (!code) return null
  return HOST_MAP[code] ?? code
}

export function buildCheckoutUrl(baseUrl, { host, abVariantCents, productId } = {}) {
  if (!baseUrl) return null

  const url = new URL(baseUrl)
  if (host) url.searchParams.set('checkout[custom][host]', host)
  if (abVariantCents) url.searchParams.set('checkout[custom][ab_variant]', String(abVariantCents))
  if (productId) url.searchParams.set('checkout[custom][product_id]', productId)
  return url.toString()
}
