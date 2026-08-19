import { INTEREST_REASON_LABEL } from '../travelContext/taxonomy.js'
import { toRankerSignals } from '../travelContext/compat.js'

function collapseAnds(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\band\s+and\b/gi, 'and')
    .replace(/,\s*,/g, ',')
    .trim()
}

function joinList(items = []) {
  const labels = [...new Set(items.map((item) => String(item || '').trim()).filter(Boolean))]
  if (!labels.length) return ''
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}

function timePhrase(timeBudgetId, { inventoryLimited = false } = {}) {
  if (inventoryLimited) {
    if (timeBudgetId === '30min') return 'a little time'
    if (timeBudgetId === '1h') return 'about an hour'
    return 'a few hours'
  }
  if (timeBudgetId === '30min') return 'about 30 minutes'
  if (timeBudgetId === '1h') return 'about an hour'
  if (timeBudgetId === '2h') return 'a couple of hours'
  if (timeBudgetId === 'halfday') return 'a few hours'
  if (timeBudgetId === 'allday') return 'the day'
  return 'some time'
}

function momentPhrase(timeOfDay) {
  if (timeOfDay === 'morning') return 'morning'
  if (timeOfDay === 'evening' || timeOfDay === 'night') return 'evening'
  return 'afternoon'
}

function interestPhrase(interestIds = []) {
  const labels = interestIds
    .map((id) => {
      if (id === 'politics-power') return 'power'
      if (id === 'hidden-places' || id === 'hidden') return 'hidden details'
      if (id === 'iconic-sights') return 'iconic places'
      return INTEREST_REASON_LABEL[id]
    })
    .filter(Boolean)
  return joinList(labels)
}

function walkingLine(modes = [], walkingTolerance) {
  if ((modes || []).includes('walk') || !modes?.length) {
    if (walkingTolerance === 'short') return 'This route keeps the walking compact'
    if (walkingTolerance === 'long') return 'This route is happy to wander a little farther'
    return 'This route keeps the walking compact'
  }
  return 'This route stays easy to move through'
}

function mixLine(iconicVsHidden, items = []) {
  const hasMystery = items.some((item) => item.isMysteryDiscovery)
  if (iconicVsHidden === 'hidden' || hasMystery) {
    return 'and mixes one major Roman experience with smaller things most people pass by'
  }
  if (iconicVsHidden === 'iconic') {
    return 'and stays close to the places you said you wanted to see'
  }
  return 'and mixes one major Roman experience with smaller things most people pass by'
}

/**
 * Transparent explanation. Only real Context + route estimates.
 * Never concatenates raw arrays or duplicated conjunctions.
 */
export function explainProposedRoute({
  proposed,
  context,
  minutesAway = null,
  inventoryLimited = false,
  planningRemote = false,
} = {}) {
  const signals = toRankerSignals(context)
  const traveler = context?.traveler || {}
  const limited = inventoryLimited || proposed?.inventoryLimited
  const remote = planningRemote || proposed?.planningRemote
  const time = timePhrase(signals.timeBudgetId, { inventoryLimited: limited })
  const interests = interestPhrase(signals.interestIds)
  const opening = interests
    ? `You have ${time} and said you're drawn to ${interests}.`
    : `You have ${time} to explore Rome.`
  const walking = walkingLine(traveler.transportModes, traveler.walkingTolerance)
  const mix = mixLine(traveler.iconicVsHidden, proposed?.items || [])
  let second = `${walking} ${mix}.`
  if (Number.isFinite(minutesAway) && minutesAway > 0 && minutesAway < 40 && !remote) {
    second = `${walking} ${mix}, starting about ${minutesAway} minute${minutesAway === 1 ? '' : 's'} from you.`
  }
  const honest = limited
    ? "Here's a great first hour. Unlock more of Rome to extend the afternoon."
    : collapseAnds(second)

  const sentences = [collapseAnds(opening), honest].filter(Boolean)
  if (remote) sentences.push('Planning Rome from afar — walking times below are between stops, not from where you are now.')
  const body = collapseAnds(sentences.slice(0, 3).join(' '))

  const moment = momentPhrase(context?.session?.timeOfDay)
  const spoken = spokenDuration(proposed?.estimatedDurationMin)
  const homeHeadline = remote
    ? `A great ${spoken} in Rome`
    : limited
      ? 'A great first hour from here'
      : `A great ${spoken} from here`

  return {
    moment,
    headline: moment === 'morning' ? 'Your Roman morning' : `A beautiful ${moment} in Rome`,
    homeHeadline,
    greeting: moment === 'morning' ? 'Good morning.' : moment === 'evening' ? 'Good evening.' : 'Good afternoon.',
    body,
    contextLine: remote ? 'Planning Rome from afar' : `Based on your ${moment}`,
  }
}

export function spokenDuration(minutes) {
  const value = Math.max(0, Math.round(Number(minutes) || 0))
  if (value < 60) return `${value} minutes`
  const hours = Math.floor(value / 60)
  const rest = value % 60
  if (!rest) return hours === 1 ? '1 hour' : `${hours} hours`
  if (hours === 1) return `1 hour ${rest} minutes`
  return `${hours} hours ${rest} minutes`
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
  const visible = (items || []).filter((item) => !item.isMysteryDiscovery)
  const first = catalogById[visible[0]?.contentId]
  const last = catalogById[visible[visible.length - 1]?.contentId]
  const start = first?.shortTitle || first?.title
  const end = last?.shortTitle || last?.title
  const hasMystery = (items || []).some((item) => item.isMysteryDiscovery)
  if (start && end && start !== end) {
    if (hasMystery) {
      return [
        `Start at ${start}, drift past a hidden detail, and finish at ${end}.`,
      ]
    }
    return [`Start at ${start} and finish at ${end} — a compact walk without backtracking.`]
  }
  if (hasMystery) return ['Ancient space, a hidden detail, and nearby Rome without backtracking.']
  return ['A short, geographically close set of things worth doing now.']
}

export function hasDuplicatedConjunction(text) {
  return /\band\s+and\b/i.test(String(text || ''))
}
