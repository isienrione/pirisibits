import { describe, expect, it, beforeEach } from 'vitest'
import {
  attachParagraphProgress,
  parseTranscriptForKaraoke,
  resolveActiveWordIndex,
  resolveCurrentParagraphIndex,
  splitTranscriptParagraphs,
  stripDirectorCues,
} from '../transcriptContent'
import {
  readTranscriptBookmarks,
  toggleTranscriptBookmark,
} from '../transcriptBookmarks'

describe('transcriptContent', () => {
  it('strips ElevenLabs director cues from readable copy', () => {
    const raw = '[warm] Hello [pause] world.\n\n[PRE-NARRATION PAUSE — 8 seconds]\n\n[slow] Keep going.'
    expect(stripDirectorCues(raw)).toBe('Hello world.\n\nKeep going.')
  })

  it('splits transcript text into paragraphs', () => {
    const paragraphs = splitTranscriptParagraphs('First paragraph.\n\nSecond paragraph.')
    expect(paragraphs).toEqual(['First paragraph.', 'Second paragraph.'])
  })

  it('attaches progress anchors for spoken highlighting', () => {
    const paragraphs = attachParagraphProgress(['One', 'Two', 'Three'])
    expect(paragraphs[1].startProgress).toBeCloseTo(1 / 3)
    expect(resolveCurrentParagraphIndex(paragraphs, 0.4)).toBe(1)
  })

  it('tokenizes karaoke words and resolves active index from playback', () => {
    const { paragraphs, wordCount } = parseTranscriptForKaraoke('[warm] One two.\n\nThree four.')
    expect(wordCount).toBe(4)
    expect(paragraphs).toHaveLength(2)
    expect(resolveActiveWordIndex(wordCount, 0, 10)).toBe(0)
    expect(resolveActiveWordIndex(wordCount, 2.5, 10)).toBe(1)
    expect(resolveActiveWordIndex(wordCount, 9.9, 10)).toBe(3)
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
