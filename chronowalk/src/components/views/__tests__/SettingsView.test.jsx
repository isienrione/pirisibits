import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SettingsView from '../SettingsView'
import { JOURNEY_STATE } from '../../../hooks/useGeoLocation'

describe('SettingsView', () => {
  it('renders location, audio, reduced motion, and debug settings', () => {
    render(
      <SettingsView
        locationStatus="granted"
        journeyState={JOURNEY_STATE.TRANSIT}
        distance={180}
        audioEnabled
        onAudioEnabledChange={vi.fn()}
        debugMapEnabled={false}
        onDebugMapEnabledChange={vi.fn()}
        onRetryLocation={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('180 m to stop')).toBeInTheDocument()
    expect(screen.getByText('Audio stories')).toBeInTheDocument()
    expect(screen.getByText('Reduced motion')).toBeInTheDocument()
    expect(screen.getByText('Debug map overlays')).toBeInTheDocument()
  })

  it('toggles audio preference', () => {
    const onAudioEnabledChange = vi.fn()
    render(
      <SettingsView
        locationStatus="waiting"
        journeyState={JOURNEY_STATE.TRANSIT}
        distance={null}
        audioEnabled
        onAudioEnabledChange={onAudioEnabledChange}
        debugMapEnabled={false}
        onDebugMapEnabledChange={vi.fn()}
        onRetryLocation={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('switch', { name: /toggle audio stories/i }))

    expect(onAudioEnabledChange).toHaveBeenCalledWith(false)
  })

  it('shows location recovery guidance when permission is denied', () => {
    render(
      <SettingsView
        locationStatus="denied"
        journeyState={JOURNEY_STATE.TRANSIT}
        distance={null}
        audioEnabled
        onAudioEnabledChange={vi.fn()}
        debugMapEnabled={false}
        onDebugMapEnabledChange={vi.fn()}
        onRetryLocation={vi.fn()}
      />
    )

    expect(screen.getByText(/location access is off/i)).toBeInTheDocument()
    expect(screen.getByText('Permission denied')).toBeInTheDocument()
  })
})
