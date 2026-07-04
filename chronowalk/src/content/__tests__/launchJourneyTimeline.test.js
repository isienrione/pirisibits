import { describe, expect, it } from 'vitest'
import { loadRomeTourManifest } from '../romeTourManifest'
import { buildJourneyTimeline, TIMELINE_MOMENT_KINDS } from '../launchJourneyTimeline'

describe('launchJourneyTimeline', () => {
  const manifest = loadRomeTourManifest()

  it('builds a reminiscence timeline for visited stops', () => {
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

    expect(timeline.monuments.map((monument) => monument.id)).toEqual(['colosseum', 'pantheon'])
    expect(timeline.intro).toMatch(/path you walked/i)
    expect(timeline.moments.some((moment) => moment.kind === TIMELINE_MOMENT_KINDS.WALKING)).toBe(
      true
    )
    expect(timeline.moments.some((moment) => moment.kind === TIMELINE_MOMENT_KINDS.PHOTO)).toBe(
      true
    )
    expect(timeline.moments.some((moment) => moment.kind === TIMELINE_MOMENT_KINDS.AUDIO)).toBe(
      true
    )
  })

  it('omits audio moments when no story was recorded', () => {
    const timeline = buildJourneyTimeline({
      manifest,
      context: {
        completedStopIds: [],
        currentStopId: 'colosseum',
      },
      recap: { photos: [], audioListened: [] },
    })

    expect(timeline.moments.some((moment) => moment.kind === TIMELINE_MOMENT_KINDS.AUDIO)).toBe(
      false
    )
    expect(timeline.moments.some((moment) => moment.kind === TIMELINE_MOMENT_KINDS.ARRIVAL)).toBe(
      true
    )
  })

  it('uses reminiscence copy instead of analytics language', () => {
    const timeline = buildJourneyTimeline({
      manifest,
      context: {
        completedStopIds: ['colosseum'],
        currentStopId: 'pantheon',
      },
      recap: { photos: [], audioListened: [] },
    })

    const copy = timeline.moments.map((moment) => moment.body).join(' ')
    expect(copy).not.toMatch(/metric|analytics|score|percent/i)
    expect(copy).toMatch(/walked|arrived|threshold/i)
  })
})
