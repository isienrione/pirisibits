import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../manifest.js'
import {
  buildJournalTimeline,
  journalHeadline,
  pickJournalReflection,
  summarizeJournalProgress,
} from '../journalTimeline.js'

describe('journalTimeline', () => {
  const manifest = loadRomeManifest()

  it('builds act sections with waypoint statuses', () => {
    const timeline = buildJournalTimeline(manifest, {
      path: 'a',
      sequenceIndex: 0,
      completedWaypointIds: [],
    })

    expect(timeline[0]?.id).toBe('act1')
    expect(timeline[0]?.entries[0]).toMatchObject({
      id: 'w01',
      title: 'The Colosseum',
      status: 'current',
      onPath: true,
    })
  })

  it('marks completed waypoints and advances the current stop', () => {
    const timeline = buildJournalTimeline(manifest, {
      path: 'a',
      sequenceIndex: 1,
      completedWaypointIds: ['w01'],
    })

    expect(timeline[0].entries[0].status).toBe('completed')
    expect(timeline[0].entries[1].status).toBe('current')
  })

  it('flags optional off-path stops', () => {
    const timeline = buildJournalTimeline(manifest, {
      path: 'a',
      sequenceIndex: 0,
      completedWaypointIds: [],
    })

    const w04 = timeline.find((act) => act.id === 'act2')?.entries.find((entry) => entry.id === 'w04')
    expect(w04?.optional).toBe(true)
    expect(w04?.onPath).toBe(false)
  })

  it('picks reflections from manifest progress', () => {
    expect(pickJournalReflection(manifest, 0)).toBe(manifest.reflections.at(-1))
    expect(pickJournalReflection(manifest, 2)).toBe(manifest.reflections[1])
  })

  it('summarizes progress for the active path', () => {
    const timeline = buildJournalTimeline(manifest, {
      path: 'a',
      completedWaypointIds: ['w01', 'w02'],
    })
    const summary = summarizeJournalProgress(timeline)

    expect(summary.completed).toBe(2)
    expect(summary.total).toBeGreaterThan(10)
    expect(journalHeadline(summary)).toBe('Your Rome is unfolding.')
  })
})
