import { supabase, isSupabaseConfigured } from './supabase.js'
import { readAccessToken } from './access.js'
import { getDeviceId } from './deviceId.js'

const PUSH_DEBOUNCE_MS = 1200
let pushTimer = null
let lastPushedJson = null

/**
 * Pull cloud journey progress for a purchase token.
 * Returns a journey snapshot `{ state, context }` or null.
 */
export async function pullJourneyProgress(token = readAccessToken()) {
  if (!token || !isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase.rpc('get_journey_progress', {
      p_token: token,
      p_device_binding: getDeviceId(),
    })
    if (error || !data) return null

    const snapshot = data.snapshot ?? data
    if (!snapshot?.state || !snapshot?.context) return null
    return snapshot
  } catch {
    return null
  }
}

/** Push journey snapshot to the cloud (fire-and-forget safe). */
export async function pushJourneyProgress(snapshot, token = readAccessToken()) {
  if (!token || !snapshot || !isSupabaseConfigured()) return { ok: false }

  try {
    const { error } = await supabase.rpc('upsert_journey_progress', {
      p_token: token,
      p_snapshot: snapshot,
      p_device_binding: getDeviceId(),
    })
    if (error) return { ok: false, reason: error.message }
    lastPushedJson = JSON.stringify(snapshot)
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: error?.message ?? 'network' }
  }
}

/** Debounced cloud sync after local journey writes. */
export function scheduleJourneyCloudPush(snapshot) {
  if (typeof window === 'undefined') return
  if (!readAccessToken()) return

  const json = JSON.stringify(snapshot)
  if (json === lastPushedJson) return

  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    void pushJourneyProgress(snapshot)
  }, PUSH_DEBOUNCE_MS)
}

/** Test helper — flush pending debounce immediately. */
export function flushJourneyCloudPushForTests() {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
}
