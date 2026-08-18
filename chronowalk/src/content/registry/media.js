import {
  BRAND_PLACEHOLDER_IMAGE,
  CITY_FALLBACK_PHOTO,
  CLUSTER_FALLBACK_PHOTOS,
  MEDIA_STATUS,
} from './constants.js'
import { mediaUrl } from '../../lib/mediaUrl.js'

/**
 * Resolve a display image without crashing or hiding content.
 * Hierarchy: content asset → cluster/city photo → branded placeholder.
 * Traveler UI never shows a "PLACEHOLDER" label.
 */
export function resolveContentMedia(item) {
  const imageMeta = item?.media?.image || {}
  const contentPath = imageMeta.path || item?.photo || null
  const clusterPath = CLUSTER_FALLBACK_PHOTOS[item?.clusterId] || null

  let source = 'brand'
  let path = BRAND_PLACEHOLDER_IMAGE
  let status = MEDIA_STATUS.PLACEHOLDER

  if (contentPath && imageMeta.status === MEDIA_STATUS.READY) {
    source = 'content'
    path = contentPath
    status = MEDIA_STATUS.READY
  } else if (clusterPath) {
    source = 'cluster'
    path = clusterPath
    status = MEDIA_STATUS.PLACEHOLDER
  } else if (CITY_FALLBACK_PHOTO) {
    source = 'city'
    path = CITY_FALLBACK_PHOTO
    status = MEDIA_STATUS.PLACEHOLDER
  }

  return {
    url: mediaUrl(path) || path,
    path,
    status,
    source,
    audioStatus: item?.media?.audio?.status || MEDIA_STATUS.NONE,
    visualStatus: item?.media?.visual?.status || MEDIA_STATUS.NONE,
  }
}

export function hasPlayableAudio(item) {
  return item?.media?.audio?.status === MEDIA_STATUS.READY && Boolean(item?.media?.audio?.path)
}

export function hasPlayableVisual(item) {
  return item?.media?.visual?.status === MEDIA_STATUS.READY && Boolean(item?.media?.visual?.path)
}
