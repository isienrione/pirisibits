import { INTEREST_REASON_LABEL, TIME_BUDGETS } from '../travelContext/taxonomy.js'
import { toRankerSignals } from '../travelContext/compat.js'

function timePhrase(timeBudgetId) {
  const budget = TIME_BUDGETS.find((item) => item.id === timeBudgetId)
  if (!budget) return 'some time'
  if (timeBudgetId === '30min') return 'about 30 minutes'
  if (timeBudgetId === '1h') return 'about an hour'
  if (timeBudgetId === '2h') return 'about 2 hours'
  if (timeBudgetId === 'halfday') return 'half a day'
  if (timeBudgetId === 'allday') return 'the whole day'
  return 'time to explore'
}

function momentPhrase(timeOfDay) {
  if (timeOfDay === 'morning') return 'morning'
  if (timeOfDay === 'evening' || timeOfDay === 'night') return 'evening'
  return 'afternoon'
}

function interestPhrase(interestIds = []) {
  const labels = interestIds
    .map((id) => INTEREST_REASON_LABEL[id])
    .filter(Boolean)
  if (!labels.length) return null
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

function walkingPhrase(modes = [], walkingTolerance) {
  if ((modes || []).includes('walk') || !modes?.length) {
    if (walkingTolerance === 'short') return 'prefer shorter walks'
    if (walkingTolerance === 'long') return 'are happy walking farther'
    return 'prefer walking'
  }
  return 'are moving around the city'
}

function mixPhrase(iconicVsHidden) {
  if (iconicVsHidden === 'hidden') return 'like hidden details'
  if (iconicVsHidden === 'iconic') return 'like iconic places'
  return 'like a mix of iconic places and hidden details'
}

/**
 * Transparent explanation. Only real Context + route estimates.
 */
export function explainProposedRoute({ proposed, context, minutesAway = null } = {}) {
  const signals = toRankerSignals(context)
  const traveler = context?.traveler || {}
  const time = timePhrase(signals.timeBudgetId)
  const interests = interestPhrase(signals.interestIds)
  const walking = walkingPhrase(traveler.transportModes, traveler.walkingTolerance)
  const mix = mixPhrase(traveler.iconicVsHidden)
  const parts = [`You said you have ${time}`]
  if (interests) parts.push(`enjoy ${interests}`)
  parts.push(walking)
  parts.push(`and ${mix}`)
  let sentence = `${parts[0]}`
  if (parts.length === 2) sentence = `${parts[0]} and ${parts[1]}.`
  else sentence = `${parts[0]}, ${parts.slice(1, -1).join(', ')}, and ${parts[parts.length - 1]}.`

  if (Number.isFinite(minutesAway) && minutesAway > 0 && minutesAway < 40) {
    sentence += ` This route starts ${minutesAway} minute${minutesAway === 1 ? '' : 's'} from you and fits that profile.`
  } else {
    sentence += ' This route fits that profile.'
  }

  const moment = momentPhrase(context?.session?.timeOfDay)
  const durationLabel = formatDurationLabel(proposed?.estimatedDurationMin)

  return {
    moment,
    headline: `Here's a great plan for your ${moment}.`,
    homeHeadline: `I have a great ${String(durationLabel).replace(/^~/, '')} from here.`,
    body: sentence,
    contextLine: `Based on your ${moment}`,
  }
}

export function formatDurationLabel(minutes) {
  const value = Math.max(0, Math.round(Number(minutes) || 0))
  if (value < 60) return `~${value}m`
  const hours = Math.floor(value / 60)
  const rest = value % 60
  if (!rest) return `~${hours}h`
  return `~${hours}h ${rest}m`
}

export function formatKm(meters) {
  const value = Number(meters) || 0
  if (value < 1000) return `~${Math.round(value)} m walking`
  return `~${(value / 1000).toFixed(1)} km walking`
}

export function routeTags({ context, items, catalogById }) {
  const tags = []
  const outdoor = (items || []).every((item) => catalogById[item.contentId]?.indoorOutdoor !== 'indoor')
  if (outdoor) tags.push('mostly outdoors')
  const interests = context?.traveler?.positiveInterestIds || context?.interestIds || []
  for (const id of interests.slice(0, 3)) {
    const label = INTEREST_REASON_LABEL[id]
    if (label) tags.push(label)
  }
  return tags
}

export function routeRationale({ items, catalogById }) {
  const titles = (items || []).map((item) => catalogById[item.contentId]?.shortTitle || catalogById[item.contentId]?.title).filter(Boolean)
  if (titles.length < 2) return ['A short, geographically close set of things worth doing now.']
  return [
    `Starts with ${titles[0]}, moves through nearby Rome, and finishes at ${titles[titles.length - 1]}.`,
  ]
}
