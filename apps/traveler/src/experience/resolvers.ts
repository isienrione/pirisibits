import type { Treatment } from '@chronowalk/domain'
import type { ScreenId } from '../state/types'

export function screenForTreatment(treatment: Treatment, mysteryRevealed: boolean): ScreenId {
  switch (treatment) {
    case 'hero':
      return 'D01'
    case 'discovery':
      return 'D05'
    case 'micro':
      return 'D05'
    case 'reveal':
      return 'D09'
    case 'mystery':
      return mysteryRevealed ? 'D08' : 'D07'
    case 'walk':
      return 'C01'
    default:
      return 'D05'
  }
}
