import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import StoryAudioPlayer from '../StoryAudioPlayer'

const stop = {
  id: 'colosseum',
  number: 1,
  title: 'The Colosseum',
  shortTitle: 'Colosseum',
  subtitle: 'Ancient Rome awaits — choose how you want to explore.',
  heroImage: '/waypoints/colosseum/exterior/modern-poster.jpg',
  audio: '/waypoints/colosseum/Audio_sample.mp3',
}

describe('StoryAudioPlayer', () => {
  const baseProps = {
    stop,
    chapterIndex: 1,
    chapterCount: 20,
    isOffline: true,
    isPlaying: false,
    duration: 180,
    currentTime: 45,
    progress: 0.25,
    playbackSpeed: 1,
    onTogglePlayback: vi.fn(),
    onSeekBy: vi.fn(),
    onSeekToProgress: vi.fn(),
    onCycleSpeed: vi.fn(),
    onBack: vi.fn(),
  }

  it('renders premium immersion audio layout with artwork and chapter title', () => {
    render(<StoryAudioPlayer {...baseProps} />)

    expect(screen.getByTestId('story-audio-player')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /the colosseum/i })).toBeInTheDocument()
    expect(screen.getByText('Chapter 1 of 20')).toBeInTheDocument()
    expect(screen.getByLabelText('Available offline')).toBeInTheDocument()
    expect(screen.getByLabelText('Story progress')).toBeInTheDocument()
    expect(screen.getByText('0:45')).toBeInTheDocument()
    expect(screen.getByText('3:00')).toBeInTheDocument()
  })

  it('exposes playback, speed, and dismiss controls without clutter', () => {
    const onTogglePlayback = vi.fn()
    const onCycleSpeed = vi.fn()
    const onBack = vi.fn()

    render(
      <StoryAudioPlayer
        {...baseProps}
        onTogglePlayback={onTogglePlayback}
        onCycleSpeed={onCycleSpeed}
        onBack={onBack}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /play story/i }))
    fireEvent.click(screen.getByRole('button', { name: /playback speed 1×/i }))
    fireEvent.click(screen.getByRole('button', { name: /close audio player/i }))

    expect(onTogglePlayback).toHaveBeenCalledTimes(1)
    expect(onCycleSpeed).toHaveBeenCalledTimes(1)
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
