/**
 * Open external URLs — Capacitor Browser on iOS, window.open on web.
 */
import { IS_IOS } from './platform.js'

export async function openExternalUrl(url, { toolbarColor } = {}) {
  if (!url) return { ok: false, reason: 'missing_url' }

  if (IS_IOS) {
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({
        url,
        toolbarColor: toolbarColor || '#16130F',
      })
      return { ok: true, via: 'capacitor_browser' }
    } catch (err) {
      // Fall through to window.open
      console.warn('[openExternalUrl] Browser plugin failed', err)
    }
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
    return { ok: true, via: 'window' }
  }

  return { ok: false, reason: 'no_window' }
}

/** Apple Maps walking directions to a lat/lng. */
export function buildAppleMapsWalkUrl(lat, lng) {
  if (lat == null || lng == null) return null
  return `maps://?daddr=${lat},${lng}&dirflg=w`
}

export async function openAppleMapsWalk(lat, lng) {
  const url = buildAppleMapsWalkUrl(lat, lng)
  if (!url) return { ok: false, reason: 'missing_coords' }
  return openExternalUrl(url)
}
