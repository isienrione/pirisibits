import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingProductPhoneStage from '../v4/LandingProductPhoneStage.jsx'

vi.mock('../../hooks/useWalkingDirections.js', () => ({
  useWalkingDirections: () => ({
    directions: null,
    loading: false,
    error: null,
    retry: () => {},
  }),
}))

function visibleLayer(id, phase = 0) {
  return {
    id,
    phase,
    style: {
      opacity: 1,
      transform: 'translateY(0px) scale(1)',
      filter: 'none',
      pointerEvents: 'auto',
      visibility: 'visible',
    },
  }
}

function hiddenLayer(id) {
  return {
    id,
    phase: 0,
    style: {
      opacity: 0,
      transform: 'translateY(20px) scale(0.98)',
      filter: 'blur(6px)',
      pointerEvents: 'none',
      visibility: 'hidden',
    },
  }
}

describe('LandingProductPhoneStage', () => {
  it('keeps one phone frame while layering real product screens', () => {
    render(
      <LandingProductPhoneStage
        layers={[
          visibleLayer('choose', 0),
          hiddenLayer('arrive'),
          hiddenLayer('listen'),
          hiddenLayer('walk'),
        ]}
      />,
    )
    expect(screen.getByLabelText(/product demo/i)).toBeInTheDocument()
    expect(document.querySelectorAll('.cw-landing-phone').length).toBe(1)
    expect(document.querySelectorAll('.cw-v4-phone-layer').length).toBe(4)
    expect(screen.getAllByText(/roma eterna/i).length).toBeGreaterThan(0)
    expect(document.querySelector('img.cw-landing-phone__shot')).toBeNull()
  })

  it('mounts the real Pantheon free-preview player', () => {
    render(
      <LandingProductPhoneStage
        layers={[
          hiddenLayer('choose'),
          visibleLayer('arrive', 0),
          hiddenLayer('listen'),
          hiddenLayer('walk'),
        ]}
      />,
    )
    expect(screen.getAllByText(/free preview · pantheon/i).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('waypoint-immersive').length).toBeGreaterThan(0)
    expect(document.querySelector('img.cw-landing-phone__shot')).toBeNull()
  })

  it('mounts real walking companion for the navigation chapter', () => {
    render(
      <LandingProductPhoneStage
        layers={[
          hiddenLayer('choose'),
          hiddenLayer('arrive'),
          hiddenLayer('listen'),
          visibleLayer('walk', 0),
        ]}
      />,
    )
    expect(screen.getByTestId('walking-companion-screen')).toBeInTheDocument()
    expect(screen.getByTestId('landing-demo-walk-map')).toBeInTheDocument()
    expect(screen.getByText(/walking to/i)).toBeInTheDocument()
  })

  it('transitions walk chapter into the real resume screen', () => {
    render(
      <LandingProductPhoneStage
        layers={[
          hiddenLayer('choose'),
          hiddenLayer('arrive'),
          hiddenLayer('listen'),
          visibleLayer('walk', 2),
        ]}
      />,
    )
    expect(screen.getByText(/rome kept your place/i)).toBeInTheDocument()
  })
})
