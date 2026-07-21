import { F, T } from '../tokens.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/**
 * Format then-label for the single diegetic instruction line.
 * "ANCIENT ROME" → "Ancient Rome"
 */
export function formatThenHintLabel(thenLabel = 'ANCIENT ROME') {
  const raw = String(thenLabel ?? 'Ancient Rome').trim()
  if (!raw) return 'Ancient Rome'
  return raw
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/** Gold-leaf finger pressing the touch target — first-instruction affordance only. */
function HoldFingerGlyph() {
  return (
    <svg
      className="cw-diegetic-hint__finger-svg"
      viewBox="0 0 40 56"
      width="36"
      height="50"
      aria-hidden="true"
      focusable="false"
    >
      {/* Soft contact glow under the fingertip */}
      <ellipse className="cw-diegetic-hint__finger-glow" cx="20" cy="48" rx="10" ry="4.5" />
      {/* Simple index-finger press silhouette */}
      <path
        className="cw-diegetic-hint__finger-path"
        d="M17.2 2.8c-2.4 0-4.3 1.9-4.3 4.3v24.6c-2.3-.2-4.2 1.5-4.4 3.8-.3 2.6 1.7 4.8 4.3 4.8h1.1v5.4c0 4.1 3.1 7.5 7.2 7.8 4.5.3 8.3-3.2 8.3-7.7V28.6c0-1.7-1.4-3.1-3.1-3.1-1 0-1.9.5-2.5 1.2V7.1c0-2.4-1.9-4.3-4.3-4.3h-2.3z"
      />
    </svg>
  )
}

/**
 * Minimal on-image threshold hint — pulsing gold touch-ring + optional one-line copy.
 * First instruction also shows a pressing-finger glyph so the hold is obvious.
 * pointer-events: none so holds pass through to the Threshold surface beneath.
 */
export default function ThresholdDiegeticHint({
  thenLabel = 'ANCIENT ROME',
  showText = true,
  fading = false,
  className = '',
  testId = 'threshold-diegetic-hint',
}) {
  const reducedMotion = useReducedMotion()
  const era = formatThenHintLabel(thenLabel)

  return (
    <div
      className={[
        'cw-diegetic-hint',
        showText ? 'cw-diegetic-hint--with-text' : 'cw-diegetic-hint--ring-only',
        fading ? 'cw-diegetic-hint--fading' : '',
        reducedMotion ? 'cw-diegetic-hint--reduced' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid={testId}
      role={showText ? 'status' : undefined}
      aria-live={showText ? 'polite' : undefined}
      aria-hidden={showText ? undefined : true}
    >
      <div className="cw-diegetic-hint__ring" aria-hidden>
        <span className="cw-diegetic-hint__ring-outer" />
        <span className="cw-diegetic-hint__ring-mid" />
        <span className="cw-diegetic-hint__ring-core" />
        {showText ? (
          <span className="cw-diegetic-hint__finger" data-testid="threshold-diegetic-finger">
            <HoldFingerGlyph />
          </span>
        ) : null}
      </div>
      {showText ? (
        <p className="cw-diegetic-hint__line" style={{ fontFamily: F.body, color: T.warmWhite }}>
          Hold to reveal {era}
        </p>
      ) : null}
    </div>
  )
}
