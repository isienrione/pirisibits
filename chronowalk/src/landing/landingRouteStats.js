import { loadRomeManifest } from '../content/manifest.js'
import { getVisibleStopCounts } from '../content/services/stopCounts.js'
import { formatVisitStopsLabel } from '../content/tourProductTruth.js'

/** Landing/marketing copy derived from the live Rome manifest stop count. */
export function getLandingRouteStats(path = 'a') {
  const manifest = loadRomeManifest()
  const { total } = getVisibleStopCounts(manifest, path)
  const stopsLabel = formatVisitStopsLabel(total)

  return {
    total,
    stopsLabel,
    heroStatValue: stopsLabel,
    monumentsHeadline: `${stopsLabel} across ancient and living Rome.`,
    highlightBullet: stopsLabel,
    phoneSubline: `Your pace · ${stopsLabel}`,
    completeTierBullet: `All ${total} stops — Colosseum and Forum to the Appian Way`,
  }
}
