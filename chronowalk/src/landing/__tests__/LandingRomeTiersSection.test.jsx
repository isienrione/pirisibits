import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LandingRomeTiersSection from '../LandingRomeTiersSection.jsx'
import { ROME_BUNDLES, ROME_TIERS, LANDING_CONTENT } from '../landingData.js'
import { getLandingTierStats } from '../landingTierStats.js'

vi.mock('../landingAnalytics.js', () => ({
  observeLandingSectionOnce: () => () => {},
  trackLandingPricingView: () => {},
}))

describe('LandingRomeTiersSection bundles', () => {
  it('renders three individual tours plus Couple and Family offers', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Roma Historica' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Roma Antica' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Roma Eterna' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Couple' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Family' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Share the walk, not the earbuds/i })).toBeInTheDocument()
  })

  it('keeps Historica / Antica / Eterna stop counts at 8 / 12 / 21', () => {
    expect(getLandingTierStats('rome-central').stopCount).toBe(8)
    expect(getLandingTierStats('rome-essential').stopCount).toBe(12)
    expect(getLandingTierStats('rome-complete').stopCount).toBe(21)
  })

  it('shows Couple price, seats, Roma Eterna content, per-person value, and savings', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const couple = screen.getByRole('article', { name: /^Couple$/i })
    expect(couple).toHaveTextContent('€25')
    expect(couple).toHaveTextContent(/2 people and devices/i)
    expect(couple).toHaveTextContent('Full Roma Eterna for each person')
    expect(couple).toHaveTextContent('All 21 stops')
    expect(couple).toHaveTextContent('Shared tour progress')
    expect(couple).toHaveTextContent('€12.50 per person')
    expect(couple).toHaveTextContent('Save €4.98')
  })

  it('shows Family price, seats, Roma Eterna content, per-person value, and savings', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const family = screen.getByRole('article', { name: /^Family$/i })
    expect(family).toHaveTextContent('€35')
    expect(family).toHaveTextContent(/Up to 4 people and devices/i)
    expect(family).toHaveTextContent('Full Roma Eterna for each person')
    expect(family).toHaveTextContent('All 21 stops')
    expect(family).toHaveTextContent('Shared tour progress')
    expect(family).toHaveTextContent(/€8\.75 per person/i)
    expect(family).toHaveTextContent(/Save up to €24\.96/i)
  })

  it('does not render group-bundle language anywhere in pricing or FAQ copy', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)
    expect(document.body.textContent).not.toMatch(/group bundles?/i)

    const faqText = JSON.stringify(LANDING_CONTENT.faq)
    expect(faqText).not.toMatch(/group bundles?/i)
    expect(LANDING_CONTENT.pricing.intro).not.toMatch(/group bundles?/i)
  })

  it('sends rome-couple and rome-family product ids to checkout without seat or content params', () => {
    const onBeginTier = vi.fn()
    render(<LandingRomeTiersSection onBeginTier={onBeginTier} />)

    fireEvent.click(screen.getByRole('button', { name: 'Choose Couple' }))
    fireEvent.click(screen.getByRole('button', { name: 'Choose Family' }))

    expect(onBeginTier).toHaveBeenNthCalledWith(1, 'rome-couple')
    expect(onBeginTier).toHaveBeenNthCalledWith(2, 'rome-family')
    expect(onBeginTier.mock.calls.every((call) => call.length === 1)).toBe(true)
  })

  it('exposes accessible names and focusable CTAs for both bundles', () => {
    render(<LandingRomeTiersSection onBeginTier={() => {}} />)

    const coupleCta = screen.getByRole('button', { name: 'Choose Couple' })
    const familyCta = screen.getByRole('button', { name: 'Choose Family' })
    expect(coupleCta).toBeEnabled()
    expect(familyCta).toBeEnabled()
    coupleCta.focus()
    expect(coupleCta).toHaveFocus()
    familyCta.focus()
    expect(familyCta).toHaveFocus()
  })

  it('keeps bundle catalog fields aligned with commerce truth', () => {
    expect(ROME_BUNDLES.map((b) => ({ id: b.id, price: b.price, cents: b.priceCents }))).toEqual([
      { id: 'rome-couple', price: '€25', cents: 2500 },
      { id: 'rome-family', price: '€35', cents: 3500 },
    ])
    expect(ROME_TIERS).toHaveLength(3)
    expect(ROME_BUNDLES).toHaveLength(2)
  })
})
