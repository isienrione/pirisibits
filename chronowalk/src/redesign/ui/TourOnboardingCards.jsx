import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { T, F } from '../tokens.js'
import {
  ONBOARDING_CARD_PHASES,
  cardCopyForPhase,
  hasCompletedTourOnboarding,
  markTourOnboardingComplete,
  resolveTourOnboardingCardPhase,
} from '../../utils/tourOnboarding.js'

function renderBody(text) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} style={{ color: T.ink, fontWeight: 650 }}>
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

/**
 * Floating first-tour tip cards.
 * Light “paper” surface so they read as temporary coaching over the dark walk UI.
 */
export default function TourOnboardingCards({
  state,
  stepType,
  stopTitle = 'your first stop',
  near = false,
  insideGeofence = false,
  hasReconstruction = false,
  bottomInset = 0,
  onBlockingChange,
}) {
  const [dismissedPhases, setDismissedPhases] = useState(() => new Set())
  // Local flag so Close/finish hides the card immediately (localStorage alone
  // does not re-render). Also respects prior completion on remount.
  const [finished, setFinished] = useState(() => hasCompletedTourOnboarding())

  const activePhase = finished
    ? null
    : resolveTourOnboardingCardPhase({
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
  const blocking = Boolean(visiblePhase)

  // Layout effect so JourneyShell holds narration before its autoplay useEffect runs.
  useLayoutEffect(() => {
    onBlockingChange?.(blocking)
    return () => onBlockingChange?.(false)
  }, [blocking, onBlockingChange])

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
    setFinished(true)
    onBlockingChange?.(false)
  }, [onBlockingChange])

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

  if (finished || !copy || !visiblePhase) return null

  const isLast = visiblePhase === 'reveal' || (visiblePhase === 'continue' && !hasReconstruction)

  return (
    <div
      className="cw-tour-onboarding-cards"
      data-testid="tour-onboarding-cards"
      data-phase={visiblePhase}
      data-blocking={blocking ? 'true' : 'false'}
      style={{
        '--cw-onboarding-dock-lift': `${Math.max(16, bottomInset)}px`,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-onboarding-card-title"
      aria-describedby="tour-onboarding-card-body"
    >
      <div className="cw-tour-onboarding-cards__backdrop" aria-hidden="true" />
      <div className="cw-tour-onboarding-cards__card">
        <button
          type="button"
          className="cw-tour-onboarding-cards__close"
          aria-label="Close tutorial"
          onClick={() => {
            // Skip remaining tips and hide the card so travelers can continue.
            finishOnboarding()
          }}
        >
          <X size={15} strokeWidth={2.25} />
        </button>

        <p className="cw-tour-onboarding-cards__eyebrow" style={{ fontFamily: F.body }}>
          <span className="cw-tour-onboarding-cards__eyebrow-label">Quick tip</span>
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

        <p
          id="tour-onboarding-card-body"
          className="cw-tour-onboarding-cards__body"
          style={{ fontFamily: F.body }}
        >
          {renderBody(copy.body)}
        </p>

        <div className="cw-tour-onboarding-cards__dots" aria-hidden="true">
          {ONBOARDING_CARD_PHASES.map((phase, index) => (
            <span
              key={phase}
              className={
                index + 1 === stepNumber
                  ? 'cw-tour-onboarding-cards__dot is-active'
                  : index + 1 < stepNumber
                    ? 'cw-tour-onboarding-cards__dot is-done'
                    : 'cw-tour-onboarding-cards__dot'
              }
            />
          ))}
        </div>

        <button
          type="button"
          className="cw-tour-onboarding-cards__action"
          style={{ fontFamily: F.body, background: T.ember, color: T.obsidian }}
          onClick={() => {
            dismissCurrent()
            if (isLast) finishOnboarding()
          }}
        >
          {isLast ? 'Start listening' : 'Next'}
          {!isLast ? <ChevronRight size={16} strokeWidth={2.5} aria-hidden /> : null}
        </button>
      </div>
    </div>
  )
}
