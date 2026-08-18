import { CONTENT_TYPES } from '../registry/constants.js'
import { expandInterestIds } from '../../lib/travelContext/taxonomy.js'

function unique(items) {
  const seen = new Set()
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function hasTag(item, ids) {
  const tags = expandInterestIds(item.interestTags || [])
  return ids.some((id) => tags.has(id))
}

/**
 * Inventory sections. Empty sections are omitted by the caller.
 * Not a 51-card linear list.
 */
export function buildExploreSections({
  catalog = [],
  ranked = [],
  position = null,
  availableTimeNow = null,
  completedIds = [],
} = {}) {
  const completed = new Set(completedIds)
  const live = catalog.filter((item) => item.contentType === CONTENT_TYPES.HERO || item.contentType === CONTENT_TYPES.DISCOVERY)
  const near = position
    ? [...live]
        .filter((item) => item.geo?.lat != null)
        .sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity))
        .slice(0, 6)
    : []

  const forYou = (ranked || []).slice(0, 6)
  const essential = live.filter(
    (item) => item.contentType === CONTENT_TYPES.HERO || hasTag(item, ['iconic-sights']),
  )
  const hidden = live.filter((item) => hasTag(item, ['hidden-places']))
  const art = live.filter((item) => hasTag(item, ['art', 'architecture-design']))
  const ancient = live.filter(
    (item) =>
      (item.unlockScopes || []).includes('rome-ancient') || hasTag(item, ['history', 'politics-power']),
  )
  const small = live.filter((item) => item.contentType === CONTENT_TYPES.DISCOVERY && item.timeCostMin <= 4)
  const minutes =
    availableTimeNow === '30min' ? 30 : availableTimeNow === '1h' ? 60 : availableTimeNow === '2h' ? 120 : null
  const goodNow = minutes
    ? live.filter((item) => !completed.has(item.id) && (item.timeCostMin || 0) <= minutes)
    : live.filter((item) => !completed.has(item.id))

  return [
    { id: 'near', title: 'Near you', items: unique(near) },
    { id: 'for-you', title: 'For you', items: unique(forYou) },
    { id: 'essential', title: 'Essential Rome', items: unique(essential).slice(0, 10) },
    { id: 'hidden', title: 'Hidden Rome', items: unique(hidden).slice(0, 10) },
    { id: 'art', title: 'Art & design', items: unique(art).slice(0, 10) },
    { id: 'ancient', title: 'Ancient Rome', items: unique(ancient).slice(0, 10) },
    { id: 'small', title: 'Small things worth noticing', items: unique(small).slice(0, 10) },
    { id: 'now', title: 'Good right now', items: unique(goodNow).slice(0, 8) },
  ].filter((section) => section.items.length > 0)
}
