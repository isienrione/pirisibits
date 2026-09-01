import { ChevronLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useV2Journey } from '../../hooks/useV2Journey.js'
import { hasAccess } from '../../lib/config.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import { T } from '../tokens.js'

/** Primary shell tabs already have bottom nav + their own headers. */
const SHELL_TAB_ROOTS = new Set(['/home', '/tour', '/map', '/journal', '/settings', '/explore'])

/** Native-owned flows use NativePageHeader instead of the floating grey chip. */
const NATIVE_HEADER_PREFIXES = [
  '/welcome',
  '/context',
  '/plan',
  '/route',
  '/walk',
  '/arrive',
  '/mystery',
  '/next',
  '/experience',
  '/discovery',
]

function usesNativePageHeader(pathname) {
  return NATIVE_HEADER_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function homePath() {
  return hasAccess() ? '/home' : '/'
}

function canGoBackInHistory() {
  if (typeof window === 'undefined') return false
  // history.length is imperfect in SPAs, but still the best signal we have
  // without maintaining a custom stack. Treat length > 1 as "try previous".
  return window.history.length > 1
}

export default function FlowEscapeButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state: journeyState, transition } = useV2Journey()

  // Tab roots: the floating chip overlaps Tour/Map/Journal headers (brand + titles)
  // and "back" falling through to /tour feels like a no-op.
  if (SHELL_TAB_ROOTS.has(location.pathname) || usesNativePageHeader(location.pathname)) {
    return null
  }

  // Threshold / story / arrived screens already own a Back control - a second
  // fixed escape stacked on top looked like a doubled, cropped chevron.
  if (
    location.pathname === '/journey' &&
    (journeyState === JOURNEY_STATES.THRESHOLD ||
      journeyState === JOURNEY_STATES.STORY ||
      journeyState === JOURNEY_STATES.ARRIVED)
  ) {
    return null
  }

  const goToPreviousScreen = (fallback = homePath()) => {
    if (canGoBackInHistory()) {
      navigate(-1)
      return
    }
    if (fallback && fallback !== location.pathname) {
      navigate(fallback, { replace: true })
    }
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
      // Walking / default: leave to the real previous screen, not a forced Tour tab.
      goToPreviousScreen(homePath())
      return
    }

    if (pathname === '/begin') {
      goToPreviousScreen(homePath())
      return
    }

    if (pathname === '/setup' || pathname === '/access/confirmed') {
      goToPreviousScreen(hasAccess() ? '/begin' : '/')
      return
    }

    if (pathname === '/preview') {
      goToPreviousScreen('/')
      return
    }

    if (pathname === '/no-ticket') {
      goToPreviousScreen('/journey')
      return
    }

    goToPreviousScreen(homePath())
  }

  return (
    <button
      type="button"
      aria-label="Go back"
      title="Go back"
      onClick={handleBack}
      data-testid="flow-escape-back"
      className="cw-flow-escape"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        left: 'calc(env(safe-area-inset-left, 0px) + 10px)',
        zIndex: 120,
        display: 'grid',
        placeItems: 'center',
        width: 36,
        height: 36,
        padding: 0,
        borderRadius: 999,
        border: `1px solid ${T.muted}28`,
        background: 'rgba(11,11,13,0.45)',
        color: 'rgba(245, 239, 227, 0.92)',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        opacity: 0.72,
        transition: 'opacity 180ms ease, background 180ms ease',
        boxShadow: '0 4px 14px rgba(11,11,13,0.18)',
      }}
    >
      <ChevronLeft size={18} strokeWidth={2.25} aria-hidden />
    </button>
  )
}
