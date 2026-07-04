import { ROME_CORE_TOUR } from '../data/rome-core-tour'

const LAUNCH_OFFLINE_TOURS = {
  rome: ROME_CORE_TOUR,
}

export function getLaunchOfflineTour(destinationId) {
  return LAUNCH_OFFLINE_TOURS[destinationId] ?? null
}
