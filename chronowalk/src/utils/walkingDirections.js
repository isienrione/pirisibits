/** Normalize Mapbox walking steps for readable in-app turn-by-turn guidance. */
export function normalizeWalkingSteps(steps) {
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

    if (
      previous &&
      step.distanceM < 20 &&
      (step.type === 'continue' || step.type === 'new name') &&
      (previous.type === 'continue' || previous.type === 'new name' || previous.type === 'depart')
    ) {
      previous.distanceM += step.distanceM
      previous.durationSec += step.durationSec
      if (step.distanceM >= 8) {
        previous.instruction = step.instruction
      }
      continue
    }

    merged.push({ ...step })
  }

  return merged
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
