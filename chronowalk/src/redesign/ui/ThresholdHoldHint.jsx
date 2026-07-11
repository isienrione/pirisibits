/**
 * Persistent affordance for press-and-hold threshold reveal.
 * Stays visible whenever a reconstruction is available — not first-visit only.
 */
export default function ThresholdHoldHint({
  label = 'Hold to reveal',
  className = '',
  testId = 'threshold-hold-hint',
}) {
  return (
    <div
      className={`cw-threshold-hold-hint${className ? ` ${className}` : ''}`}
      data-testid={testId}
      aria-hidden="true"
    >
      <span className="cw-threshold-hold-hint__pulse" />
      <span className="cw-threshold-hold-hint__label">{label}</span>
    </div>
  )
}
