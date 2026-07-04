import { describe, expect, it } from 'vitest'
import { getAspirationalJourney, getExploreMoreContent } from '../launchExploreMore'

describe('launchExploreMore', () => {
  it('features the four aspirational cities in order', () => {
    const content = getExploreMoreContent()

    expect(content.title).toBe('Explore more')
    expect(content.journeys.map((journey) => journey.city)).toEqual([
      'Florence',
      'Pompeii',
      'Athens',
      'Paris',
    ])
  })

  it('uses minimal journey copy without product language', () => {
    const content = getExploreMoreContent()
    const copy = [content.subtitle, ...content.journeys.map((journey) => journey.line)].join(' ')

    expect(copy).not.toMatch(/buy|purchase|price|places|tour package|add to cart/i)
    expect(content.journeys.every((journey) => journey.line.length < 90)).toBe(true)
  })

  it('resolves individual journeys by id', () => {
    expect(getAspirationalJourney('paris')?.city).toBe('Paris')
    expect(getAspirationalJourney('unknown')).toBeNull()
  })
})
