import { beforeEach, describe, expect, it } from 'vitest'
import {
  beginJourney,
  getJourneySnapshot,
  JOURNEY_STATES,
  markWaypointComplete,
  resetJourney,
  transitionJourney,
} from '../../state/journey.js'
import {
  consumeStoryChapterIntent,
  jumpToWaypointInJourney,
} from '../jumpToWaypoint.js'
import { loadRomeManifest } from '../../content/manifest.js'
import { JOURNEY_PACE } from '../../data/romePacing.js'

describe('jumpToWaypointInJourney progress', () => {
  const manifest = loadRomeManifest()

  beforeEach(() => {
    resetJourney()
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear()
    }
  })

  it('preserves completed stops when jumping from IDLE to an earlier waypoint', () => {
    beginJourney({ pace: JOURNEY_PACE.HEROIC, path: 'a', sequenceIndex: 10 })
    markWaypointComplete('w01')
    markWaypointComplete('w02')
    markWaypointComplete('w03')
    transitionJourney(JOURNEY_STATES.IDLE)

    const before = getJourneySnapshot().context.completedWaypointIds
    expect(before).toEqual(expect.arrayContaining(['w01', 'w02', 'w03']))

    const jumped = jumpToWaypointInJourney(
      manifest,
      'w02',
      getJourneySnapshot().context,
      JOURNEY_STATES.IDLE,
    )
    expect(jumped).toBe(true)

    const after = getJourneySnapshot()
    expect(after.context.completedWaypointIds).toEqual(expect.arrayContaining(['w01', 'w02', 'w03']))
    expect(after.state).toBe(JOURNEY_STATES.WALKING)
  })

  it('auto-promotes path A Palatine when jumping to w04 from the route card', () => {
    beginJourney({ pace: JOURNEY_PACE.HEROIC, path: 'a', sequenceIndex: 0 })
    expect(getJourneySnapshot().context.promotedOptionalIds).not.toContain('w04')

    const jumped = jumpToWaypointInJourney(
      manifest,
      'w04',
      getJourneySnapshot().context,
      JOURNEY_STATES.WALKING,
    )
    expect(jumped).toBe(true)

    const after = getJourneySnapshot()
    expect(after.context.promotedOptionalIds).toContain('w04')
    expect(after.context.completedWaypointIds).toEqual([])
  })

  it('opens STORY and stores chapter intent for Curia / Forum-view route taps', () => {
    beginJourney({ pace: JOURNEY_PACE.HEROIC, path: 'b', sequenceIndex: 0 })

    const jumped = jumpToWaypointInJourney(
      manifest,
      'w11_12',
      getJourneySnapshot().context,
      JOURNEY_STATES.WALKING,
      {
        targetState: JOURNEY_STATES.STORY,
        storyView: 'chapters',
        chapterIndex: 1,
      },
    )
    expect(jumped).toBe(true)
    expect(getJourneySnapshot().state).toBe(JOURNEY_STATES.STORY)
    expect(consumeStoryChapterIntent()).toBe(1)
    expect(consumeStoryChapterIntent()).toBeNull()
  })
})
