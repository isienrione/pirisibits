import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
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
  { id: 'begin', beats: [] },
  { id: 'arrive', beats: [] },
  { id: 'listen', beats: [] },
  { id: 'walk', beats: [] },
]

describe('LandingProductPhoneStage', () => {
  it('keeps one phone frame while layering lockup screens', () => {
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
  })

  it('uses IMG_1227 begin lockup', () => {
    const layerRefs = createRef()
    layerRefs.current = []
    render(
      <LandingProductPhoneStage chapters={CHAPTERS} layerRefs={layerRefs} beats={[0, 0, 0, 0]} />,
    )
    expect(screen.getByTestId('landing-demo-begin-lockup')).toBeInTheDocument()
    expect(
      document.querySelector(
        '.cw-v4-lockup img[src="/landing/phone-screens/begin-tour-lockup.jpeg"]',
      ),
    ).toBeTruthy()
  })

  it('uses IMG_1225 arrive lockup', () => {
    const layerRefs = createRef()
    layerRefs.current = []
    render(
      <LandingProductPhoneStage chapters={CHAPTERS} layerRefs={layerRefs} beats={[0, 0, 0, 0]} />,
    )
    expect(screen.getByTestId('landing-demo-arrive-lockup')).toBeInTheDocument()
    expect(
      document.querySelector('.cw-v4-lockup img[src="/landing/phone-screens/arrive-lockup.jpeg"]'),
    ).toBeTruthy()
  })

  it('uses Campo-mockup video for listen', () => {
    const layerRefs = createRef()
    layerRefs.current = []
    render(
      <LandingProductPhoneStage
        chapters={CHAPTERS}
        layerRefs={layerRefs}
        beats={[0, 0, 0, 0]}
        activeIndex={2}
      />,
    )
    expect(screen.getByTestId('landing-demo-listen-campo')).toBeInTheDocument()
    const video = document.querySelector(
      '.cw-v4-lockup video[src="/landing/phone-mockups/listen-campo-fiori.mp4"]',
    )
    expect(video).toBeTruthy()
    expect(video?.getAttribute('poster')).toBe(
      '/landing/phone-mockups/listen-campo-fiori-poster.jpg',
    )
    expect(video?.hasAttribute('muted')).toBe(false)
    expect(video?.muted).not.toBe(true)
    const toggle = screen.getByTestId('landing-demo-listen-campo-toggle')
    expect(toggle).toBeInTheDocument()
    expect(toggle.getAttribute('aria-label')).toMatch(/play demo with sound/i)
    expect(screen.getByText(/tap to play with sound/i)).toBeInTheDocument()
    expect(document.querySelector('.cw-v4-lockup__play-icon')).toBeTruthy()
    fireEvent.click(toggle)
  })

  it('uses IMG_1223 walk lockup', () => {
    const layerRefs = createRef()
    layerRefs.current = []
    render(
      <LandingProductPhoneStage chapters={CHAPTERS} layerRefs={layerRefs} beats={[0, 0, 0, 0]} />,
    )
    expect(screen.getByTestId('landing-demo-walk-lockup')).toBeInTheDocument()
    expect(
      document.querySelector('.cw-v4-lockup img[src="/landing/phone-screens/walk-lockup.jpeg"]'),
    ).toBeTruthy()
  })

  it('fills the phone artboard so walk tabs are not letterboxed', () => {
    const css = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../ChronoWalkLanding.v4.css'),
      'utf8',
    )
    const mediaRule = css.match(/\.cw-v4-lockup__media[\s\S]*?\{[\s\S]*?\}/)
    expect(mediaRule?.[0]).toMatch(/object-fit:\s*cover/)
    expect(mediaRule?.[0]).not.toMatch(/object-fit:\s*contain/)
  })

  it('sizes how-it-works phones to fit copy + device in one viewport', () => {
    const css = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../ChronoWalkLanding.v4.css'),
      'utf8',
    )
    expect(css).toMatch(/\.cw-acq-seq__phone\s*\{[^}]*100svh/s)
    expect(css).toMatch(/\.cw-acq-seq__phone\s*\{[^}]*14\.75rem/s)
    expect(css).toMatch(/\.cw-acq-seq__row\s*\{[^}]*min-height:\s*calc\(100svh/s)
  })
})
