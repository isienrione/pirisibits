import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import JourneyTimelineScreen from '../JourneyTimelineScreen'
import { loadRomeTourManifest } from '../../../content/romeTourManifest'
import { buildJourneyTimeline } from '../../../content/launchJourneyTimeline'

describe('JourneyTimelineScreen', () => {
  const manifest = loadRomeTourManifest()
  const timeline = buildJourneyTimeline({
    manifest,
    context: {
      completedStopIds: ['colosseum'],
      currentStopId: 'pantheon',
    },
    recap: {
      photos: [{ stopId: 'colosseum', capturedAt: '2026-07-04T09:00:00.000Z' }],
      audioListened: [{ stopId: 'colosseum', listenedAt: '2026-07-04T08:30:00.000Z' }],
    },
  })

  it('renders the explorer timeline with map and reminiscence moments', () => {
    render(
      <JourneyTimelineScreen
        intro={timeline.intro}
        routeLabel={timeline.routeLabel}
        monuments={timeline.monuments}
        moments={timeline.moments}
        manifest={manifest}
        completedStopIds={['colosseum', 'pantheon']}
        currentStopId="pantheon"
        onBack={vi.fn()}
      />
    )

    expect(screen.getByTestId('journey-timeline-screen')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /the path you walked/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/walking route map/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/visited monuments/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Colosseum' })).toBeInTheDocument()
    expect(screen.getByText(/Photo captured/i)).toBeInTheDocument()
  })

  it('selects monuments and returns to the letter', () => {
    const onSelectStop = vi.fn()
    const onBack = vi.fn()

    render(
      <JourneyTimelineScreen
        intro={timeline.intro}
        routeLabel={timeline.routeLabel}
        monuments={timeline.monuments}
        moments={timeline.moments}
        manifest={manifest}
        completedStopIds={['colosseum', 'pantheon']}
        currentStopId="pantheon"
        onSelectStop={onSelectStop}
        onBack={onBack}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Colosseum' }))
    expect(onSelectStop).toHaveBeenCalledWith('colosseum')

    fireEvent.click(screen.getByRole('button', { name: /back to your letter/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
