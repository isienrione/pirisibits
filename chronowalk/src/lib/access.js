import { supabase, isSupabaseConfigured } from './supabase'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DEV_TOKENS = new Set(['dev', 'local'])
const LOCAL_PURCHASE_TOKENS_KEY = 'cw_local_purchase_tokens_v1'

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

/** Persist a staging / offline purchase token for later /access validation. */
export function rememberLocalPurchaseToken(token) {
  if (typeof window === 'undefined' || !token || !UUID_RE.test(token)) return
  const next = [...new Set([...readLocalPurchaseTokens(), token])].slice(-20)
  try {
    window.localStorage.setItem(LOCAL_PURCHASE_TOKENS_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function isLocalPurchaseToken(token) {
  if (!token || !UUID_RE.test(token)) return false
  return readLocalPurchaseTokens().includes(token)
}

export function isAccessTokenFormat(token) {
  if (!token) return false
  if (allowsDevAccessTokens() && DEV_TOKENS.has(token.toLowerCase())) return true
  return UUID_RE.test(token)
}

export async function validateAccessToken(token) {
  if (!isAccessTokenFormat(token)) {
    return { ok: false, reason: 'invalid_format' }
  }

  if (allowsDevAccessTokens() && DEV_TOKENS.has(token.toLowerCase())) {
    return { ok: true, source: 'dev' }
  }

  if (isLocalPurchaseToken(token)) {
    return { ok: true, source: 'staging' }
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, reason: 'not_configured' }
  }

  try {
    const { data, error } = await supabase.rpc('validate_access_token', {
      p_token: token,
    })

    if (error) throw error

    return { ok: Boolean(data), source: 'supabase' }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
