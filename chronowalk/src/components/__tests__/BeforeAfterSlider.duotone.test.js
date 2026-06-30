import { describe, expect, it } from 'vitest'
import { getModernDuotoneFilterStyle } from '../BeforeAfterSlider'

describe('getModernDuotoneFilterStyle', () => {
  const baseStyle = { objectFit: 'cover' }

  it('adds the duotone filter url for modern media when enabled', () => {
    expect(
      getModernDuotoneFilterStyle({
        duotone: true,
        filterId: 'cw-modern-duotone',
        baseStyle,
      })
    ).toEqual({
      objectFit: 'cover',
      filter: 'url(#cw-modern-duotone)',
    })
  })

  it('leaves the style untouched when duotone is disabled or in alignment mode', () => {
    expect(
      getModernDuotoneFilterStyle({
        duotone: false,
        filterId: 'cw-modern-duotone',
        baseStyle,
      })
    ).toBe(baseStyle)

    expect(
      getModernDuotoneFilterStyle({
        duotone: true,
        filterId: 'cw-modern-duotone',
        alignmentMode: true,
        baseStyle,
      })
    ).toBe(baseStyle)
  })
})
