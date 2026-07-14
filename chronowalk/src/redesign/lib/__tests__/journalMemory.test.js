import { describe, expect, it } from 'vitest'
import {
  actMilestoneCaption,
  memoryDiscoveries,
  memoryQuote,
  memoryStatusCaption,
  memoryWalkFootnote,
  tidyMemoryLine,
} from '../journalMemory.js'

describe('journalMemory', () => {
  it('tidies arrival lines into a single spoken sentence', () => {
    expect(tidyMemoryLine('Take a second. / Look up.')).toBe('Take a second. Look up.')
  })

  it('prefers authored signature, then arrival, for quotes', () => {
    expect(memoryQuote({ sigLine: 'Authored.' })).toBe('Authored.')
    expect(memoryQuote({ arrivalLine: 'Take a second. / Look up.' })).toBe('Take a second. Look up.')
  })

  it('pulls a calm transcript sentence when arrival is missing', () => {
    const quote = memoryQuote({
      chapters: [
        {
          transcript:
            '[QUIET] The ground here used to be underwater. Not a river. Not a flood from the hills.',
        },
      ],
    })
    expect(quote).toMatch(/ground here used to be underwater/i)
    expect(quote).not.toMatch(/\[/)
  })

  it('builds discoveries from reconstruction caption and transcript', () => {
    const discoveries = memoryDiscoveries({
      reconstruction: { caption: 'Evidence-based reconstruction · awning colours are informed conjecture' },
      chapters: [
        {
          transcript:
            '[PAUSE] Fifty thousand people could fill these seats on a feast day. The sound was said to shake the stones.',
        },
      ],
    })
    expect(discoveries[0]).toMatch(/Evidence-based reconstruction/)
    expect(discoveries.length).toBeGreaterThan(1)
  })

  it('uses memory-book status language', () => {
    expect(memoryStatusCaption('completed')).toBe('Remembered')
    expect(memoryStatusCaption('current')).toBe('Open on the page')
    expect(memoryStatusCaption('upcoming')).toBe('Still unwritten')
  })

  it('formats a quiet walking footnote', () => {
    expect(
      memoryWalkFootnote({
        completed: 3,
        total: 18,
        walkedMeters: 2400,
      })
    ).toBe('3 places kept of 18 · 2.4 km walked')
  })

  it('marks completed act milestones', () => {
    expect(
      actMilestoneCaption([
        { status: 'completed' },
        { status: 'completed' },
      ])
    ).toBe('This chapter is complete')
    expect(
      actMilestoneCaption([{ status: 'completed' }, { status: 'upcoming' }])
    ).toBe('1 remembered here')
  })
})
