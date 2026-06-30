import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AudioPlayerScreen from '../AudioPlayerScreen'
import { AUDIO_MODES } from '../../audio/AudioOrchestrator'

vi.mock('../../hooks/useAudioPlaybackState', () => ({
  useAudioPlaybackState: () => ({
    isTourNarrationPlaying: false,
    currentMode: AUDIO_MODES.ARRIVAL,
  }),
}))

vi.mock('../../hooks/useAudioProgress', () => ({
  useAudioProgress: () => ({
    currentTime: 32,
    duration: 180,
    playbackRate: 1,
    seekTo: vi.fn(),
    skipBy: vi.fn(),
    setPlaybackRate: vi.fn(),
  }),
}))

describe('AudioPlayerScreen', () => {
  it('renders the full-screen player with scrubber and utility row', () => {
    render(
      <AudioPlayerScreen
        open
        title="The Colosseum"
        subtitle="Ancient Rome awaits."
        waypoint={{ arrival_subtitle: 'Ancient Rome awaits.' }}
        onClose={vi.fn()}
        onTogglePlayback={vi.fn()}
        onStop={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: /the colosseum/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/audio progress/i)).toBeInTheDocument()
    expect(screen.getByText('0:32')).toBeInTheDocument()
    expect(screen.getByText('3:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rewind 15 seconds/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /forward 15 seconds/i })).toBeInTheDocument()
    expect(screen.getByText('Speed')).toBeInTheDocument()
    expect(screen.getByText('Transcript')).toBeInTheDocument()
  })

  it('minimizes when the header chevron is pressed', () => {
    const onClose = vi.fn()
    render(
      <AudioPlayerScreen
        open
        title="The Colosseum"
        onClose={onClose}
        onTogglePlayback={vi.fn()}
        onStop={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /minimize audio player/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
