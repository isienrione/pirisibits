/**
 * Current-version Travel Context completeness.
 *
 * A prior guest session with `onboardingCompleted: true` is not enough.
 * Native boot must verify the fields the current onboarding flow collects
 * for route personalization.
 */

import { TRAVEL_CONTEXT_VERSION } from './schema.js'
import {
  DEPTH_VS_BREADTH,
  EXPLORATION_STYLES,
  ICONIC_VS_HIDDEN,
  LOCATION_STATUSES,
  TRANSPORT_MODES,
  TRIP_HORIZONS,
  URBAN_COMFORT,
  WALKING_TOLERANCE,
} from './taxonomy.js'

/** Bump when required first-run steps change. Independent of schema shape. */
export const ONBOARDING_FLOW_VERSION = 3

export const REQUIRED_CONTEXT_FIELDS = Object.freeze([
  'interests',
  'explorationStyle',
  'iconicVsHidden',
  'depthVsBreadth',
  'walkingTolerance',
  'transportModes',
  'urbanComfort',
  'tripHorizon',
  'availableTimeNow',
  'locationDecision',
])

function inList(value, allowed) {
  return typeof value === 'string' && allowed.includes(value)
}

/**
 * @param {import('./schema.js').TravelContext | null | undefined} context
 * @returns {{
 *   complete: boolean,
 *   missing: string[],
 *   contextSchemaVersion: number,
 *   contextCompleteness: number,
 * }}
 */
export function travelContextCompleteness(context) {
  const traveler = context?.traveler || {}
  const trip = context?.trip || {}
  const session = context?.session || {}
  const missing = []

  const hasInterests =
    traveler.surpriseMe === true || (traveler.positiveInterestIds || []).length > 0
  if (!hasInterests) missing.push('interests')
  if (!inList(traveler.explorationStyle, EXPLORATION_STYLES)) missing.push('explorationStyle')
  if (!inList(traveler.iconicVsHidden, ICONIC_VS_HIDDEN)) missing.push('iconicVsHidden')
  if (!inList(traveler.depthVsBreadth, DEPTH_VS_BREADTH)) missing.push('depthVsBreadth')
  if (!inList(traveler.walkingTolerance, WALKING_TOLERANCE)) missing.push('walkingTolerance')
  const modes = Array.isArray(traveler.transportModes) ? traveler.transportModes : []
  if (!modes.some((mode) => TRANSPORT_MODES.includes(mode))) missing.push('transportModes')
  if (!inList(traveler.urbanComfort, URBAN_COMFORT)) missing.push('urbanComfort')
  if (!inList(trip.tripHorizon, TRIP_HORIZONS)) missing.push('tripHorizon')
  if (!session.availableTimeNow && !context?.timeBudgetId) missing.push('availableTimeNow')
  const locationStatus = session.locationStatus || context?.locationStatus
  if (!inList(locationStatus, LOCATION_STATUSES)) missing.push('locationDecision')

  const complete = missing.length === 0
  const contextCompleteness = (REQUIRED_CONTEXT_FIELDS.length - missing.length) / REQUIRED_CONTEXT_FIELDS.length

  return {
    complete,
    missing,
    contextSchemaVersion: Number(context?.version) || TRAVEL_CONTEXT_VERSION,
    contextCompleteness,
  }
}

export function isTravelContextComplete(context) {
  return travelContextCompleteness(context).complete
}

/**
 * Payload that satisfies the current onboarding contract.
 * Tests and DEV reset helpers use this so they do not need to click through Context.
 */
export function completeOnboardingPayload(overrides = {}) {
  const traveler = {
    positiveInterestIds: ['architecture-design'],
    surpriseMe: false,
    explorationStyle: 'mix',
    iconicVsHidden: 'mix',
    depthVsBreadth: 'mix',
    walkingTolerance: 'moderate',
    transportModes: ['walk'],
    urbanComfort: 'visitor-areas',
    ...(overrides.traveler || {}),
  }
  const trip = {
    cityId: 'rome',
    tripHorizon: 'today',
    ...(overrides.trip || {}),
  }
  const session = {
    availableTimeNow: '1h',
    locationStatus: 'skipped',
    ...(overrides.session || {}),
  }
  return {
    interestIds: traveler.positiveInterestIds,
    surpriseMe: traveler.surpriseMe,
    timeBudgetId: session.availableTimeNow,
    locationStatus: session.locationStatus,
    lastPosition: session.location ?? overrides.lastPosition,
    ...overrides,
    traveler,
    trip,
    session,
  }
}
