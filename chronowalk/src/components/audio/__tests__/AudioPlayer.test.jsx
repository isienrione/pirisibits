import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AudioPlayer } from '../AudioPlayer'

vi.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}))

describe('AudioPlayer', () => {
  it('renders the expanded player with timeline and speed controls', () => {
    render(
      <AudioPlayer
        layout="expanded"
        title="The Colosseum"
        subtitle="Ancient Rome awaits."
        posterUrl="/poster.jpg"
        isPlaying
        currentTime={45}
        duration={180}
        playbackRate={1.25}
        onToggle={vi.fn()}
        onStop={vi.fn()}
        onSeek={vi.fn()}
        onCyclePlaybackRate={vi.fn()}
      />
    )

    expect(screen.getByText('The Colosseum')).toBeInTheDocument()
    expect(screen.getByText('Ancient Rome awaits.')).toBeInTheDocument()
    expect(screen.getByLabelText('Playback speed 1.25x. Tap to change.')).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Audio timeline' })).toBeInTheDocument()
    expect(screen.getByText('0:45')).toBeInTheDocument()
    expect(screen.getByText('-2:15')).toBeInTheDocument()
    expect(screen.getByLabelText('Pause audio')).toBeInTheDocument()
  })

  it('renders the mini player with remaining time', () => {
    render(
      <AudioPlayer
        layout="mini"
        title="The Pantheon"
        isPlaying={false}
        currentTime={10}
        duration={200}
        onToggle={vi.fn()}
        onLayoutChange={vi.fn()}
      />
    )

    expect(screen.getByText('The Pantheon')).toBeInTheDocument()
    expect(screen.getByText('-3:10')).toBeInTheDocument()
    expect(screen.getByLabelText('Play audio')).toBeInTheDocument()
  })

  it('expands from mini to collapsed layout', () => {
    const onLayoutChange = vi.fn()

    render(
      <AudioPlayer
        layout="mini"
        title="The Pantheon"
        isPlaying={false}
        currentTime={0}
        duration={120}
        onToggle={vi.fn()}
        onLayoutChange={onLayoutChange}
      />
    )

    fireEvent.click(screen.getAllByLabelText('Expand audio player')[0])
    expect(onLayoutChange).toHaveBeenCalledWith('collapsed')
  })
})
