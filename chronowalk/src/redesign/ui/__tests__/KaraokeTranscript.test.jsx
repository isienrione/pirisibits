import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import KaraokeTranscript from '../KaraokeTranscript.jsx'

describe('KaraokeTranscript', () => {
  it('renders cleaned words and marks the active word while playing', () => {
    render(
      <KaraokeTranscript
        transcript="[warm] Hello world."
        currentTime={0.5}
        duration={2}
        playing
        testId="karaoke"
      />
    )

    expect(screen.getByTestId('karaoke')).toBeInTheDocument()
    expect(screen.queryByText(/\[warm\]/)).not.toBeInTheDocument()
    expect(screen.getByText('Hello')).toHaveAttribute('data-active', 'true')
    expect(screen.getByText('world.')).not.toHaveAttribute('data-active')
  })
})
