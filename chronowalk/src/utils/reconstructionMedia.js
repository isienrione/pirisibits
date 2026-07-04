import {
  getAncientPosterUrl,
  getAncientSliderUrl,
  bustMediaUrl,
} from './sliderMedia'

const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i

function isVideoUrl(url) {
  return Boolean(url && VIDEO_EXT.test(url))
}

/**
 * Prefer high-resolution ancient stills for pinch-zoom exploration.
 *
 * @param {{ reconstructionThen?: string, heroImage?: string }} stop
 * @param {object | null} waypoint
 */
export function resolveReconstructionMedia(stop, waypoint) {
  const ancientImage = waypoint?.ancient_image_url
    ? bustMediaUrl(waypoint.ancient_image_url, waypoint)
    : null

  const ancientRaw = getAncientSliderUrl(waypoint) || stop?.reconstructionThen || null
  const ancientStill =
    ancientRaw && !isVideoUrl(ancientRaw) ? ancientRaw : getAncientPosterUrl(waypoint)

  const imageUrl = ancientImage || ancientStill || null

  return {
    imageUrl,
    hasExploration: Boolean(imageUrl),
  }
}
