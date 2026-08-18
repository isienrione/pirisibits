import { BRAND_PLACEHOLDER_IMAGE, MEDIA_STATUS, ROME_CLUSTERS } from './constants.js'
import { mediaUrl } from '../../lib/mediaUrl.js'

/**
 * Cluster color for honest placeholders — never a photograph of a different place.
 */
export const CLUSTER_PLACEHOLDER_TONES = Object.freeze({
  [ROME_CLUSTERS.AVENTINE]: { from: '#E8D4B8', to: '#C4A574' },
  [ROME_CLUSTERS.FORUM_BOARIUM]: { from: '#E4C9A8', to: '#B8895A' },
  [ROME_CLUSTERS.VELABRO]: { from: '#D9C4A8', to: '#8B7355' },
  [ROME_CLUSTERS.GHETTO]: { from: '#D7C2B0', to: '#9A6B4A' },
  [ROME_CLUSTERS.MATTEI]: { from: '#E2CDB4', to: '#A67C52' },
  [ROME_CLUSTERS.CAMPO]: { from: '#E6C9A0', to: '#C47A3A' },
  [ROME_CLUSTERS.PANTHEON]: { from: '#DCCBB0', to: '#8A6B4A' },
  [ROME_CLUSTERS.VENEZIA]: { from: '#D4C4A8', to: '#6B7A52' },
  [ROME_CLUSTERS.CORSO]: { from: '#E8D5B5', to: '#C4A050' },
  [ROME_CLUSTERS.FORUM]: { from: '#E0C9A4', to: '#B56A3A' },
  [ROME_CLUSTERS.PALATINE]: { from: '#D9C8A8', to: '#7C9A5C' },
  [ROME_CLUSTERS.CENTRO]: { from: '#E4D4B8', to: '#4E7D9B' },
  [ROME_CLUSTERS.APPIA]: { from: '#D5C8B0', to: '#6B7A52' },
})

export const DEFAULT_PLACEHOLDER_TONE = Object.freeze({ from: '#E9E2D5', to: '#C4B59A' })

/**
 * Resolve a display image without crashing or hiding content.
 *
 * Content-specific READY photo → use it.
 * Otherwise → branded/cluster texture placeholder.
 * Never fall back to a photograph of a different monument.
 */
export function resolveContentMedia(item) {
  const imageMeta = item?.media?.image || {}
  const contentPath = imageMeta.path || null
  const ready = Boolean(contentPath) && imageMeta.status === MEDIA_STATUS.READY

  if (ready) {
    return {
      url: mediaUrl(contentPath) || contentPath,
      path: contentPath,
      status: MEDIA_STATUS.READY,
      source: 'content',
      placeholder: false,
      clusterId: item?.clusterId || null,
      audioStatus: item?.media?.audio?.status || MEDIA_STATUS.NONE,
      visualStatus: item?.media?.visual?.status || MEDIA_STATUS.NONE,
    }
  }

  const tone = CLUSTER_PLACEHOLDER_TONES[item?.clusterId] || DEFAULT_PLACEHOLDER_TONE
  return {
    url: mediaUrl(BRAND_PLACEHOLDER_IMAGE) || BRAND_PLACEHOLDER_IMAGE,
    path: null,
    status: MEDIA_STATUS.PLACEHOLDER,
    source: 'placeholder',
    placeholder: true,
    clusterId: item?.clusterId || null,
    tone,
    audioStatus: item?.media?.audio?.status || MEDIA_STATUS.NONE,
    visualStatus: item?.media?.visual?.status || MEDIA_STATUS.NONE,
  }
}

export function isHonestContentPhoto(item) {
  const media = item?.mediaResolved || resolveContentMedia(item)
  return media.source === 'content' && media.status === MEDIA_STATUS.READY && Boolean(media.path)
}

export function hasPlayableAudio(item) {
  return item?.media?.audio?.status === MEDIA_STATUS.READY && Boolean(item?.media?.audio?.path)
}

export function hasPlayableVisual(item) {
  return item?.media?.visual?.status === MEDIA_STATUS.READY && Boolean(item?.media?.visual?.path)
}
