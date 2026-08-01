export const REVIEW_PROMPT_SEEN_KEY = 'cw_review_prompt_seen'
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
  } catch {
    /* private mode / quota */
  }
}
