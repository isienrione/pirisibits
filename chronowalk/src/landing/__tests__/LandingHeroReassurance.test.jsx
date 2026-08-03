import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import LandingHeroReassurance from '../v4/LandingHeroReassurance.jsx'
import { LANDING_CONTENT } from '../landingData.js'
import { LANDING_ANALYTICS_SECTIONS } from '../landingAnalytics.js'

describe('LandingHeroReassurance', () => {
  it('renders the four factual items as a list', () => {
    render(<LandingHeroReassurance />)

    const region = screen.getByRole('region', { name: /Why ChronoWalk is easy to start/i })
    expect(region).toBeInTheDocument()

    for (const item of LANDING_CONTENT.heroReassurance.items) {
      expect(screen.getByText(item.label)).toBeInTheDocument()
    }

    expect(screen.getByText('Opens in your browser, works as a mobile app')).toBeInTheDocument()
    expect(
      screen.getByText('Set up before you head out and get ready to walk'),
    ).toBeInTheDocument()
    expect(screen.getByText('No subscriptions')).toBeInTheDocument()
  })

  it('makes Pantheon Part 1 (FREE) a bold preview control', () => {
    const onPreview = vi.fn()
    render(<LandingHeroReassurance onPreview={onPreview} />)

    const link = screen.getByRole('button', { name: 'Pantheon Part 1 (FREE)' })
    expect(link).toHaveClass('cw-v4-reassure__link')
    expect(link.tagName).toBe('BUTTON')

    fireEvent.click(link)
    expect(onPreview).toHaveBeenCalledWith(LANDING_ANALYTICS_SECTIONS.HERO_REASSURANCE)
  })
})
