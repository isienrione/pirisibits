import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingProductPhoneHost from '../v4/LandingProductPhoneHost.jsx'

vi.mock('../../hooks/useWalkingDirections.js', () => ({
  useWalkingDirections: () => ({
    directions: null,
    loading: false,
    error: null,
    retry: () => {},
  }),
}))

describe('LandingProductPhoneHost', () => {
  it('mounts real tour selection for the choose chapter', () => {
    render(<LandingProductPhoneHost chapterId="choose" phase={0} />)
    expect(screen.getByLabelText(/product demo/i)).toBeInTheDocument()
    expect(screen.getAllByText(/roma eterna/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/choose your/i)).toBeInTheDocument()
    expect(document.querySelector('.cw-v4-phone-artboard')).toBeTruthy()
    expect(document.querySelector('img.cw-landing-phone__shot')).toBeNull()
  })

  it('mounts the real Pantheon free-preview player', () => {
    render(<LandingProductPhoneHost chapterId="arrive" phase={0} />)
    expect(screen.getByText(/free preview · pantheon/i)).toBeInTheDocument()
    expect(screen.getByTestId('waypoint-immersive')).toBeInTheDocument()
    expect(document.querySelector('img.cw-landing-phone__shot')).toBeNull()
  })

  it('mounts real walking companion for the navigation chapter', () => {
    render(<LandingProductPhoneHost chapterId="walk" phase={0} />)
    expect(screen.getByTestId('walking-companion-screen')).toBeInTheDocument()
    expect(screen.getByTestId('landing-demo-walk-map')).toBeInTheDocument()
    expect(screen.getByText(/walking to/i)).toBeInTheDocument()
  })

  it('transitions walk chapter into the real resume screen', () => {
    render(<LandingProductPhoneHost chapterId="walk" phase={2} />)
    expect(screen.getByText(/rome kept your place/i)).toBeInTheDocument()
  })
})
