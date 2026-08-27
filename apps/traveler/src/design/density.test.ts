import { describe, expect, it } from 'vitest'
import { assertNoDecorativeD0 } from './DensityProvider'

describe('D0', () => {
  it('forbids decorative primitives', () => {
    expect(() => assertNoDecorativeD0(0, 'PhotoPlaceholder')).toThrow(/D0/)
    expect(() => assertNoDecorativeD0(2, 'PhotoPlaceholder')).not.toThrow()
  })
})
