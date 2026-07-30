const GENERIC_STREET_PATTERN =
  /^(the\s+)?(walkway|footway|path|pedestrian(?:\s+road|\s+zone|\s+crossing)?|cycleway|road|street|steps|trail)$/i

const GENERIC_INSTRUCTION_PATTERN =
  /\b(the\s+)?(walkway|footway|path|pedestrian(?:\s+road|\s+zone|\s+crossing)?|cycleway)\b/i

/** Mapbox often labels archaeological paths as generic "walkway" - treat as unnamed. */
export function isGenericStreetName(name) {
  if (!name || typeof name !== 'string') return true
  const trimmed = name.trim()
  if (!trimmed) return true
  return GENERIC_STREET_PATTERN.test(trimmed)
}

export function isGenericInstruction(instruction) {
  if (!instruction) return true
  return GENERIC_INSTRUCTION_PATTERN.test(instruction)
}

export function instructionUsesStreet(instruction, streetName) {
  if (!instruction || !streetName) return false
  return instruction.toLowerCase().includes(streetName.toLowerCase())
}

export function scoreWalkingStepQuality(steps) {
  if (!steps?.length) return 0

  let score = 0
  const seen = new Set()

  for (const step of steps) {
    if (step.streetName && !isGenericStreetName(step.streetName)) {
      score += 4
    } else if (!isGenericInstruction(step.instruction)) {
      score += 2
    }

    seen.add(step.instruction)
  }

  score += seen.size * 1.5
  score -= Math.max(0, steps.length - seen.size) * 2

  return score
}

