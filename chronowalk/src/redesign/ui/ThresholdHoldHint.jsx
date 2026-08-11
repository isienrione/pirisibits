import { Pointer } from 'lucide-react'
import { useT } from '../../i18n/I18nProvider.jsx'

/**
 * Persistent affordance for press-and-hold threshold reveal.
 * Stays visible whenever a reconstruction is available - not first-visit only.
 */
function PressHoldIcon() {
  return (
    <span className="cw-threshold-hold-hint__icon-wrap" aria-hidden="true">
      <Pointer size={18} strokeWidth={2.25} className="cw-threshold-hold-hint__icon" />
    </span>
  )
}

export default function ThresholdHoldHint({
  label = null,
  className = '',
  testId = 'threshold-hold-hint',
}) {
  const t = useT()

  return (
    <div
      className={`cw-threshold-hold-hint${className ? ` ${className}` : ''}`}
      data-testid={testId}
      aria-hidden="true"
    >
      <PressHoldIcon />
      <span className="cw-threshold-hold-hint__label">
        {label ?? t('threshold.pressHold')}
      </span>
    </div>
  )
}
