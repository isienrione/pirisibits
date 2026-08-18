/**
 * Consumer-level Hero Experiences.
 *
 * The Journey player still walks technical waypoint IDs (w17 → w23).
 * Discover / composer / ProposedRoute operate on one consumer Experience
 * so Pantheon exterior + interior never appear as two route nodes.
 */

import { PANTHEON_STOP_IDS } from '../../i18n/audio/heroStopAudioMap.js'

/** @typedef {{
 *   experienceId: string,
 *   placeFamily: string,
 *   title: string,
 *   waypointIds: string[],
 *   representativeId: string,
 * }} ConsumerHeroGroup
 */

/** @type {Record<string, ConsumerHeroGroup>} */
export const CONSUMER_HERO_GROUPS = Object.freeze({
  'rome:pantheon': Object.freeze({
    experienceId: 'rome:pantheon',
    placeFamily: 'pantheon',
    title: 'The Pantheon',
    waypointIds: [...PANTHEON_STOP_IDS],
    representativeId: 'w17',
  }),
})

const WAYPOINT_TO_GROUP = Object.freeze(
  Object.fromEntries(
    Object.values(CONSUMER_HERO_GROUPS).flatMap((group) =>
      group.waypointIds.map((id) => [id, group]),
    ),
  ),
)

export function consumerHeroGroupFor(id) {
  if (!id) return null
  if (CONSUMER_HERO_GROUPS[id]) return CONSUMER_HERO_GROUPS[id]
  return WAYPOINT_TO_GROUP[id] || null
}

export function consumerExperienceIdFor(item) {
  if (!item) return ''
  const group =
    consumerHeroGroupFor(item.id) ||
    consumerHeroGroupFor(item.heroId) ||
    consumerHeroGroupFor(item.experienceId)
  if (group) return group.experienceId
  return item.experienceId || item.placeId || item.id || ''
}

export function placeFamilyFor(item) {
  const group = consumerHeroGroupFor(item?.id) || consumerHeroGroupFor(item?.heroId)
  if (group) return group.placeFamily
  return item?.placeFamily || item?.placeId || item?.id || ''
}

export function playerSequenceFor(item) {
  const group = consumerHeroGroupFor(item?.id) || consumerHeroGroupFor(item?.heroId)
  if (group) return [...group.waypointIds]
  return item?.waypointIds || [item?.id].filter(Boolean)
}

/**
 * Collapse technical waypoint Heroes that belong to one consumer Experience.
 * `getRomeRegistry().heroes` stays 21 waypoint records for the player.
 */
export function collapseRankableHeroes(heroes = []) {
  const grouped = new Map()
  const passthrough = []

  for (const hero of heroes) {
    const group = consumerHeroGroupFor(hero.id) || consumerHeroGroupFor(hero.heroId)
    if (!group) {
      passthrough.push({
        ...hero,
        consumerExperienceId: hero.experienceId || hero.id,
        placeFamily: hero.placeId || hero.id,
        waypointIds: [hero.id],
        playerSequence: [hero.id],
      })
      continue
    }
    const list = grouped.get(group.experienceId) || []
    list.push(hero)
    grouped.set(group.experienceId, list)
  }

  const collapsed = []
  for (const [experienceId, members] of grouped) {
    const group = CONSUMER_HERO_GROUPS[experienceId]
    const representative =
      members.find((item) => item.id === group.representativeId) || members[0]
    const timeCostMin = members.reduce((sum, item) => sum + (Number(item.timeCostMin) || 0), 0)
    collapsed.push({
      ...representative,
      experienceId: group.experienceId,
      consumerExperienceId: group.experienceId,
      placeId: group.placeFamily,
      placeFamily: group.placeFamily,
      title: group.title,
      timeCostMin,
      waypointIds: [...group.waypointIds],
      playerSequence: [...group.waypointIds],
    })
  }

  return [...collapsed, ...passthrough]
}
