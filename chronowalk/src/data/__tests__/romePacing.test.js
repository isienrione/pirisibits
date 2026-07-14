import { describe, expect, it } from 'vitest'
import {
  JOURNEY_PACE,
  PACE_OPTIONS,
  OWN_PACE_OPTION,
  START_MODE,
  ROME_ACTS,
  getActForWaypoint,
  getBeginStartModes,
  getDefaultPace,
  getPaceForProductId,
  getPaceOption,
} from '../romePacing'

describe('romePacing', () => {
  it('defines three purchasable packages aligned with landing (no prices)', () => {
    expect(PACE_OPTIONS).toHaveLength(3)
    expect(PACE_OPTIONS[0]).toMatchObject({
      id: JOURNEY_PACE.HEROIC,
      title: 'Roma Eterna',
      productId: 'rome-complete',
    })
    expect(PACE_OPTIONS.every((option) => !option.priceLabel && !option.priceCents)).toBe(true)
    expect(getDefaultPace()).toBe(JOURNEY_PACE.HEROIC)
    expect(getPaceOption(JOURNEY_PACE.CLASSIC).title).toBe('Roma Antica')
    expect(getPaceOption(JOURNEY_PACE.CENTRAL).title).toBe('Roma Historica')
    expect(OWN_PACE_OPTION.id).toBe(JOURNEY_PACE.OWN)
  })

  it('maps landing product ids to paces', () => {
    expect(getPaceForProductId('rome-complete')).toBe(JOURNEY_PACE.HEROIC)
    expect(getPaceForProductId('rome-essential')).toBe(JOURNEY_PACE.CLASSIC)
    expect(getPaceForProductId('rome-central')).toBe(JOURNEY_PACE.CENTRAL)
  })

  it('offers full-route vs customize start modes for a purchased package', () => {
    const modes = getBeginStartModes(getPaceOption(JOURNEY_PACE.CLASSIC))
    expect(modes).toHaveLength(2)
    expect(modes[0]).toMatchObject({
      id: START_MODE.FULL,
      paceId: JOURNEY_PACE.CLASSIC,
      title: 'Full route',
      badge: 'Roma Antica',
    })
    expect(modes[1]).toMatchObject({
      id: START_MODE.OWN,
      paceId: JOURNEY_PACE.OWN,
      title: 'Customize stops',
    })
    expect(modes.some((mode) => /roma eterna|roma historica/i.test(mode.title))).toBe(false)
    expect(JSON.stringify(modes)).not.toMatch(/€|\$\d/)
  })

  it('maps waypoints to six acts plus encore', () => {
    expect(ROME_ACTS).toHaveLength(7)
    expect(getActForWaypoint('w01')?.title).toBe('The Arena')
    expect(getActForWaypoint('w15')?.title).toBe('The Living City')
    expect(getActForWaypoint('w22')?.title).toBe('The Long Road')
  })
})
