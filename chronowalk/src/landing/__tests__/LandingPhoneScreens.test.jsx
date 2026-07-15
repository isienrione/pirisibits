import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ArriveScreen,
  JourneyPickScreen,
  ListeningScreen,
  PreviewScreen,
  LandingStepMockup,
} from '../LandingPhoneScreens.jsx'

describe('LandingPhoneScreens', () => {
  it('renders a realistic phone frame around the Rome route timeline', () => {
    const { container } = render(<JourneyPickScreen />)
    expect(container.querySelector('.cw-landing-phone__shell')).toBeTruthy()
    expect(container.querySelector('.cw-landing-phone__island')).toBeTruthy()
    expect(container.querySelector('.cw-landing-phone__btn--power')).toBeTruthy()
    expect(screen.getByLabelText(/rome route timeline/i)).toBeInTheDocument()
    expect(screen.getByText(/^chronowalk$/i)).toBeInTheDocument()
    expect(screen.getByText(/colosseum/i)).toBeInTheDocument()
    expect(screen.getByText(/arch of titus/i)).toBeInTheDocument()
    expect(screen.getByText(/my tour/i)).toBeInTheDocument()
    // Native PWA chrome — never a Safari URL bar.
    expect(container.textContent).not.toMatch(/chronowalk\.com/i)
  })

  it('renders the arrived product screen for step 3', () => {
    render(<ArriveScreen />)
    expect(screen.getByText(/you have arrived/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /begin chapter/i })).toBeInTheDocument()
    expect(screen.getByText(/journal/i)).toBeInTheDocument()
  })

  it('renders Arch of Titus listening and Pantheon preview variants', () => {
    const { rerender } = render(<ListeningScreen />)
    expect(screen.getByLabelText(/arch of titus chapter/i)).toBeInTheDocument()
    expect(screen.getByText(/skip ahead/i)).toBeInTheDocument()

    rerender(<PreviewScreen />)
    expect(screen.getByText(/free preview · pantheon/i)).toBeInTheDocument()
    expect(screen.getByText(/see the full tour/i)).toBeInTheDocument()
  })

  it('resolves arrive via LandingStepMockup', () => {
    render(<LandingStepMockup variant="arrive" />)
    expect(screen.getByText(/begin chapter/i)).toBeInTheDocument()
  })
})
