/** Bust browser cache when replacing files at the same public/ path. Bump in seed after re-export. */
export const bustMediaUrl = (url, waypoint) => {
  if (!url) return null
  if (url.startsWith('blob:')) return url

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

export const hasAncientSliderMedia = (waypoint) => Boolean(getAncientSliderUrl(waypoint))

/** Stops with only a modern animated video — no before/after comparison layer. */
export const isModernVideoImmersive = (waypoint) =>
  waypoint?.immersive_mode === 'modern_video' ||
  (hasModernSliderMedia(waypoint) && !hasAncientSliderMedia(waypoint))

export const hasComparisonSliderMedia = (waypoint) =>
  hasModernSliderMedia(waypoint) && hasAncientSliderMedia(waypoint) && !isModernVideoImmersive(waypoint)

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

/** Cover art for stops list, HUD, audio bar, and card hero — prefers modern-exterior stills. */
export const getModernCoverUrl = (waypoint) =>
  bustMediaUrl(waypoint?.modern_image_url || waypoint?.modern_poster_url, waypoint)

export const getAncientPosterUrl = (waypoint) => bustMediaUrl(waypoint?.ancient_poster_url, waypoint)

const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i

export const isSliderVideoUrl = (url) => Boolean(url && VIDEO_EXT.test(url))

const prefetchedWaypointKeys = new Set()
const prefetchedMediaUrls = new Set()

const rememberPrefetchedUrl = (url) => {
  if (!url || prefetchedMediaUrls.has(url)) return false
  prefetchedMediaUrls.add(url)
  return true
}

const prefetchPosterImage = (url) => {
  if (!rememberPrefetchedUrl(url)) return

  const image = new Image()
  image.referrerPolicy = 'no-referrer'
  image.src = url
}

const prefetchMediaLink = (url, as) => {
  if (!rememberPrefetchedUrl(url) || typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = as
  link.href = url
  document.head.appendChild(link)
}

const warmSliderVideo = (url) => {
  if (!url || !isSliderVideoUrl(url) || !rememberPrefetchedUrl(url)) return

  const video = document.createElement('video')
  video.preload = 'metadata'
  video.muted = true
  video.playsInline = true
  video.src = url
  video.load()
}

/** Warm poster stills and slider video metadata while approaching the next stop. */
export const prefetchArrivalSliderMedia = (waypoint) => {
  if (!waypoint?.id) return

  const cacheKey = `${waypoint.id}-${waypoint.media_cache_version ?? 1}`
  if (prefetchedWaypointKeys.has(cacheKey)) return
  prefetchedWaypointKeys.add(cacheKey)

  const modernPoster = getModernPosterUrl(waypoint)
  const ancientPoster = getAncientPosterUrl(waypoint)
  const modernSlider = getModernSliderUrl(waypoint)
  const ancientSlider = getAncientSliderUrl(waypoint)

  if (modernPoster) prefetchPosterImage(modernPoster)
  if (ancientPoster) prefetchPosterImage(ancientPoster)

  if (modernSlider) {
    if (isSliderVideoUrl(modernSlider)) {
      warmSliderVideo(modernSlider)
      prefetchMediaLink(modernSlider, 'video')
    } else {
      prefetchPosterImage(modernSlider)
    }
  }

  if (ancientSlider) {
    if (isSliderVideoUrl(ancientSlider)) {
      warmSliderVideo(ancientSlider)
      prefetchMediaLink(ancientSlider, 'video')
    } else {
      prefetchPosterImage(ancientSlider)
    }
  }
}

/** @internal test helper */
export const resetArrivalMediaPrefetchForTests = () => {
  prefetchedWaypointKeys.clear()
  prefetchedMediaUrls.clear()
}
