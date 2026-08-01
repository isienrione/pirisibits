import { useCallback, useEffect, useId, useState } from 'react'
import { track, TRACK_EVENTS } from '../lib/track.js'
import {
  TRUSTPILOT_REVIEW_URL,
  armReviewPromptIfNeeded,
  getReviewPromptRemainingMs,
  hasSeenReviewPrompt,
  markReviewPromptSeen,
} from '../lib/reviewPromptStorage.js'
import './ReviewPrompt.css'

/**
 * One-time Trustpilot ask after journey completion.
 * Arming happens when the journey enters COMPLETE (due time persisted), so the
 * 4s delay survives navigation to the letter screen.
 */
export default function ReviewPrompt({ active = false }) {
  const titleId = useId()
  const bodyId = useId()
  const [visible, setVisible] = useState(false)

  const dismiss = useCallback(() => {
    markReviewPromptSeen()
    setVisible(false)
  }, [])

  useEffect(() => {
    if (!active || hasSeenReviewPrompt()) return undefined

    armReviewPromptIfNeeded()
    const remaining = getReviewPromptRemainingMs()
    if (remaining == null) return undefined

    const timer = window.setTimeout(() => {
      if (!hasSeenReviewPrompt()) setVisible(true)
    }, remaining)

    return () => window.clearTimeout(timer)
  }, [active])

  useEffect(() => {
    if (!visible) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visible, dismiss])

  const handleReviewClick = () => {
    markReviewPromptSeen()
    track(TRACK_EVENTS.REVIEW_CLICK, {
      source: 'journey_complete',
      provider: 'trustpilot',
    })
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cw-review-prompt" data-testid="review-prompt">
      <button
        type="button"
        className="cw-review-prompt__backdrop"
        aria-label="Dismiss review prompt"
        onClick={dismiss}
      />
      <aside
        className="cw-review-prompt__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
      >
        <div className="cw-review-prompt__handle" aria-hidden="true" />
        <div className="cw-review-prompt__gold" aria-hidden="true" />
        <h2 id={titleId} className="cw-review-prompt__title">
          How was the walk?
        </h2>
        <p id={bodyId} className="cw-review-prompt__body">
          I&apos;m a solo founder and honest reviews are how a new product earns trust. Two minutes,
          and it helps more than you&apos;d think.
        </p>
        <div className="cw-review-prompt__actions">
          <a
            className="cw-review-prompt__btn cw-review-prompt__btn--primary"
            href={TRUSTPILOT_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="review-prompt-leave"
            onClick={handleReviewClick}
          >
            Leave a review
          </a>
          <button
            type="button"
            className="cw-review-prompt__btn cw-review-prompt__btn--secondary"
            data-testid="review-prompt-dismiss"
            onClick={dismiss}
          >
            Not now
          </button>
        </div>
      </aside>
    </div>
  )
}
