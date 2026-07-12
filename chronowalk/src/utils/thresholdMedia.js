import {
  getAncientPosterUrl,
  getAncientSliderUrl,
  getModernPosterUrl,
  getModernSliderUrl,
} from './sliderMedia'

const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i

function isVideoUrl(url) {
  return Boolean(url && VIDEO_EXT.test(url))
}

/**
 * @param {{ reconstructionNow?: string, reconstructionThen?: string, heroImage?: string }} stop
 * @param {object | null} waypoint
 */
export function resolveThresholdMedia(stop, waypoint) {
  const modernPoster = getModernPosterUrl(waypoint)
  const ancientPoster = getAncientPosterUrl(waypoint)
  const modernRaw = getModernSliderUrl(waypoint) || stop?.reconstructionNow || null
  const ancientRaw = getAncientSliderUrl(waypoint) || stop?.reconstructionThen || null

  const modernUrl =
    modernPoster ||
    (modernRaw && !isVideoUrl(modernRaw) ? modernRaw : null) ||
    stop?.heroImage ||
    null

  const ancientUrl =
    ancientPoster ||
    (ancientRaw && !isVideoUrl(ancientRaw) ? ancientRaw : null) ||
    null

  return {
    modernUrl,
    ancientUrl,
    hasComparison: Boolean(modernUrl && ancientUrl),
  }
}
