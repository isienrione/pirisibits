import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PersistentAudioBar from '../PersistentAudioBar'
import { AUDIO_MODES } from '../../audio/AudioOrchestrator'

vi.mock('../../hooks/useAudioPlaybackState', () => ({
  useAudioPlaybackState: () => ({
    isTourNarrationActive: true,
    isTourNarrationPlaying: true,
    currentMode: AUDIO_MODES.ARRIVAL,
  }),
}))

describe('PersistentAudioBar', () => {
  it('opens the full player when the bar body is tapped', () => {
    const onOpenPlayer = vi.fn()
    render(
      <PersistentAudioBar
        title="The Colosseum"
        subtitle="Ancient Rome awaits."
        onOpenPlayer={onOpenPlayer}
        onTogglePlayback={vi.fn()}
        onStop={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /open full audio player/i }))
    expect(onOpenPlayer).toHaveBeenCalledTimes(1)
  })
})
