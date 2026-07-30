import { Pointer } from 'lucide-react'

/**
 * Persistent affordance for press-and-hold threshold reveal.
 * Stays visible whenever a reconstruction is available · not first-visit only.
 */
function PressHoldIcon() {
  return (
    <span className="cw-threshold-hold-hint__icon-wrap" aria-hidden="true">
      <Pointer size={18} strokeWidth={2.25} className="cw-threshold-hold-hint__icon" />
    </span>
  )
}

export default function ThresholdHoldHint({
  label = 'Press & hold to reveal',
  className = '',
  testId = 'threshold-hold-hint',
}) {
  return (
    <div
      className={`cw-threshold-hold-hint${className ? ` ${className}` : ''}`}
      data-testid={testId}
      aria-hidden="true"
    >
      <PressHoldIcon />
      <span className="cw-threshold-hold-hint__label">{label}</span>
    </div>
  )
}
