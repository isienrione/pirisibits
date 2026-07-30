/**
 * Fetch a walking route GeoJSON line between two landmarks via Mapbox Directions.
 */
import {
  buildInstructionFromManeuver,
  cleanInstruction,
  extractBannerInstruction,
  instructionUsesStreet,
  normalizeWalkingSteps,
  pickBestWalkingDirections,
} from '../utils/walkingDirections'

export const fetchWalkingRoute = async (from, to, accessToken, options = {}) => {
  const result = await fetchWalkingDirections(from, to, accessToken, options)
  return result?.geometry ?? null
}

function parseMapboxStep(step) {
  const streetName = step.name || step.ref || null
  const bannerInstruction = extractBannerInstruction(step)
  const maneuverInstruction = cleanInstruction(step.maneuver?.instruction ?? '')
  const builtInstruction = buildInstructionFromManeuver(step.maneuver, streetName)

  let instruction = bannerInstruction

  if (!instruction && builtInstruction && !instructionUsesStreet(maneuverInstruction, streetName)) {
    instruction = builtInstruction
  }

  if (!instruction && maneuverInstruction) {
    instruction = maneuverInstruction
  }

  if (!instruction) {
    instruction = 'Continue'
  }

  return {
    instruction,
    streetName,
    distanceM: step.distance ?? 0,
    durationSec: step.duration ?? 0,
    type: step.maneuver?.type ?? 'continue',
    modifier: step.maneuver?.modifier ?? null,
  }
}

function parseMapboxRoute(route, { destinationTitle = null } = {}) {
  const leg = route?.legs?.[0]
  const steps = normalizeWalkingSteps(
    leg?.steps?.map(parseMapboxStep) ?? [],
    { destinationTitle },
  )

  if (!steps.length) return null

  return {
    geometry: route.geometry ?? null,
    distanceM: leg?.distance ?? route.distance ?? 0,
    durationSec: leg?.duration ?? route.duration ?? 0,
    steps,
  }
}

function buildDirectionsUrl(from, to, accessToken, options = {}) {
  const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const params = new URLSearchParams({
    // Mapbox Directions uses `geometries` (plural) for the response shape.
    geometries: 'geojson',
    overview: 'full',
    steps: 'true',
    banner_instructions: 'true',
    language: options.language ?? 'en',
    voice_units: 'metric',
    alternatives: 'true',
    walkway_bias: '-0.85',
    access_token: accessToken,
  })

  if (options.destinationName) {
    params.set('waypoint_names', `;${options.destinationName.slice(0, 120)}`)
  }

  // Profile path segment: mapbox/walking · required for pedestrian routing.
  return `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}?${params.toString()}`
}

/** Exposed for tests · confirms walking profile + steps + geojson geometry. */
export const buildWalkingDirectionsUrl = buildDirectionsUrl


const DIRECTIONS_TIMEOUT_MS = 10_000

/** Walking directions with turn-by-turn steps for in-app guidance. */
export const fetchWalkingDirections = async (from, to, accessToken, options = {}) => {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng || !accessToken) {
    return null
  }

  const url = buildDirectionsUrl(from, to, accessToken, options)
  const timeoutMs = options.timeoutMs ?? DIRECTIONS_TIMEOUT_MS

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timeoutId =
      controller && timeoutMs > 0
        ? setTimeout(() => controller.abort(), timeoutMs)
        : null
    let response
    try {
      response = await fetch(url, controller ? { signal: controller.signal } : undefined)
    } finally {
      if (timeoutId != null) clearTimeout(timeoutId)
    }
    if (!response.ok) {
      let detail = null
      try {
        const payload = await response.json()
        detail = payload?.message ?? payload?.code ?? null
      } catch {
        detail = null
      }
      console.warn('fetchWalkingDirections: Mapbox Directions failed.', response.status, detail)
      return null
    }

    const data = await response.json()
    if (data?.code && data.code !== 'Ok') {
      console.warn('fetchWalkingDirections: Mapbox Directions error.', data.code, data.message)
      return null
    }

    const routes = data?.routes ?? []
    if (!routes.length) return null

    const parsed = routes
      .map((route) =>
        parseMapboxRoute(route, { destinationTitle: options.destinationName ?? null }),
      )
      .filter(Boolean)

    const best = pickBestWalkingDirections(
      parsed.map((result) => ({
        ...result,
        origin: { lat: from.lat, lng: from.lng },
        destination: { lat: to.lat, lng: to.lng },
      })),
    )

    return best ?? null
  } catch (error) {
    console.warn('fetchWalkingDirections: Mapbox Directions failed.', error)
    return null
  }
}

/** Multi-stop walking route through ordered landmarks. */
export const fetchTourWalkingRoute = async (landmarks, accessToken) => {
  if (!landmarks?.length || landmarks.length < 2 || !accessToken) return null

  const coordinates = landmarks.map((point) => `${point.lng},${point.lat}`).join(';')
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}` +
    `?geometries=geojson&overview=full&walkway_bias=-0.85&access_token=${encodeURIComponent(accessToken)}`

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    return data?.routes?.[0]?.geometry ?? null
  } catch (error) {
    console.warn('fetchTourWalkingRoute: Mapbox Directions failed.', error)
    return null
  }
}
