import { HOLD_COPY } from '../../interaction/pressHoldSpec.js'
import { PressHoldOrb } from './PressHoldOrb.jsx'

/**
 * Persistent affordance for the signature Press & Hold.
 * Communicates unlocking history — never a UI button.
 */
export default function ThresholdHoldHint({
  label = HOLD_COPY.idle,
  className = '',
  testId = 'threshold-hold-hint',
  phase = 'idle',
  progress = 0,
}) {
  return (
    <div
      className={`cw-threshold-hold-hint${className ? ` ${className}` : ''}`}
      data-testid={testId}
      aria-hidden="true"
    >
      <PressHoldOrb
        phase={phase}
        progress={progress}
        label={label}
        compact
        className="cw-threshold-hold-hint__orb"
      />
    </div>
  )
}
