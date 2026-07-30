import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import C4ArrivalMoment from '../C4ArrivalMoment.jsx'
import '../../redesign.css'

describe('C4ArrivalMoment', () => {
  it('shows the waypoint unlocked notice on Arrived', () => {
    render(
      <C4ArrivalMoment
        title="Arch of Titus"
        description="The city keeps its place for you."
        unlockNotice
        onBeginListening={() => {}}
        onTranscript={() => {}}
      />,
    )

    expect(screen.getByTestId('arrival-unlock-notice')).toHaveTextContent(/waypoint unlocked/i)
    expect(screen.getByRole('button', { name: /begin listening/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /read instead/i })).toBeInTheDocument()
  })

  it('hides the unlock notice when the cue is not active', () => {
    render(
      <C4ArrivalMoment
        title="Arch of Titus"
        onBeginListening={vi.fn()}
      />,
    )
    expect(screen.queryByTestId('arrival-unlock-notice')).not.toBeInTheDocument()
  })
})
