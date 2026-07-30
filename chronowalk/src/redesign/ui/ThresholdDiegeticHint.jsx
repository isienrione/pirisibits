import { Pointer } from 'lucide-react'
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

/**
 * Minimal on-image threshold hint · pulsing gold touch-ring + pointing hand.
 * The hand is always shown (including brief ring-only nudges) so this never
 * looks like the arrival “waypoint unlocked” beacon. Optional one-line copy
 * on the first teach. pointer-events: none so holds pass through to Threshold.
 */
export default function ThresholdDiegeticHint({
  thenLabel = 'ANCIENT ROME',
  showText = true,
  showHand = true,
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
        showHand ? 'cw-diegetic-hint--with-hand' : '',
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
        {showHand ? (
          <span className="cw-diegetic-hint__finger" data-testid="threshold-diegetic-finger">
            <span className="cw-diegetic-hint__finger-glow" />
            <Pointer
              className="cw-diegetic-hint__finger-icon"
              size={showText ? 34 : 28}
              strokeWidth={2.1}
              absoluteStrokeWidth
            />
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
