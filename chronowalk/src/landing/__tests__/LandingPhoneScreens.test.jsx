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
  it('renders a realistic phone frame around the route overview', () => {
    const { container } = render(<JourneyPickScreen />)
    expect(container.querySelector('.cw-landing-phone__shell')).toBeTruthy()
    expect(container.querySelector('.cw-landing-phone__island')).toBeTruthy()
    expect(container.querySelector('.cw-landing-phone__btn--power')).toBeTruthy()
    expect(screen.getByLabelText(/route overview/i)).toBeInTheDocument()
    expect(screen.getByText(/18 stops · your route/i)).toBeInTheDocument()
    expect(screen.getByText(/enable location & begin/i)).toBeInTheDocument()
  })

  it('renders the arrived product screen for step 3', () => {
    render(<ArriveScreen />)
    expect(screen.getByText(/you have arrived/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /begin chapter/i })).toBeInTheDocument()
  })

  it('renders Arch of Titus listening and Pantheon preview variants', () => {
    const { rerender } = render(<ListeningScreen />)
    expect(screen.getByLabelText(/arch of titus chapter/i)).toBeInTheDocument()
    expect(screen.getByText(/skip ahead/i)).toBeInTheDocument()

    rerender(<PreviewScreen />)
    expect(screen.getByText(/free preview · pantheon/i)).toBeInTheDocument()
    expect(screen.getByText(/see the full tour/i)).toBeInTheDocument()
  })

  it('resolves listening via LandingStepMockup for how-it-works step 3', () => {
    const { container } = render(<LandingStepMockup variant="listening" />)
    expect(screen.getByLabelText(/arch of titus chapter/i)).toBeInTheDocument()
    expect(container.querySelector('.cw-landing-phone__shot')).toBeTruthy()
    expect(container.querySelector('img.cw-landing-phone__shot')?.getAttribute('src')).toMatch(
      /phone-screens\/listen\.jpg/,
    )
  })

  it('can still render live HTML screens when mode=live', () => {
    render(<LandingStepMockup variant="listening" mode="live" />)
    expect(screen.getByText(/skip ahead/i)).toBeInTheDocument()
  })
})
