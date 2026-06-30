import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AudioTranscriptTabs from '../AudioTranscriptTabs'

vi.mock('../../hooks/useAudioProgress', () => ({
  useAudioProgress: () => ({
    currentTime: 12,
    duration: 120,
    playbackRate: 1,
    seekTo: vi.fn(),
    skipBy: vi.fn(),
    setPlaybackRate: vi.fn(),
  }),
}))

describe('AudioTranscriptTabs', () => {
  const baseProps = {
    waypoint: { arrival_subtitle: 'Ancient Rome awaits.' },
    title: 'The Colosseum',
    subtitle: 'Ancient Rome awaits.',
    posterUrl: '/poster.jpg',
    isPlaying: true,
    onToggle: vi.fn(),
    onStop: vi.fn(),
    onOpenFullPlayer: vi.fn(),
  }

  it('renders audio and transcript tabs with a docked mini player', () => {
    render(<AudioTranscriptTabs {...baseProps} />)

    expect(screen.getByRole('tab', { name: /audio/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /transcript/i })).toBeInTheDocument()
    expect(screen.getAllByText('The Colosseum').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByLabelText(/audio progress/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/open full audio player/i)).toBeInTheDocument()
  })

  it('switches to transcript content', () => {
    render(<AudioTranscriptTabs {...baseProps} />)

    fireEvent.click(screen.getByRole('tab', { name: /transcript/i }))
    expect(screen.getAllByText('Ancient Rome awaits.').length).toBeGreaterThanOrEqual(1)
  })
})