function formatMeters(distanceM) {
  const meters = Math.round(distanceM ?? 0)
  if (meters <= 0) return ''
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function capitalize(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Build a readable instruction when Mapbox only provides a street/ref name. */
export function buildInstructionFromManeuver(maneuver, streetName) {
  if (!maneuver || !streetName || isGenericStreetName(streetName)) return null

  const modifier = maneuver.modifier?.replace(/-/g, ' ') ?? null
  const type = maneuver.type ?? 'continue'

  if (type === 'depart') {
    return modifier ? `Head ${modifier} on ${streetName}` : `Head toward ${streetName}`
  }

  if (type === 'turn' || type === 'end of road' || type === 'fork' || type === 'merge') {
    return modifier ? `Turn ${modifier} onto ${streetName}` : `Turn onto ${streetName}`
  }

  if (type === 'continue' || type === 'new name') {
    return `Continue on ${streetName}`
  }

  if (type === 'arrive') {
    return `Arrive at ${streetName}`
  }

  return null
}

export function extractBannerInstruction(step) {
  const banner = step?.banner_instructions?.[0]
  const text = banner?.primary?.text ?? banner?.secondary?.text ?? null
  return text ? cleanInstruction(text) : null
}

/** Rewrite generic walkway steps into clearer guidance toward the destination. */
export function humanizeWalkingSteps(steps, destinationTitle = 'your stop') {
  if (!steps?.length) return []

  const destination = destinationTitle?.trim() || 'your stop'

  return steps.map((step, index) => {
    if (!isGenericInstruction(step.instruction)) {
      return step
    }

    const isLast = index === steps.length - 1
    const isArrive = step.type === 'arrive'
    const distanceLabel = formatMeters(step.distanceM)
    const modifier = step.modifier?.replace(/-/g, ' ')

    if (isArrive || (isLast && step.type !== 'depart')) {
      return { ...step, instruction: `Arrive at ${destination}` }
    }

    if (step.type === 'depart') {
      if (modifier && distanceLabel) {
        return { ...step, instruction: `Head ${modifier} toward ${destination} (${distanceLabel})` }
      }
      if (distanceLabel) {
        return { ...step, instruction: `Start walking toward ${destination} (${distanceLabel})` }
      }
      return { ...step, instruction: `Start walking toward ${destination}` }
    }

    if (modifier && distanceLabel) {
      return {
        ...step,
        instruction: `${capitalize(modifier)} in ${distanceLabel} toward ${destination}`,
      }
    }

    if (distanceLabel) {
      return { ...step, instruction: `Continue for ${distanceLabel} toward ${destination}` }
    }

    return { ...step, instruction: `Continue toward ${destination}` }
  })
}

/** Normalize Mapbox walking steps for readable in-app turn-by-turn guidance. */
export function normalizeWalkingSteps(steps, { destinationTitle = null } = {}) {
  if (!steps?.length) return []

  const cleaned = steps
    .map((step) => ({
      ...step,
      instruction: cleanInstruction(step.instruction),
    }))
    .filter((step, index, list) => {
      if (!step.instruction) return false
      if (step.type === 'arrive' && index < list.length - 1) return false
      if (step.type === 'depart' && step.distanceM < 3 && list.length > 1) return false
      return true
    })

  const merged = []

  for (const step of cleaned) {
    const previous = merged[merged.length - 1]

    const sameStreetName =
      previous?.streetName &&
      step.streetName &&
      previous.streetName.toLowerCase() === step.streetName.toLowerCase()

    const sameGenericStreet =
      sameStreetName &&
      (isGenericStreetName(previous.streetName) || isGenericStreetName(step.streetName))

    const bothGeneric =
      isGenericInstruction(previous?.instruction) && isGenericInstruction(step.instruction)

    if (
      previous &&
      (sameGenericStreet || bothGeneric) &&
      (step.type === 'continue' ||
        step.type === 'new name' ||
        step.type === 'turn' ||
        previous.type === 'turn' ||
        previous.type === 'continue' ||
        previous.type === 'depart')
    ) {
      previous.distanceM += step.distanceM
      previous.durationSec += step.durationSec
      if (!isGenericInstruction(step.instruction) && isGenericInstruction(previous.instruction)) {
        previous.instruction = step.instruction
      }
      if (step.streetName && !isGenericStreetName(step.streetName)) {
        previous.streetName = step.streetName
      }
      continue
    }

    if (
      previous &&
      step.distanceM < 20 &&
      (step.type === 'continue' || step.type === 'new name') &&
      (previous.type === 'continue' || previous.type === 'new name' || previous.type === 'depart')
    ) {
      previous.distanceM += step.distanceM
      previous.durationSec += step.durationSec
      if (step.distanceM >= 8 && !isGenericInstruction(step.instruction)) {
        previous.instruction = step.instruction
      }
      continue
    }

    merged.push({ ...step })
  }

  const deduped = []
  for (const step of merged) {
    const previous = deduped[deduped.length - 1]
    if (
      previous &&
      previous.instruction === step.instruction &&
      isGenericInstruction(step.instruction)
    ) {
      previous.distanceM += step.distanceM
      previous.durationSec += step.durationSec
      continue
    }
    deduped.push(step)
  }

  if (destinationTitle) {
    return humanizeWalkingSteps(deduped, destinationTitle)
  }

  return deduped
}

export function cleanInstruction(instruction) {
  if (!instruction) return ''
  return instruction
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isSameLocation(a, b, thresholdM = 35) {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return false

  const latDiff = (a.lat - b.lat) * 111_320
  const lngDiff = (a.lng - b.lng) * 111_320 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180))

  return Math.hypot(latDiff, lngDiff) <= thresholdM
}

export function buildGoogleMapsDirectionsUrl(from, to) {
  if (!to?.lat || !to?.lng) return null

  const params = new URLSearchParams({
    api: '1',
    destination: `${to.lat},${to.lng}`,
    travelmode: 'walking',
  })

  if (from?.lat != null && from?.lng != null) {
    params.set('origin', `${from.lat},${from.lng}`)
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`
}

export function pickBestWalkingDirections(candidates) {
  let best = null
  let bestScore = -1

  for (const candidate of candidates) {
    if (!candidate?.steps?.length) continue
    const score = scoreWalkingStepQuality(candidate.steps)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }

  return best
}
