import { describe, expect, it, beforeEach } from 'vitest'
import {
  getJourneyRecapStorageKey,
  hasAudioListened,
  hasJournalReflection,
  hasPhotoCapture,
  readJourneyRecap,
  recordAudioListened,
  recordJournalReflection,
  recordPhotoCapture,
} from '../journeyRecapStorage'

describe('journeyRecapStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('starts with an empty recap', () => {
    expect(readJourneyRecap()).toEqual({
      photos: [],
      audioListened: [],
      journal: [],
    })
  })

  it('records photo captures once per stop', () => {
    recordPhotoCapture('colosseum')
    recordPhotoCapture('colosseum')
    recordPhotoCapture('pantheon')

    const recap = readJourneyRecap()
    expect(recap.photos).toHaveLength(2)
    expect(hasPhotoCapture('colosseum', recap)).toBe(true)
    expect(hasPhotoCapture('pantheon', recap)).toBe(true)
  })

  it('records audio listened once per stop', () => {
    recordAudioListened('colosseum')
    recordAudioListened('colosseum')

    const recap = readJourneyRecap()
    expect(recap.audioListened).toHaveLength(1)
    expect(hasAudioListened('colosseum', recap)).toBe(true)
  })

  it('records journal reflections once per stop', () => {
    recordJournalReflection('colosseum', 'Stone remembers.')
    recordJournalReflection('colosseum', 'Another line.')

    const recap = readJourneyRecap()
    expect(recap.journal).toHaveLength(1)
    expect(recap.journal[0].text).toBe('Stone remembers.')
    expect(hasJournalReflection('colosseum', recap)).toBe(true)
  })

  it('exposes the storage key', () => {
    expect(getJourneyRecapStorageKey()).toBe('chronowalk:journey-recap')
  })
})
