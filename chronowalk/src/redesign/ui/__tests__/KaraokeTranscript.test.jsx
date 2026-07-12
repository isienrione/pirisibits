import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import KaraokeTranscript from '../KaraokeTranscript.jsx'

describe('KaraokeTranscript', () => {
  it('renders cleaned transcript text without word highlighting', () => {
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
    expect(screen.getByText('Hello')).not.toHaveAttribute('data-active')
    expect(screen.getByText('world.')).not.toHaveAttribute('data-active')
  })
})
