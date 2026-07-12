import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MapBottomCard, { MAP_BOTTOM_CARD_TOKENS } from '../MapBottomCard.jsx'

describe('MapBottomCard', () => {
  it('uses dark-surface token pairs with readable title and meta colors', () => {
    expect(MAP_BOTTOM_CARD_TOKENS.surface).toContain('var(--ink)')
    expect(MAP_BOTTOM_CARD_TOKENS.title).toBe('var(--warm-white)')
    expect(MAP_BOTTOM_CARD_TOKENS.meta).toContain('var(--warm-white)')
    expect(MAP_BOTTOM_CARD_TOKENS.meta).not.toBe(MAP_BOTTOM_CARD_TOKENS.surface)
    expect(MAP_BOTTOM_CARD_TOKENS.title).not.toBe('var(--ink-900)')
    expect(MAP_BOTTOM_CARD_TOKENS.ctaText).toBe('var(--ink-on-fill)')
  })

  it('renders arrived copy with landmark meta on the dark card surface', () => {
    render(
      <MapBottomCard
        title="You've arrived"
        meta="The Colosseum"
        ctaLabel="Open story"
        onCta={vi.fn()}
      />,
    )

    expect(screen.getByText("You've arrived")).toBeInTheDocument()
    expect(screen.getByText('The Colosseum')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open story' })).toBeInTheDocument()
  })
})
