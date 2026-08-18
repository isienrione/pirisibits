import { PANTHEON_STOP_IDS } from '../../i18n/audio/heroStopAudioMap.js'
import { completeCurrentItem, getActiveRoute } from './store.js'
import { currentRouteItem, isRouteLive } from './model.js'

export function matchesRouteContent(routeItem, contentId) {
  if (!routeItem || !contentId) return false
  if (routeItem.contentId === contentId) return true
  return routeItem.contentId === 'w17' && PANTHEON_STOP_IDS.includes(contentId)
}

/** Complete the live route item when a Hero or Discovery launched from it finishes. */
export function completeRouteContent(contentId) {
  const active = getActiveRoute()
  if (!isRouteLive(active)) return null
  const current = currentRouteItem(active)
  if (!matchesRouteContent(current, contentId)) return null
  return completeCurrentItem()
}

export function hasLiveRoute() {
  return isRouteLive(getActiveRoute())
}
