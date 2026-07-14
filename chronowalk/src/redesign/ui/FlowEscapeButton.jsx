import { ChevronLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useV2Journey } from '../../hooks/useV2Journey.js'
import { hasAccess } from '../../lib/config.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import { T, F, ICON, TAP } from '../tokens.js'

function homePath() {
  return hasAccess() ? '/tour' : '/landing'
}

export default function FlowEscapeButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state: journeyState, transition } = useV2Journey()

  // Threshold is a one-way crossing — the global back control sent travellers to
  // Arrived and trapped them in a story → threshold loop.
  if (location.pathname === '/journey' && journeyState === JOURNEY_STATES.THRESHOLD) {
    return null
  }

  const handleBack = () => {
    const { pathname } = location

    if (pathname === '/journey') {
      if (journeyState === JOURNEY_STATES.STORY) {
        transition(JOURNEY_STATES.WALKING)
        return
      }
      if (journeyState === JOURNEY_STATES.ARRIVED) {
        transition(JOURNEY_STATES.WALKING)
        return
      }
      if (
        journeyState === JOURNEY_STATES.PAUSED ||
        journeyState === JOURNEY_STATES.DAY_COMPLETE
      ) {
        transition(JOURNEY_STATES.WALKING)
        return
      }
      navigate(homePath(), { replace: true })
      return
    }

    if (pathname === '/begin') {
      navigate(homePath(), { replace: true })
      return
    }

    if (pathname === '/setup' || pathname === '/access/confirmed' || pathname === '/preview') {
      navigate('/landing', { replace: true })
      return
    }

    if (pathname === '/no-ticket') {
      navigate('/journey', { replace: true })
      return
    }

    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(homePath(), { replace: true })
  }

  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={handleBack}
      className="cw-flow-escape"
      style={{
        position: 'fixed',
        top: 'max(6px, env(safe-area-inset-top))',
        left: 'max(6px, env(safe-area-inset-left))',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minHeight: TAP.min,
        padding: '6px 12px 6px 8px',
        borderRadius: 999,
        border: `1px solid ${T.muted}22`,
        background: 'rgba(11,11,13,0.35)',
        color: `${T.muted}CC`,
        fontFamily: F.body,
        fontSize: 12,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: 0.42,
        transition: 'opacity var(--d-feedback, 220ms) var(--ease-pressure), background var(--d-feedback, 220ms) var(--ease-pressure)',
      }}
    >
      <ChevronLeft size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden />
      <span>Back</span>
    </button>
  )
}
