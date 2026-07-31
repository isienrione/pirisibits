import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import WelcomeFlow from '../WelcomeFlow'
import { WELCOME_REDUCED_MS } from '../../../data/welcomeConfig'

const playUiCueMock = vi.fn().mockResolvedValue(undefined)

vi.mock('../../../hooks/useJourney.js', () => ({
  useTourManifest: () => ({ manifest: { system: { ui: { phase_transition: 'ui_phase_seam.mp3' } } } }),
}))

vi.mock('../../../hooks/useAudioEngine.js', () => ({
  useAudioEngine: () => ({
    playUiCue: playUiCueMock,
  }),
}))

function renderWelcomeFlow() {
  return render(
    <MemoryRouter initialEntries={['/welcome-flow']}>
      <Routes>
        <Route path="/welcome-flow" element={<WelcomeFlow />} />
        <Route path="/begin" element={<div>Begin route</div>} />
        <Route path="/" element={<div>Landing route</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('WelcomeFlow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    playUiCueMock.mockClear()
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows splash branding then city select', () => {
    renderWelcomeFlow()

    expect(screen.getByText('ChronoWalk')).toBeInTheDocument()
    expect(screen.getByText('The world, as it once was.')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(WELCOME_REDUCED_MS)
    })

    expect(screen.getByRole('heading', { name: /cross into a/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rome/i })).toBeInTheDocument()
  })

  it('advances to entering Rome and navigates to landing', () => {
    renderWelcomeFlow()

    act(() => {
      vi.advanceTimersByTime(WELCOME_REDUCED_MS)
    })

    fireEvent.click(screen.getByRole('button', { name: /rome/i }))

    expect(screen.getByRole('heading', { name: 'Rome' })).toBeInTheDocument()
    expect(screen.getByText('Twenty-two places. Six acts. Stories that unlock exactly where you stand.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Begin' }))

    expect(screen.getByText('Landing route')).toBeInTheDocument()
  })
})
