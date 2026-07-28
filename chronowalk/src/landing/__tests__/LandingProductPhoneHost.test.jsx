import { describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
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

const CHAPTERS = [
  { id: 'choose', beats: ['a', 'b', 'c'] },
  { id: 'arrive', beats: ['a', 'b', 'c', 'd'] },
  { id: 'listen', beats: ['a', 'b', 'c'] },
  { id: 'walk', beats: ['a', 'b', 'c', 'd'] },
]

describe('LandingProductPhoneStage', () => {
  it('keeps one phone frame while layering real product screens', () => {
    const layerRefs = createRef()
    layerRefs.current = []
    render(
      <LandingProductPhoneStage
        chapters={CHAPTERS}
        layerRefs={layerRefs}
        beats={[0, 0, 0, 0]}
      />,
    )
    expect(screen.getByLabelText(/product demo/i)).toBeInTheDocument()
    expect(document.querySelectorAll('.cw-landing-phone').length).toBe(1)
    expect(document.querySelectorAll('.cw-v4-phone-layer').length).toBe(4)
    expect(screen.getAllByText(/roma eterna/i).length).toBeGreaterThan(0)
    expect(document.querySelector('img.cw-landing-phone__shot')).toBeNull()
  })

  it('mounts the real Pantheon free-preview player', () => {
    const layerRefs = createRef()
    layerRefs.current = []
    render(
      <LandingProductPhoneStage
        chapters={CHAPTERS}
        layerRefs={layerRefs}
        beats={[0, 0, 0, 0]}
      />,
    )
    expect(screen.getAllByText(/free complete stop/i).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('waypoint-immersive').length).toBeGreaterThan(0)
    expect(document.querySelector('img.cw-landing-phone__shot')).toBeNull()
  })

  it('mounts real walking companion map guidance without a resume overlay', () => {
    const layerRefs = createRef()
    layerRefs.current = []
    render(
      <LandingProductPhoneStage
        chapters={CHAPTERS}
        layerRefs={layerRefs}
        beats={[0, 0, 0, 0]}
      />,
    )
    expect(screen.getByTestId('walking-companion-screen')).toBeInTheDocument()
    expect(screen.getByTestId('landing-demo-walk-map')).toBeInTheDocument()
    expect(screen.getByTestId('landing-demo-walk-shell')).toBeInTheDocument()
    expect(screen.getByText(/walking to/i)).toBeInTheDocument()
    expect(screen.getByText(/the chapter is ready when you arrive/i)).toBeInTheDocument()
    expect(document.querySelector('.cw-v4-walk-resume')).toBeNull()
    expect(screen.queryByText(/rome kept your place/i)).not.toBeInTheDocument()
  })

  it('keeps walking map root mounted across later walk beats', () => {
    const layerRefs = createRef()
    layerRefs.current = []
    render(
      <LandingProductPhoneStage
        chapters={CHAPTERS}
        layerRefs={layerRefs}
        beats={[0, 0, 0, 2]}
      />,
    )
    expect(screen.getByTestId('walking-companion-screen')).toBeInTheDocument()
    expect(screen.getByTestId('landing-demo-walk-map')).toBeInTheDocument()
    expect(screen.queryByText(/rome kept your place/i)).not.toBeInTheDocument()
  })
})
