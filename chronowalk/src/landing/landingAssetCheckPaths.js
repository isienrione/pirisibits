import { getModernPosterThumbUrl } from '../content/modernPhotoRegistry.js'
import { ROME_LANDING_BASEMAP_BY_TIER } from './landingMapboxStatic.js'
import { LANDING_TIER_ROUTES } from './landingTierRoutes.js'

const LANDING_V2_WEBPS = [
  '/landing/hero-rome.webp',
  '/landing/threshold.webp',
  '/landing/lifestyle-couple.webp',
  '/landing/screen-map.webp',
  '/landing/screen-listening.webp',
  '/landing/screen-letter.webp',
]

/** Disk paths checked by scripts/check-assets.mjs (optimized assets only). */
export function getLandingAssetCheckPaths() {
  const paths = new Set(LANDING_V2_WEBPS)

  for (const jpgPath of Object.values(ROME_LANDING_BASEMAP_BY_TIER)) {
    paths.add(jpgPath.replace(/\.jpg$/, '.webp'))
  }

  for (const id of LANDING_TIER_ROUTES['rome-complete'] ?? []) {
    paths.add(getModernPosterThumbUrl(id))
  }

  paths.add(getModernPosterThumbUrl('forum-via-sacra'))
  paths.add(getModernPosterThumbUrl('pantheon'))

  return [...paths]
}
