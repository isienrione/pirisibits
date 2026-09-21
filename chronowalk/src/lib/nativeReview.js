/**
 * In-app review (iOS) — only after existing reviewPromptStorage arming rules.
 * Never at launch.
 */
import { IS_IOS } from './platform.js'
import {
  hasSeenReviewPrompt,
  markReviewPromptSeen,
  getReviewPromptRemainingMs,
} from './reviewPromptStorage.js'

/**
 * Request the native StoreKit review dialog when the web prompt would fire.
 * Marks the prompt as seen so it stays one-shot.
 */
export async function requestNativeReviewIfDue() {
  if (!IS_IOS) return { ok: false, reason: 'not_ios' }
  if (hasSeenReviewPrompt()) return { ok: false, reason: 'already_seen' }

  const remaining = getReviewPromptRemainingMs()
  if (remaining == null) return { ok: false, reason: 'not_armed' }
  if (remaining > 0) return { ok: false, reason: 'too_soon', remaining }

  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review')
    await InAppReview.requestReview()
    markReviewPromptSeen()
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: err?.message ?? 'review_failed' }
  }
}
