import { formatStepDistance } from '../../components/DirectionsStepList.jsx'

/**
 * Turn-by-turn steps for the walking companion (redesign dark theme).
 */
export default function WalkingCompanionStepsPanel({
  steps = [],
  currentStepIndex = 0,
  loading = false,
  error = null,
  destinationTitle = 'Destination',
}) {
  if (loading) {
    return (
      <div className="cw-walking-directions" data-testid="walking-directions-steps">
        <p className="cw-walking-directions__status">Finding your route…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cw-walking-directions" data-testid="walking-directions-steps">
        <p className="cw-walking-directions__status cw-walking-directions__status--error">{error}</p>
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
