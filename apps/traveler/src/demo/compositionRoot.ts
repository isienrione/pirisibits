import { demoService } from './DemoTravelerAppService'
import type { TravelerAppService } from './TravelerAppService'

/** Composition root. Swap DemoTravelerAppService for the City Engine adapter here — not in screens. */
export function createTravelerAppService(): TravelerAppService {
  return demoService
}
