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

  it('uses the Campo de Fiori screen recording for arrive', () => {
    const layerRefs = createRef()
    layerRefs.current = []
    render(
      <LandingProductPhoneStage
        chapters={CHAPTERS}
        layerRefs={layerRefs}
        beats={[0, 0, 0, 0]}
        activeIndex={1}
      />,
    )
    expect(screen.getByTestId('landing-demo-arrive-campo')).toBeInTheDocument()
    const video = document.querySelector(
      '.cw-v4-arrive-static video[src="/landing/phone-mockups/arrive-campo-fiori.mp4"]',
    )
    expect(video).toBeTruthy()
    expect(video?.getAttribute('poster')).toBe(
      '/landing/phone-mockups/arrive-campo-fiori-poster.jpg',
    )
  })

  it('uses the audio-player lockup for listen instead of another Threshold replica', () => {
    const layerRefs = createRef()
    layerRefs.current = []
    render(
      <LandingProductPhoneStage
        chapters={CHAPTERS}
        layerRefs={layerRefs}
        beats={[0, 0, 0, 0]}
      />,
    )
    expect(screen.getByTestId('landing-demo-listen-static')).toBeInTheDocument()
    const listenImg = document.querySelector(
      '.cw-v4-listen-static img[src="/landing/phone-mockups/screen-01.png"]',
    )
    expect(listenImg).toBeTruthy()
  })

  it('uses the real Spanish Steps map lockup for walk', () => {
    const layerRefs = createRef()
    layerRefs.current = []
    render(
      <LandingProductPhoneStage
        chapters={CHAPTERS}
        layerRefs={layerRefs}
        beats={[0, 0, 0, 0]}
      />,
    )
    expect(screen.getByTestId('landing-demo-walk-static')).toBeInTheDocument()
    const walkImg = document.querySelector(
      '.cw-v4-walk-static img[src="/landing/phone-screens/walk-spanish-steps-real.jpeg"]',
    )
    expect(walkImg).toBeTruthy()
    expect(screen.queryByTestId('landing-demo-walk-companion')).not.toBeInTheDocument()
  })

  it('keeps the walk lockup mounted across later walk beats', () => {
    const layerRefs = createRef()
    layerRefs.current = []
    render(
      <LandingProductPhoneStage
        chapters={CHAPTERS}
        layerRefs={layerRefs}
        beats={[0, 0, 0, 2]}
      />,
    )
    expect(screen.getByTestId('landing-demo-walk-static')).toBeInTheDocument()
    expect(
      document.querySelector(
        '.cw-v4-walk-static img[src="/landing/phone-screens/walk-spanish-steps-real.jpeg"]',
      ),
    ).toBeTruthy()
  })
})
