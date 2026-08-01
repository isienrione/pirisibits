export const REVIEW_PROMPT_SEEN_KEY = 'cw_review_prompt_seen'
export const REVIEW_PROMPT_DUE_AT_KEY = 'cw_review_prompt_due_at'
export const REVIEW_PROMPT_DELAY_MS = 4000
export const TRUSTPILOT_REVIEW_URL = 'https://www.trustpilot.com/evaluate/chronowalk.com'

export function hasSeenReviewPrompt() {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(REVIEW_PROMPT_SEEN_KEY) === '1'
  } catch {
    return true
  }
}

export function markReviewPromptSeen() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(REVIEW_PROMPT_SEEN_KEY, '1')
    window.localStorage.removeItem(REVIEW_PROMPT_DUE_AT_KEY)
  } catch {
    /* private mode / quota */
  }
}

/** Milliseconds until the prompt may appear, or null if not armed / already seen. */
export function getReviewPromptRemainingMs(now = Date.now()) {
  if (hasSeenReviewPrompt()) return null
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(REVIEW_PROMPT_DUE_AT_KEY)
    if (!raw) return null
    const dueAt = Number(raw)
    if (!Number.isFinite(dueAt)) return null
    return Math.max(0, dueAt - now)
  } catch {
    return null
  }
}

/**
 * Arm the one-time ask when the journey becomes complete.
 * Idempotent: keeps the original due time so navigation (complete → letter)
 * does not restart the 4s delay.
 */
export function armReviewPromptIfNeeded(now = Date.now()) {
  if (hasSeenReviewPrompt()) return false
  if (typeof window === 'undefined') return false
  try {
    if (window.localStorage.getItem(REVIEW_PROMPT_DUE_AT_KEY)) return false
    window.localStorage.setItem(REVIEW_PROMPT_DUE_AT_KEY, String(now + REVIEW_PROMPT_DELAY_MS))
    return true
  } catch {
    return false
  }
}
