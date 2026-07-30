import { formatStepDistance } from '../../components/DirectionsStepList.jsx'

/**
 * Turn-by-turn steps for the walking companion (redesign dark theme).
 * `variant="timeline"` - compact "Next turns" list under the map (mock layout).
 * `variant="full"` - detailed steps tab.
 */
export default function WalkingCompanionStepsPanel({
  steps = [],
  currentStepIndex = 0,
  loading = false,
  error = null,
  destinationTitle = 'Destination',
  onRetry,
  externalMapsUrl = null,
  onOpenExternalMaps,
  variant = 'full',
  maxVisible = null,
}) {
  if (loading) {
    return (
      <div className="cw-walking-directions" data-testid="walking-directions-steps">
        <p className="cw-walking-directions__status">Finding your route…</p>
      </div>
    )
  }

  if (error) {
    const openMaps = () => {
      if (!externalMapsUrl) return
      if (onOpenExternalMaps) onOpenExternalMaps(externalMapsUrl)
      else window.open(externalMapsUrl, '_blank', 'noopener,noreferrer')
    }
    const isInfo = !onRetry && !externalMapsUrl

    return (
      <div className="cw-walking-directions" data-testid="walking-directions-steps">
        <p
          className={`cw-walking-directions__status${isInfo ? '' : ' cw-walking-directions__status--error'}`}
        >
          {error}
        </p>
        {onRetry || externalMapsUrl ? (
          <div className="cw-walking-directions__actions">
            {onRetry ? (
              <button
                type="button"
                className="cw-walking-directions__retry cw-wc-pressable"
                onClick={onRetry}
              >
                Try again
              </button>
            ) : null}
            {externalMapsUrl ? (
              <button
                type="button"
                className="cw-walking-directions__maps cw-wc-pressable"
                onClick={openMaps}
              >
                Open in Google Maps
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  if (!steps.length) {
    return (
      <div className="cw-walking-directions" data-testid="walking-directions-steps">
        <p className="cw-walking-directions__status">Directions will appear once GPS is ready.</p>
      </div>
    )
  }

  if (variant === 'timeline') {
    const start = Math.max(0, currentStepIndex)
    const visible = typeof maxVisible === 'number' ? steps.slice(start, start + maxVisible) : steps.slice(start)

    return (
      <div
        className="cw-walking-directions cw-walking-directions--timeline"
        data-testid="walking-directions-steps"
      >
        <div className="cw-walking-directions__timeline-head">
          <p className="cw-walking-directions__eyebrow">Next turns</p>
        </div>
        <ol className="cw-walking-directions__timeline" aria-label={`Next turns to ${destinationTitle}`}>
          {visible.map((step, offset) => {
            const index = start + offset
            const isCurrent = index === currentStepIndex
            return (
              <li
                key={`${step.instruction}-${index}`}
                className={`cw-walking-directions__timeline-item${isCurrent ? ' cw-walking-directions__timeline-item--current' : ''}`}
              >
                <span className="cw-walking-directions__timeline-dot" aria-hidden />
                <div className="cw-walking-directions__timeline-body">
                  <p className="cw-walking-directions__timeline-text">{step.instruction}</p>
                  {step.distanceM > 0 ? (
                    <p className="cw-walking-directions__timeline-distance">
                      {formatStepDistance(step.distanceM)}
                    </p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  const currentStep = steps[currentStepIndex] ?? steps[0]
  const nextStep = steps[currentStepIndex + 1] ?? null
  const stepLabel = `Step ${Math.min(currentStepIndex + 1, steps.length)} of ${steps.length}`

  return (
    <div className="cw-walking-directions" data-testid="walking-directions-steps">
      <p className="cw-walking-directions__eyebrow">{stepLabel}</p>

      <p className="cw-walking-directions__current">{currentStep.instruction}</p>
      {currentStep.distanceM > 0 ? (
        <p className="cw-walking-directions__distance">{formatStepDistance(currentStep.distanceM)}</p>
      ) : null}

      {nextStep ? (
        <div className="cw-walking-directions__next">
          <p className="cw-walking-directions__next-label">Then</p>
          <p className="cw-walking-directions__next-text">{nextStep.instruction}</p>
          {nextStep.distanceM > 0 ? (
            <p className="cw-walking-directions__next-distance">{formatStepDistance(nextStep.distanceM)}</p>
          ) : null}
        </div>
      ) : null}

      <ol className="cw-walking-directions__list" aria-label={`Steps to ${destinationTitle}`}>
        {steps.map((step, index) => {
          const isCurrent = index === currentStepIndex
          const isPast = index < currentStepIndex
          return (
            <li
              key={`${step.instruction}-${index}`}
              className={`cw-walking-directions__step${isCurrent ? ' cw-walking-directions__step--current' : ''}${isPast ? ' cw-walking-directions__step--past' : ''}`}
            >
              <span className="cw-walking-directions__step-num" aria-hidden>
                {index + 1}
              </span>
              <div className="cw-walking-directions__step-body">
                <p className="cw-walking-directions__step-text">{step.instruction}</p>
                {step.distanceM > 0 ? (
                  <p className="cw-walking-directions__step-distance">{formatStepDistance(step.distanceM)}</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
