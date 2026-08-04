import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import RedesignPreviewPage from '../RedesignPreviewPage.jsx'

vi.mock('../../../hooks/useV2Journey.js', () => ({
  useTourManifest: () => ({
    loading: false,
    manifest: { system: { preview: 'w17_ch1.mp3' }, waypoints: [{ id: 'w17', title: 'The Pantheon' }] },
  }),
}))

vi.mock('../../../content/manifest.js', () => ({
  getWaypoint: () => ({ id: 'w17', title: 'The Pantheon' }),
}))

vi.mock('../../../audio/audioUrl.js', () => ({
  resolvePreviewUrl: () => null,
}))

vi.mock('../../../landing/previewAudioHandoff.js', () => ({
  consumePreviewPlaybackIntent: () => false,
  getPreviewSessionAudio: () => null,
  retainPreviewPlaybackIntent: vi.fn(),
  stopPreviewSessionAudio: vi.fn(),
}))

vi.mock('../../RedesignRouteShell.jsx', () => ({
  default: function MockShell({ children }) {
    return <div>{children}</div>
  },
}))

vi.mock('../../screens/A2FreePreviewStory.jsx', () => ({
  default: function MockStory({ onStoryComplete }) {
    return (
      <button type="button" onClick={() => onStoryComplete?.()}>
        See the full tour
      </button>
    )
  },
}))

vi.mock('../../screens/A2PreviewGhostTour.jsx', () => ({
  default: function MockGhost({ onUnlock }) {
    return (
      <button type="button" onClick={() => onUnlock?.()}>
        Unlock full tour
      </button>
    )
  },
}))

function LocationProbe() {
  const location = useLocation()
  return (
    <div data-testid="location-probe">
      {location.pathname}
      {location.hash}
    </div>
  )
}

describe('RedesignPreviewPage unlock', () => {
  it('sends unlock to landing pricing instead of /access', () => {
    render(
      <MemoryRouter initialEntries={['/preview']}>
        <LocationProbe />
        <Routes>
          <Route path="/preview" element={<RedesignPreviewPage />} />
          <Route path="/" element={<div data-testid="landing-home">Landing</div>} />
          <Route path="/access" element={<div data-testid="access-page">Access</div>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /See the full tour/i }))
    fireEvent.click(screen.getByRole('button', { name: /Unlock full tour/i }))

    expect(screen.getByTestId('landing-home')).toBeInTheDocument()
    expect(screen.queryByTestId('access-page')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/#pricing')
  })
})
