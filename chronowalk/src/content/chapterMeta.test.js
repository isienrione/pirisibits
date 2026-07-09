import { describe, expect, it } from 'vitest'
import { chapterAtIndex, chapterAudioFile, chapterTitle } from './chapterMeta.js'

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
})
