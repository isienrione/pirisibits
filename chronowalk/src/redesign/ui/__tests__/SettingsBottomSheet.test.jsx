import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsBottomSheet from '../SettingsBottomSheet.jsx'
import { writeAudioSpeed } from '../../../utils/appPreferences.js'
import { FamilyWalkProvider } from '../../context/FamilyWalkContext.jsx'
import { writeAccessEntitlement, writeDeviceCredential } from '../../../lib/accessSession.js'

vi.mock('../../../lib/familyWalk.js', async () => {
  const actual = await vi.importActual('../../../lib/familyWalk.js')
  return {
    ...actual,
    refreshFamilyBundle: vi.fn(async () => null),
  }
})

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
      <FamilyWalkProvider>
        <SettingsBottomSheet open={open} onClose={onClose} />
      </FamilyWalkProvider>
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
    expect(screen.getByText('Download for offline')).toBeInTheDocument()
    expect(screen.getByText('Restore purchase')).toBeInTheDocument()
    expect(screen.getByText('Help')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByTestId('analytics-preferences')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /marketing preferences/i })).toBeInTheDocument()
    expect(screen.queryByTestId('family-walk-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('settings-walk-together')).not.toBeInTheDocument()
    expect(screen.queryByTestId('settings-change-route')).not.toBeInTheDocument()
    expect(screen.getByText(/ChronoWalk · Rome · made to disappear/)).toBeInTheDocument()
  })

  it('surfaces Change or customize route for Roma Eterna purchasers', () => {
    localStorage.setItem('cw_purchased_tier_v1', 'rome-complete')
    renderSheet()
    expect(screen.getByTestId('settings-change-route')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('settings-change-route'))
    expect(mockNavigate).toHaveBeenCalledWith('/begin?chooseRoute=1')
  })

  it('surfaces Walk together for a verified bundle entitlement', () => {
    writeDeviceCredential('bundle-credential-abcdefghij')
    writeAccessEntitlement({
      purchasedProductId: 'rome-couple',
      contentProductId: 'rome-complete',
      seatLimit: 2,
      role: 'owner',
      bundleStatus: 'active',
      offlineLeaseExpiresAt: Date.now() + 60_000,
    })
    renderSheet()
    expect(screen.getByTestId('settings-walk-together')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('settings-walk-together'))
    expect(mockNavigate).toHaveBeenCalledWith('/walk-together')
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
