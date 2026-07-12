import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ApproachingScreen from '../ApproachingScreen.jsx'
import { COMPANION_MODES } from '../../../content/companionGuidance.js'

describe('ApproachingScreen', () => {
  it('shows companion off-route guidance while approaching', () => {
    render(
      <ApproachingScreen
        waypointName="The Forum"
        approachLine="The Forum opens"
        distance={420}
        companionMode={COMPANION_MODES.OFF_ROUTE}
      />
    )

    expect(screen.getByText(/approaching/i)).toBeInTheDocument()
    expect(screen.getByText(/off route/i)).toBeInTheDocument()
    expect(screen.getByText(/420 m away/i)).toBeInTheDocument()
  })
})
