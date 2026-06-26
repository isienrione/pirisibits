import { describe, expect, it } from 'vitest'
import { typeHero, typeSectionTitle, typeBody, typeCaption } from '../ui/typography'

describe('typography tokens', () => {
  it('uses serif display for hero and section titles', () => {
    expect(typeHero).toContain('font-display')
    expect(typeSectionTitle).toContain('font-display')
    expect(typeHero).toContain('font-medium')
  })

  it('uses sans body and caption scales without bold weights', () => {
    expect(typeBody).toContain('font-sans')
    expect(typeCaption).toContain('text-caption')
    expect(typeBody).not.toContain('font-bold')
  })
})
