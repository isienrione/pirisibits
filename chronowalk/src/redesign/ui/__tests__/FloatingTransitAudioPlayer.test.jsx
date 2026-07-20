import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FloatingTransitAudioPlayer from '../FloatingTransitAudioPlayer.jsx'

describe('FloatingTransitAudioPlayer', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(
      <FloatingTransitAudioPlayer visible={false} title="Approaching the Colosseum" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows title, remaining time, and play control when visible', () => {
    render(
      <FloatingTransitAudioPlayer
        visible
        title="Approaching the Colosseum"
        duration={120}
        currentTime={32}
        narrationPlaying
      />
    )

    expect(screen.getByTestId('transit-audio-panel')).toBeInTheDocument()
    expect(screen.getByText('Approaching the Colosseum')).toBeInTheDocument()
    expect(screen.getByText('−1:28')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pause narration/i })).toBeInTheDocument()
  })

  it('opens the full player when the card is tapped', () => {
    const onOpenFullPlayer = vi.fn()
    render(
      <FloatingTransitAudioPlayer
        visible
        title="Approaching the Colosseum"
        onOpenFullPlayer={onOpenFullPlayer}
      />
    )

    fireEvent.click(
      screen.getByRole('button', { name: /open full narration player/i })
    )
    expect(onOpenFullPlayer).toHaveBeenCalledTimes(1)
  })

  it('toggles playback without opening the full player', () => {
    const onToggle = vi.fn()
    const onOpenFullPlayer = vi.fn()
    render(
      <FloatingTransitAudioPlayer
        visible
        title="Approaching the Colosseum"
        onToggle={onToggle}
        onOpenFullPlayer={onOpenFullPlayer}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /play narration/i }))
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onOpenFullPlayer).not.toHaveBeenCalled()
  })
})
