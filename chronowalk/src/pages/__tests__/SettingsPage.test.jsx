import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsPage from '../SettingsPage'
import {
  readAudioEnabled,
  readAudioSpeed,
  readHapticsEnabled,
  readNotificationsEnabled,
} from '../../utils/appPreferences'

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('../../components/journey/LaunchOfflineSettings', () => ({
  default: () => <div data-testid="launch-offline-settings" />,
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the launch settings page', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )

    expect(screen.getByTestId('explorer-settings-screen')).toBeInTheDocument()
    expect(screen.getByText('Heart of Ancient Rome')).toBeInTheDocument()
  })

  it('persists audio and notification preferences', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('switch', { name: /toggle story audio/i }))
    expect(readAudioEnabled()).toBe(false)

    fireEvent.click(screen.getByRole('switch', { name: /toggle journey notifications/i }))
    expect(readNotificationsEnabled()).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: '1.2×' }))
    expect(readAudioSpeed()).toBe(1.5)

    fireEvent.click(screen.getByRole('switch', { name: /toggle haptic feedback/i }))
    expect(readHapticsEnabled()).toBe(false)
  })
})
