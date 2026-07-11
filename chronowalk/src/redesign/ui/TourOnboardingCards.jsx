import { useCallback, useEffect, useState } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { T, F } from '../tokens.js'
import {
  ONBOARDING_CARD_PHASES,
  cardCopyForPhase,
  markTourOnboardingComplete,
  resolveTourOnboardingCardPhase,
} from '../../utils/tourOnboarding.js'

function renderBody(text) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} style={{ color: T.warmWhite, fontWeight: 600 }}>
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

/**
 * Floating instruction cards for first-tour / first-stop onboarding.
 */
export default function TourOnboardingCards({
  state,
  stepType,
  stopTitle = 'your first stop',
  near = false,
  insideGeofence = false,
  hasReconstruction = false,
  bottomInset = 0,
}) {
  const [dismissedPhases, setDismissedPhases] = useState(() => new Set())

  const activePhase = resolveTourOnboardingCardPhase({
    state,
    stepType,
    near,
    insideGeofence,
    hasReconstruction,
    dismissedPhases,
  })

  useEffect(() => {
    if (!activePhase) return
    const activeIndex = ONBOARDING_CARD_PHASES.indexOf(activePhase)
    if (activeIndex <= 0) return

    setDismissedPhases((prev) => {
      let changed = false
      const next = new Set(prev)
      for (let i = 0; i < activeIndex; i += 1) {
        const phase = ONBOARDING_CARD_PHASES[i]
        if (!next.has(phase)) {
          next.add(phase)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [activePhase])

  const visiblePhase =
    activePhase && !dismissedPhases.has(activePhase) ? activePhase : null

  const copy = visiblePhase ? cardCopyForPhase(visiblePhase, stopTitle) : null
  const stepNumber = visiblePhase ? ONBOARDING_CARD_PHASES.indexOf(visiblePhase) + 1 : 0
  const totalSteps = ONBOARDING_CARD_PHASES.length

  const dismissCurrent = useCallback(() => {
    if (!visiblePhase) return
    setDismissedPhases((prev) => {
      const next = new Set(prev)
      next.add(visiblePhase)
      return next
    })
  }, [visiblePhase])

  const finishOnboarding = useCallback(() => {
    markTourOnboardingComplete()
  }, [])

  useEffect(() => {
    if (dismissedPhases.size >= ONBOARDING_CARD_PHASES.length) {
      finishOnboarding()
    }
  }, [dismissedPhases.size, finishOnboarding])

  useEffect(() => {
    if (visiblePhase === 'reveal' && dismissedPhases.has('reveal')) {
      finishOnboarding()
    }
  }, [dismissedPhases, finishOnboarding, visiblePhase])

  if (!copy || !visiblePhase) return null

  const isLast = visiblePhase === 'reveal' || (visiblePhase === 'continue' && !hasReconstruction)

  return (
    <div
      className="cw-tour-onboarding-cards"
      data-testid="tour-onboarding-cards"
      data-phase={visiblePhase}
      style={{ bottom: `calc(${bottomInset}px + max(16px, env(safe-area-inset-bottom)))` }}
      role="dialog"
      aria-labelledby="tour-onboarding-card-title"
      aria-describedby="tour-onboarding-card-body"
    >
      <div className="cw-tour-onboarding-cards__card">
        <button
          type="button"
          className="cw-tour-onboarding-cards__close"
          aria-label="Dismiss tip"
          onClick={() => {
            dismissCurrent()
            if (isLast) finishOnboarding()
          }}
        >
          <X size={16} strokeWidth={2.25} />
        </button>

        <p className="cw-tour-onboarding-cards__eyebrow" style={{ fontFamily: F.body }}>
          {copy.eyebrow}
          <span className="cw-tour-onboarding-cards__progress">
            {stepNumber}/{totalSteps}
          </span>
        </p>

        <h2
          id="tour-onboarding-card-title"
          className="cw-tour-onboarding-cards__title"
          style={{ fontFamily: F.display }}
        >
          {copy.title}
        </h2>

        <p id="tour-onboarding-card-body" className="cw-tour-onboarding-cards__body" style={{ fontFamily: F.body }}>
          {renderBody(copy.body)}
        </p>

        <button
          type="button"
          className="cw-tour-onboarding-cards__action"
          style={{ fontFamily: F.body, background: T.ember, color: T.obsidian }}
          onClick={() => {
            dismissCurrent()
            if (isLast) finishOnboarding()
          }}
        >
          {isLast ? 'Got it' : 'Next'}
          {!isLast ? <ChevronRight size={16} strokeWidth={2.5} aria-hidden /> : null}
        </button>
      </div>
    </div>
  )
}
