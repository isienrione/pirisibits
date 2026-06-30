import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AudioTranscriptSection from '../AudioTranscriptSection'

describe('AudioTranscriptSection', () => {
  it('expands long transcript copy with show more', () => {
    const longText = 'A'.repeat(400)
    render(<AudioTranscriptSection waypoint={{ arrival_transcript: longText }} expandable serif />)

    expect(screen.getByText(/show more/i)).toBeInTheDocument()
    expect(screen.queryByText(longText)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /show more/i }))
    expect(screen.getByText(longText)).toBeInTheDocument()
  })
})
