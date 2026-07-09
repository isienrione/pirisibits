import { describe, expect, it } from 'vitest'
import { chapterAtIndex, chapterAudioFile, chapterTitle, resolveStepTranscript } from './chapterMeta.js'

describe('chapterMeta', () => {
  it('reads string chapters', () => {
    expect(chapterAudioFile('w06.mp3')).toBe('w06.mp3')
    expect(chapterTitle('w06.mp3', 'Fallback')).toBe('Fallback')
  })

  it('reads object chapters', () => {
    const chapter = { file: 'w06.mp3', title: 'Basilica of Maxentius' }
    expect(chapterAudioFile(chapter)).toBe('w06.mp3')
    expect(chapterTitle(chapter, 'Fallback')).toBe('Basilica of Maxentius')
    expect(chapterAtIndex([chapter], 0, 'Fallback')).toEqual({
      file: 'w06.mp3',
      title: 'Basilica of Maxentius',
    })
  })

  it('resolves waypoint and transit transcripts for read-along', () => {
    expect(
      resolveStepTranscript({
        type: 'waypoint',
        record: { transcript: 'Exterior script', chapters: [{ transcript: 'chapter' }] },
      })
    ).toBe('Exterior script')

    expect(
      resolveStepTranscript({
        type: 'transit',
        record: {
          variant_meta: { a: { transcript: 'Forum path' }, b: { transcript: 'Palatine path' } },
        },
      }, 'b')
    ).toBe('Palatine path')
  })
})
