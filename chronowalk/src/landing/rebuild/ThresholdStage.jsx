import { useId } from 'react'
import LandingColosseumThreshold from '../LandingColosseumThreshold.jsx'
import { useThresholdReveal } from './useThresholdReveal.js'

/**
 * Shared interactive Threshold stage.
 * @param {{
 *   hint?: string,
 *   showTap?: boolean,
 *   tapLabel?: string,
 *   hideLabel?: string,
 *   track?: boolean,
 *   className?: string,
 *   showProgress?: boolean,
 * }} props
 */
export default function ThresholdStage({
  hint = 'Press and hold to reveal',
  showTap = true,
  tapLabel = 'Or tap to reveal',
  hideLabel = 'Hide reconstruction',
  track = true,
  className = '',
  showProgress = true,
}) {
  const statusId = useId()
  const {
    reveal,
    revealed,
    fallbackLatched,
    statusText,
    beginHold,
    endHold,
    toggleFallback,
    onKeyDown,
    onKeyUp,
  } = useThresholdReveal({ track })

  return (
    <div className={`cw-rb-thstage ${className}`.trim()}>
      <div
        className="cw-rb-thstage__frame"
        tabIndex={0}
        role="application"
        aria-label={`${hint}. ${tapLabel} is also available.`}
        aria-describedby={statusId}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={endHold}
      >
        <LandingColosseumThreshold
          reveal={reveal}
          interactive
          showProgress={showProgress}
          hint={hint}
          onPointerDown={beginHold}
          onPointerUp={endHold}
          onPointerCancel={endHold}
          onPointerLeave={() => {
            if (reveal < 0.98) endHold()
          }}
        />
      </div>
      <p id={statusId} className="cw-rb-sr-only" aria-live="polite">
        {statusText}
      </p>
      {showTap ? (
        <button
          type="button"
          className="cw-rb-btn cw-rb-btn--ghost cw-rb-thstage__tap"
          onClick={toggleFallback}
          aria-pressed={revealed || fallbackLatched}
        >
          {revealed || fallbackLatched ? hideLabel : tapLabel}
        </button>
      ) : null}
    </div>
  )
}
