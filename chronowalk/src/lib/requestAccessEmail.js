import { env } from '../config/env.js'

/**
 * Ask the edge function to email a fresh access link.
 * Always resolves with a traveler-safe message (no match leakage).
 *
 * @param {{ email: string, orderId: string }} input
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function requestAccessEmail({ email, orderId }) {
  const fallback = {
    ok: true,
    message:
      'If that purchase email and Paddle order match our records, a fresh ChronoWalk access email is on its way. Check inbox and junk — Microsoft/Outlook sometimes files it under Other or Junk.',
  }

  const url = env.supabaseUrl
  const key = env.supabaseAnonKey
  if (!url || !key) return fallback

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/functions/v1/request-access-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify({
        email: String(email ?? '').trim(),
        orderId: String(orderId ?? '').trim(),
      }),
    })
    const json = await res.json().catch(() => null)
    if (json?.message) {
      return { ok: true, message: String(json.message) }
    }
    return fallback
  } catch {
    return fallback
  }
}
