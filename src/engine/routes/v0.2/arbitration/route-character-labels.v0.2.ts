/**
 * User-facing labels from observed route character, NOT originating lane.
 * A FLOW-generated route with highest DiscoveryFit can be labeled MORE_DISCOVERIES.
 */

import { LABEL_DELTA } from '@/src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import type {
  ArbitratedCandidate,
  UserFacingLabel,
} from '@/src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'

function val(n: number | null | undefined): number {
  return n ?? -Infinity
}

export function assignUserFacingLabels(
  recommended: ArbitratedCandidate,
  alternatives: ArbitratedCandidate[],
): void {
  recommended.userFacingLabel = 'RECOMMENDED_FOR_YOU'
  if (!alternatives.length) return

  const pool = [recommended, ...alternatives]
  const bestDiscovery = pool.reduce((a, b) =>
    val(b.features.discoveryFit.value) > val(a.features.discoveryFit.value) ? b : a,
  )
  const bestPhysical = pool.reduce((a, b) =>
    val(b.features.physicalEfficiency.value) > val(a.features.physicalEfficiency.value) ? b : a,
  )
  const bestEssential = pool.reduce((a, b) =>
    val(b.character.essentiality) > val(a.character.essentiality) ? b : a,
  )

  for (const alt of alternatives) {
    alt.userFacingLabel = null
  }

  const recDisc = val(recommended.features.discoveryFit.value)
  if (
    bestDiscovery !== recommended &&
    alternatives.includes(bestDiscovery) &&
    val(bestDiscovery.features.discoveryFit.value) - recDisc >= LABEL_DELTA
  ) {
    bestDiscovery.userFacingLabel = 'MORE_DISCOVERIES'
  }

  const recPhys = val(recommended.features.physicalEfficiency.value)
  if (
    bestPhysical !== recommended &&
    alternatives.includes(bestPhysical) &&
    !bestPhysical.userFacingLabel &&
    val(bestPhysical.features.physicalEfficiency.value) - recPhys >= LABEL_DELTA
  ) {
    bestPhysical.userFacingLabel = 'SMOOTHER_WALK'
  }

  const recEss = val(recommended.character.essentiality)
  if (
    bestEssential !== recommended &&
    alternatives.includes(bestEssential) &&
    !bestEssential.userFacingLabel &&
    val(bestEssential.character.essentiality) - recEss >= LABEL_DELTA
  ) {
    bestEssential.userFacingLabel = 'MORE_ESSENTIALS'
  }

  for (const alt of alternatives) {
    if (alt.userFacingLabel) continue
    if (val(alt.features.discoveryFit.value) >= recDisc + LABEL_DELTA * 0.5) {
      alt.userFacingLabel = 'MORE_DISCOVERIES'
    } else if (val(alt.features.physicalEfficiency.value) >= recPhys + LABEL_DELTA * 0.5) {
      alt.userFacingLabel = 'SMOOTHER_WALK'
    } else if (val(alt.character.essentiality) >= recEss + LABEL_DELTA * 0.5) {
      alt.userFacingLabel = 'MORE_ESSENTIALS'
    } else {
      alt.userFacingLabel = 'MORE_DISCOVERIES'
    }
  }
}

export function labelCopy(label: UserFacingLabel | null): string {
  switch (label) {
    case 'RECOMMENDED_FOR_YOU':
      return 'Recommended for you'
    case 'MORE_DISCOVERIES':
      return 'More discoveries'
    case 'SMOOTHER_WALK':
      return 'Smoother walk'
    case 'MORE_ESSENTIALS':
      return 'More essentials'
    case 'NO_MEANINGFUL_ALTERNATIVE':
      return 'No meaningful alternative'
    default:
      return ''
  }
}
