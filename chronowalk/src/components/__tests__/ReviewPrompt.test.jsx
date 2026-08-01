import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ReviewPrompt from '../ReviewPrompt.jsx'
import {
  REVIEW_PROMPT_DELAY_MS,
  REVIEW_PROMPT_DUE_AT_KEY,
  REVIEW_PROMPT_SEEN_KEY,
  TRUSTPILOT_REVIEW_URL,
  armReviewPromptIfNeeded,
} from '../../lib/reviewPromptStorage.js'
import { TRACK_EVENTS } from '../../lib/track.js'

vi.mock('../../lib/track.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    track: vi.fn(),
  }
})

import { track } from '../../lib/track.js'

describe('ReviewPrompt', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    track.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render until the delay after activation', () => {
    render(<ReviewPrompt active />)
    expect(screen.queryByTestId('review-prompt')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(REVIEW_PROMPT_DELAY_MS - 1)
    })
    expect(screen.queryByTestId('review-prompt')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByTestId('review-prompt')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'How was the walk?' })).toBeInTheDocument()
  })

  it('honors the remaining delay after remount (complete → letter)', () => {
    armReviewPromptIfNeeded()
    const { unmount } = render(<ReviewPrompt active />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(screen.queryByTestId('review-prompt')).not.toBeInTheDocument()
    unmount()

    render(<ReviewPrompt active />)
    act(() => {
      vi.advanceTimersByTime(1499)
    })
    expect(screen.queryByTestId('review-prompt')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByTestId('review-prompt')).toBeInTheDocument()
    expect(localStorage.getItem(REVIEW_PROMPT_DUE_AT_KEY)).toBeTruthy()
  })

  it('never shows when the seen flag is already set', () => {
    localStorage.setItem(REVIEW_PROMPT_SEEN_KEY, '1')
    render(<ReviewPrompt active />)
    act(() => {
      vi.advanceTimersByTime(REVIEW_PROMPT_DELAY_MS)
    })
    expect(screen.queryByTestId('review-prompt')).not.toBeInTheDocument()
  })

  it('links to Trustpilot and marks the prompt seen on review', () => {
    render(<ReviewPrompt active />)
    act(() => {
      vi.advanceTimersByTime(REVIEW_PROMPT_DELAY_MS)
    })

    const link = screen.getByTestId('review-prompt-leave')
    expect(link).toHaveAttribute('href', TRUSTPILOT_REVIEW_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')

    fireEvent.click(link)
    expect(localStorage.getItem(REVIEW_PROMPT_SEEN_KEY)).toBe('1')
    expect(track).toHaveBeenCalledWith(
      TRACK_EVENTS.REVIEW_CLICK,
      expect.objectContaining({ source: 'journey_complete', provider: 'trustpilot' }),
    )
    expect(screen.queryByTestId('review-prompt')).not.toBeInTheDocument()
  })

  it('marks the prompt seen when dismissed and does not show again', () => {
    const { rerender } = render(<ReviewPrompt active />)
    act(() => {
      vi.advanceTimersByTime(REVIEW_PROMPT_DELAY_MS)
    })

    fireEvent.click(screen.getByTestId('review-prompt-dismiss'))
    expect(localStorage.getItem(REVIEW_PROMPT_SEEN_KEY)).toBe('1')
    expect(screen.queryByTestId('review-prompt')).not.toBeInTheDocument()

    rerender(<ReviewPrompt active={false} />)
    rerender(<ReviewPrompt active />)
    act(() => {
      vi.advanceTimersByTime(REVIEW_PROMPT_DELAY_MS)
    })
    expect(screen.queryByTestId('review-prompt')).not.toBeInTheDocument()
  })
})
