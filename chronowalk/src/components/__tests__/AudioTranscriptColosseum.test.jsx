import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AudioTranscriptSection from '../AudioTranscriptSection'
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum'

describe('AudioTranscriptSection with Colosseum W01', () => {
  it('renders the published v2 transcript without placeholder copy', () => {
    render(<AudioTranscriptSection waypoint={COLOSSEUM_WAYPOINT} expandable serif />)

    expect(screen.getByText(/ground here used to be underwater/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument()
    expect(screen.queryByText(/placeholder — timed captions/i)).not.toBeInTheDocument()
  })
})
