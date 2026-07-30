import { describe, expect, it } from 'vitest'
import { JOURNEY_PACE } from '../../data/romePacing.js'
import { getPackRoutePreview } from '../packRoutePreview.js'

describe('getPackRoutePreview', () => {
  it('maps Eterna / Antica / Historica to marketing pack posters', () => {
    const eterna = getPackRoutePreview(JOURNEY_PACE.HEROIC)
    const antica = getPackRoutePreview(JOURNEY_PACE.CLASSIC)
    const historica = getPackRoutePreview(JOURNEY_PACE.CENTRAL)

    expect(eterna.marketingStopCount).toBe(21)
    expect(eterna.cardImage).toContain('package-roma-eterna')
    expect(antica.marketingStopCount).toBe(12)
    expect(antica.cardImage).toContain('package-roma-antica')
    expect(historica.marketingStopCount).toBe(8)
    expect(historica.cardImage).toContain('package-roma-historica')
  })

  it('returns null for own-pace custom routes', () => {
    expect(getPackRoutePreview(JOURNEY_PACE.OWN)).toBeNull()
  })
})
