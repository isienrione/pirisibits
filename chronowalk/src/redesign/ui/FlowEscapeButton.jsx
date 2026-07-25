import { ChevronLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useV2Journey } from '../../hooks/useV2Journey.js'
import { hasAccess } from '../../lib/config.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import { T, F } from '../tokens.js'

function homePath() {
  return hasAccess() ? '/tour' : '/landing'
}

function isPublicMarketingPath(pathname) {
  if (pathname === '/landing') return true
  if (pathname === '/contact' || pathname === '/credits' || pathname === '/access' || pathname === '/invite') {
    return true
  }
  if (pathname.startsWith('/legal/')) return true
  return false
}

export default function FlowEscapeButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state: journeyState, transition } = useV2Journey()

  // Marketing pages have their own chrome — never overlay a Back control on the logo.
  if (isPublicMarketingPath(location.pathname)) {
    return null
  }

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

    if (pathname === '/setup' || pathname === '/access/confirmed') {
      navigate(hasAccess() ? '/begin' : '/landing', { replace: true })
      return
    }

    if (pathname === '/preview') {
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
        padding: '6px 10px 6px 6px',
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
        transition: 'opacity 180ms ease, background 180ms ease',
      }}
    >
      <ChevronLeft size={16} strokeWidth={2} aria-hidden />
      <span>Back</span>
    </button>
  )
}
