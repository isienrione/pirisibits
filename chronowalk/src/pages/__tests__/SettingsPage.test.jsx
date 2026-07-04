import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsPage from '../SettingsPage'
import {
  readAudioSpeed,
  readTextSize,
  writeAudioSpeed,
  writeTextSize,
} from '../../utils/appPreferences'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('../../hooks/useGeoLocation', () => ({
  LOCATION_STATUS: {
    WAITING: 'waiting',
    GRANTED: 'granted',
    DENIED: 'denied',
    UNAVAILABLE: 'unavailable',
  },
  useGeoLocation: () => ({
    locationStatus: 'granted',
    retryLocation: vi.fn(),
  }),
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    navigate.mockClear()
    document.documentElement.style.fontSize = ''
  })

  it('renders the required settings rows', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByText('Location status')).toBeInTheDocument()
    expect(screen.getByText('Download for offline')).toBeInTheDocument()
    expect(screen.getByText('Audio speed')).toBeInTheDocument()
    expect(screen.getByText('Text size')).toBeInTheDocument()
    expect(screen.getByText('Restore purchase')).toBeInTheDocument()
    expect(screen.getByText('Privacy')).toBeInTheDocument()
    expect(screen.getByText('Help')).toBeInTheDocument()
    expect(screen.getAllByText('Coming soon')).toHaveLength(3)
  })

  it('persists audio speed selection', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: '1.25×' }))
    expect(readAudioSpeed()).toBe(1.25)
  })

  it('persists text size selection', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Large' }))
    expect(readTextSize()).toBe('large')
    expect(document.documentElement.style.fontSize).toBe('112%')
  })
})
