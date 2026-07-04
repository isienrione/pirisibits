import { describe, expect, it, beforeEach } from 'vitest'
import {
  attachParagraphProgress,
  resolveCurrentParagraphIndex,
  splitTranscriptParagraphs,
} from '../transcriptContent'
import {
  readTranscriptBookmarks,
  toggleTranscriptBookmark,
} from '../transcriptBookmarks'

describe('transcriptContent', () => {
  it('splits transcript text into paragraphs', () => {
    const paragraphs = splitTranscriptParagraphs('First paragraph.\n\nSecond paragraph.')
    expect(paragraphs).toEqual(['First paragraph.', 'Second paragraph.'])
  })

  it('attaches progress anchors for spoken highlighting', () => {
    const paragraphs = attachParagraphProgress(['One', 'Two', 'Three'])
    expect(paragraphs[1].startProgress).toBeCloseTo(1 / 3)
    expect(resolveCurrentParagraphIndex(paragraphs, 0.4)).toBe(1)
  })
})

describe('transcriptBookmarks', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('persists bookmarks per stop', () => {
    toggleTranscriptBookmark('colosseum', 'paragraph-1')
    toggleTranscriptBookmark('colosseum', 'paragraph-3')

    expect(readTranscriptBookmarks('colosseum')).toEqual(['paragraph-1', 'paragraph-3'])
    expect(toggleTranscriptBookmark('colosseum', 'paragraph-1')).toEqual(['paragraph-3'])
  })
})
