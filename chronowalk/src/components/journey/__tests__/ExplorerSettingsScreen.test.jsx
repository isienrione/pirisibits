import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ExplorerSettingsScreen from '../ExplorerSettingsScreen'

vi.mock('../LaunchOfflineSettings', () => ({
  default: () => <div data-testid="launch-offline-settings" />,
}))

describe('ExplorerSettingsScreen', () => {
  const handlers = {
    onAudioEnabledChange: vi.fn(),
    onPlaybackSpeedChange: vi.fn(),
    onNotificationsChange: vi.fn(),
    onHapticsChange: vi.fn(),
    onBack: vi.fn(),
  }

  it('renders minimal grouped settings in explorer styling', () => {
    render(
      <ExplorerSettingsScreen
        audioEnabled
        playbackSpeedLabel="1×"
        notificationsEnabled
        hapticsEnabled
        reducedMotion={false}
        offlineTour={{ id: 'rome', title: 'Heart of Ancient Rome' }}
        {...handlers}
      />
    )

    expect(screen.getByTestId('explorer-settings-screen')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /settings/i })).toBeInTheDocument()
    expect(screen.getByText('Tour settings')).toBeInTheDocument()
    expect(screen.getByText('Audio settings')).toBeInTheDocument()
    expect(screen.getByText('Offline storage')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Help & Support')).toBeInTheDocument()
    expect(screen.getByText('Privacy')).toBeInTheDocument()
    expect(screen.getByTestId('launch-offline-settings')).toBeInTheDocument()
  })

  it('updates audio and playback preferences', () => {
    render(
      <ExplorerSettingsScreen
        audioEnabled
        playbackSpeedLabel="1.25×"
        notificationsEnabled={false}
        hapticsEnabled
        reducedMotion
        offlineTour={{ id: 'rome', title: 'Heart of Ancient Rome' }}
        {...handlers}
      />
    )

    fireEvent.click(screen.getByRole('switch', { name: /toggle story audio/i }))
    expect(handlers.onAudioEnabledChange).toHaveBeenCalledWith(false)

    fireEvent.click(screen.getByRole('button', { name: '1.25×' }))
    expect(handlers.onPlaybackSpeedChange).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /^back$/i }))
    expect(handlers.onBack).toHaveBeenCalledTimes(1)
  })
})
