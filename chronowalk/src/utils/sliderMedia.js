/** Bust browser cache when replacing files at the same public/ path. Bump in seed after re-export. */
export const bustMediaUrl = (url, waypoint) => {
  if (!url) return null

  const version = waypoint?.media_cache_version ?? 1
  const token = waypoint?.id ? `${waypoint.id}-${version}` : String(version)

  if (/^https?:\/\//i.test(url)) {
    const parsed = new URL(url)
    parsed.searchParams.set('cwv', token)
    return parsed.toString()
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}cwv=${encodeURIComponent(token)}`
}

export const getModernSliderUrl = (waypoint) =>
  bustMediaUrl(waypoint?.modern_video_url || waypoint?.modern_image_url, waypoint)

export const getAncientSliderUrl = (waypoint) =>
  bustMediaUrl(waypoint?.ancient_video_url || waypoint?.ancient_image_url, waypoint)

export const hasModernSliderMedia = (waypoint) => Boolean(getModernSliderUrl(waypoint))

/** Hero frame used for poster stills after the animation finishes. Override with ?posterAt= or ?freezeAt= */
export const resolveSliderPosterAtSec = (waypointValue) => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    for (const key of ['posterAt', 'freezeAt']) {
      const param = params.get(key)
      if (param != null && param !== '') {
        const parsed = Number(param)
        if (Number.isFinite(parsed) && parsed >= 0) return parsed
      }
    }
  }

  if (typeof waypointValue === 'number' && Number.isFinite(waypointValue) && waypointValue >= 0) {
    return waypointValue
  }

  return null
}

/** @deprecated Use resolveSliderPosterAtSec */
export const resolveSliderFreezeAtSec = resolveSliderPosterAtSec

/** Extra loop time after the first animation playthrough before poster stills. Override with ?loopMs= */
export const resolveSliderPostAnimationLoopMs = (waypointValue) => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    for (const key of ['loopMs', 'holdMs']) {
      const param = params.get(key)
      if (param != null && param !== '') {
        const parsed = Number(param)
        if (Number.isFinite(parsed) && parsed >= 0) return parsed
      }
    }
  }

  if (typeof waypointValue === 'number' && Number.isFinite(waypointValue) && waypointValue >= 0) {
    return waypointValue
  }

  return 10000
}

/** @deprecated Use resolveSliderPostAnimationLoopMs */
export const resolveSliderPostAnimationHoldMs = resolveSliderPostAnimationLoopMs

export const getModernPosterUrl = (waypoint) => bustMediaUrl(waypoint?.modern_poster_url, waypoint)

export const getAncientPosterUrl = (waypoint) => bustMediaUrl(waypoint?.ancient_poster_url, waypoint)
