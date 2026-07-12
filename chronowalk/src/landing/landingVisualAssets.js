import { mediaUrl } from '../lib/mediaUrl.js'
import { colosseumNow, pantheonNow } from '../redesign/images.js'
import { getModernPosterThumbUrl } from '../content/modernPhotoRegistry.js'

const COLOSSEUM_EXTERIOR = '/waypoints/colosseum/exterior'
const LANDING_IMG = '/landing'

function landingAsset(baseName, fallbackExt) {
  return {
    webp: `${LANDING_IMG}/${baseName}.webp`,
    fallback: `${LANDING_IMG}/${baseName}.${fallbackExt}`,
  }
}

/** Normalize string or { webp, fallback } asset descriptors. */
export function landingPictureSources(asset) {
  if (!asset) return { webp: '', fallback: '' }
  if (typeof asset === 'string') return { webp: asset, fallback: asset }
  return asset
}

/** Shared landing imagery — keep NOW/THEN coherent across threshold demo + phone mockups. */
export const LANDING_COLOSSEUM_NOW = colosseumNow
export const LANDING_COLOSSEUM_THEN = mediaUrl(`${COLOSSEUM_EXTERIOR}/ancient-reconstruction.jpg`)
export const LANDING_COLOSSEUM_THEN_LOOP = mediaUrl(`${COLOSSEUM_EXTERIOR}/ancient-reconstruction.mp4`)
export const LANDING_PANTHEON_NOW = pantheonNow
export const LANDING_FORUM_NOW = mediaUrl('/waypoints/forum-cluster/forum-via-sacra/modern-poster.jpg')

/** List thumbnails for lifestyle banners (never full posters on landing). */
export const LANDING_LIFESTYLE_THUMBS = {
  forum: getModernPosterThumbUrl('forum-via-sacra'),
  pantheon: getModernPosterThumbUrl('pantheon'),
}

/** Premium landing redesign — static showcase assets from design reference. */
export const LANDING_V2 = {
  heroRome: landingAsset('hero-rome', 'png'),
  threshold: landingAsset('threshold', 'png'),
  lifestyleCouple: landingAsset('lifestyle-couple', 'png'),
  screenMap: landingAsset('screen-map', 'png'),
  screenListening: landingAsset('screen-listening', 'png'),
  screenLetter: landingAsset('screen-letter', 'png'),
}

/** Optimized basemap paths served on pricing cards. */
export function landingBasemapAsset(jpgPath) {
  return {
    webp: jpgPath.replace(/\.jpg$/, '.webp'),
    fallback: jpgPath,
  }
}
