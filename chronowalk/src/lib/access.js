import { supabase, isSupabaseConfigured } from './supabase'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DEV_TOKENS = new Set(['dev', 'local'])
const LOCAL_PURCHASE_TOKENS_KEY = 'cw_local_purchase_tokens_v1'
const LOCAL_PURCHASE_META_KEY = 'cw_local_purchase_meta_v1'
/** Last validated purchase token — used for family bundles + cloud resume. */
export const ACCESS_TOKEN_KEY = 'cw_access_token_v1'

function allowsDevAccessTokens() {
  return import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEV_ACCESS === 'true'
}

export function parseAccessToken(search = '') {
  return new URLSearchParams(search).get('token')?.trim() ?? ''
}

function readLocalPurchaseTokens() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCAL_PURCHASE_TOKENS_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter((t) => typeof t === 'string') : []
  } catch {
    return []
  }
}

function readLocalPurchaseMeta() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LOCAL_PURCHASE_META_KEY)
    const meta = raw ? JSON.parse(raw) : {}
    return meta && typeof meta === 'object' ? meta : {}
  } catch {
    return {}
  }
}

/** Persist a staging / offline purchase token for later /access validation. */
export function rememberLocalPurchaseToken(token, productId = null) {
  if (typeof window === 'undefined' || !token || !UUID_RE.test(token)) return
  const next = [...new Set([...readLocalPurchaseTokens(), token])].slice(-20)
  try {
    window.localStorage.setItem(LOCAL_PURCHASE_TOKENS_KEY, JSON.stringify(next))
    if (productId) {
      const meta = { ...readLocalPurchaseMeta(), [token]: String(productId) }
      window.localStorage.setItem(LOCAL_PURCHASE_META_KEY, JSON.stringify(meta))
    }
  } catch {
    /* ignore */
  }
}

export function isLocalPurchaseToken(token) {
  if (!token || !UUID_RE.test(token)) return false
  return readLocalPurchaseTokens().includes(token)
}

export function productIdForLocalPurchaseToken(token) {
  if (!token) return null
  return readLocalPurchaseMeta()[token] ?? null
}

/** Persist the buyer's access token after a successful unlock. */
export function rememberAccessToken(token) {
  if (typeof window === 'undefined' || !token || !UUID_RE.test(token)) return
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

export function readAccessToken() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function clearAccessToken() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function isAccessTokenFormat(token) {
  if (!token) return false
  if (allowsDevAccessTokens() && DEV_TOKENS.has(token.toLowerCase())) return true
  return UUID_RE.test(token)
}

function normalizePurchasePayload(data) {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const ok = Boolean(data.ok ?? data.valid ?? data.exists)
    return {
      ok,
      productId: data.product_id ?? data.productId ?? null,
    }
  }
  return { ok: Boolean(data), productId: null }
}

export async function validateAccessToken(token) {
  if (!isAccessTokenFormat(token)) {
    return { ok: false, reason: 'invalid_format' }
  }

  if (allowsDevAccessTokens() && DEV_TOKENS.has(token.toLowerCase())) {
    return { ok: true, source: 'dev', productId: null }
  }

  if (isLocalPurchaseToken(token)) {
    return {
      ok: true,
      source: 'staging',
      productId: productIdForLocalPurchaseToken(token),
    }
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, reason: 'not_configured' }
  }

  try {
    const detailed = await supabase.rpc('get_purchase_for_token', {
      p_token: token,
    })

    if (!detailed.error && detailed.data != null) {
      const normalized = normalizePurchasePayload(detailed.data)
      if (normalized.ok) {
        return { ok: true, source: 'supabase', productId: normalized.productId }
      }
      return { ok: false, reason: 'invalid' }
    }

    const { data, error } = await supabase.rpc('validate_access_token', {
      p_token: token,
    })

    if (error) throw error

    const normalized = normalizePurchasePayload(data)
    return { ok: normalized.ok, source: 'supabase', productId: normalized.productId }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
