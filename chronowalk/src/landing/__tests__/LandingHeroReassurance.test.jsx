import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingHeroReassurance from '../v4/LandingHeroReassurance.jsx'
import { LANDING_CONTENT } from '../landingData.js'

describe('LandingHeroReassurance', () => {
  it('renders the four factual items as a list', () => {
    render(
      <MemoryRouter>
        <LandingHeroReassurance />
      </MemoryRouter>,
    )

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

  it('links Pantheon Part 1 (FREE) to the free Pantheon acquisition page', () => {
    const onPreview = vi.fn()
    render(
      <MemoryRouter>
        <LandingHeroReassurance onPreview={onPreview} />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Pantheon Part 1 (FREE)' })
    expect(link).toHaveClass('cw-v4-reassure__link')
    expect(link).toHaveAttribute('href', '/free-pantheon')
    expect(onPreview).not.toHaveBeenCalled()
  })
})
