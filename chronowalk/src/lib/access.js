import { supabase, isSupabaseConfigured } from './supabase'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DEV_TOKENS = new Set(['dev', 'local'])

function allowsDevAccessTokens() {
  return import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEV_ACCESS === 'true'
}

export function parseAccessToken(search = '') {
  return new URLSearchParams(search).get('token')?.trim() ?? ''
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
