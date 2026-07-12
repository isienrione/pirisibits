import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsBottomSheet from '../SettingsBottomSheet.jsx'
import { writeAudioSpeed } from '../../../utils/appPreferences.js'

vi.mock('../../../hooks/useOfflineAudio.js', () => ({
  useOfflineAudio: () => ({
    isReady: false,
    isDownloading: false,
    progress: null,
    error: null,
    startDownload: vi.fn(),
  }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderSheet(open = true) {
  const onClose = vi.fn()
  render(
    <MemoryRouter>
      <SettingsBottomSheet open={open} onClose={onClose} />
    </MemoryRouter>,
  )
  return { onClose }
}

describe('SettingsBottomSheet', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockReset()
  })

  it('renders essential traveler controls', () => {
    renderSheet()

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Audio speed')).toBeInTheDocument()
    expect(screen.getByText('Read instead of listen')).toBeInTheDocument()
    expect(screen.getByText('Text size')).toBeInTheDocument()
    expect(screen.getByText('Download today for offline')).toBeInTheDocument()
    expect(screen.getByText('Restore purchase')).toBeInTheDocument()
    expect(screen.getByText('Help')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText(/ChronoWalk · Rome · made to disappear\./)).toBeInTheDocument()
  })

  it('persists audio speed selection', () => {
    renderSheet()

    fireEvent.click(screen.getByRole('button', { name: '0.8×' }))
    expect(localStorage.getItem('chronowalk-audio-speed')).toBe('0.8')
  })

  it('restores prior audio speed from storage', () => {
    writeAudioSpeed(1.2)
    renderSheet()

    expect(screen.getByRole('button', { name: '1.2×' })).toBeInTheDocument()
  })
})
