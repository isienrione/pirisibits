import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  REVIEW_PROMPT_DELAY_MS,
  REVIEW_PROMPT_DUE_AT_KEY,
  REVIEW_PROMPT_SEEN_KEY,
  armReviewPromptIfNeeded,
  getReviewPromptRemainingMs,
  hasSeenReviewPrompt,
  markReviewPromptSeen,
} from '../reviewPromptStorage.js'

describe('reviewPromptStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-01T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('arms a due time once and keeps it across later arm calls', () => {
    expect(armReviewPromptIfNeeded()).toBe(true)
    const due = Number(localStorage.getItem(REVIEW_PROMPT_DUE_AT_KEY))
    expect(due).toBe(Date.now() + REVIEW_PROMPT_DELAY_MS)

    vi.advanceTimersByTime(1500)
    expect(armReviewPromptIfNeeded()).toBe(false)
    expect(Number(localStorage.getItem(REVIEW_PROMPT_DUE_AT_KEY))).toBe(due)
    expect(getReviewPromptRemainingMs()).toBe(REVIEW_PROMPT_DELAY_MS - 1500)
  })

  it('does not arm after the prompt was seen', () => {
    localStorage.setItem(REVIEW_PROMPT_SEEN_KEY, '1')
    expect(armReviewPromptIfNeeded()).toBe(false)
    expect(hasSeenReviewPrompt()).toBe(true)
    expect(localStorage.getItem(REVIEW_PROMPT_DUE_AT_KEY)).toBeNull()
  })

  it('clears the due time when marked seen', () => {
    armReviewPromptIfNeeded()
    markReviewPromptSeen()
    expect(localStorage.getItem(REVIEW_PROMPT_SEEN_KEY)).toBe('1')
    expect(localStorage.getItem(REVIEW_PROMPT_DUE_AT_KEY)).toBeNull()
    expect(getReviewPromptRemainingMs()).toBeNull()
  })
})
