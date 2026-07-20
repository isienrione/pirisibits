import { hasAccess } from '../../lib/config.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import { SHELL_TAB_META, SHELL_TAB_ORDER } from '../../shell/config.js'

const COMPANION_TAB_PATHS = SHELL_TAB_ORDER.map((id) => SHELL_TAB_META[id].to)

export function homePath() {
  return hasAccess() ? '/tour' : '/landing'
}

/** Routes that render their own prominent in-screen back control. */
export function hasInScreenBack({ pathname, journeyState }) {
  if (/^\/journal\/[^/]+$/.test(pathname)) return true
  if (pathname === '/credits') return true
  if (pathname === '/letter') return true
  if (pathname.startsWith('/preview')) return true
  if (pathname === '/begin') return true
  if (pathname === '/setup') return true
  if (pathname === '/access') return true
  if (pathname === '/access/confirmed') return true
  if (pathname === '/no-ticket') return true
  if (pathname === '/map') return true
  if (pathname === '/journey' && journeyState === JOURNEY_STATES.STORY) return true
  return false
}

/** Whether the global fixed back bar should render. */
export function shouldShowGlobalBack({ pathname, journeyState }) {
  if (pathname === '/' || pathname === '/landing') return false
  if (pathname === '/journey' && journeyState === JOURNEY_STATES.THRESHOLD) return false
  if (hasInScreenBack({ pathname, journeyState })) return false
  return true
}

/**
 * Resolve label + navigation for the global back button.
 * @returns {{ label: string, run: (navigate: Function, transition: Function) => void }}
 */
export function resolveBackNavigation({ pathname, journeyState }) {
  if (pathname === '/journey') {
    if (journeyState === JOURNEY_STATES.STORY) {
      return {
        label: 'Back to walk',
        run: (navigate, transition) => transition(JOURNEY_STATES.WALKING),
      }
    }
    if (journeyState === JOURNEY_STATES.ARRIVED) {
      return {
        label: 'Back to walk',
        run: (navigate, transition) => transition(JOURNEY_STATES.WALKING),
      }
    }
    if (
      journeyState === JOURNEY_STATES.PAUSED ||
      journeyState === JOURNEY_STATES.DAY_COMPLETE
    ) {
      return {
        label: 'Back to walk',
        run: (navigate, transition) => transition(JOURNEY_STATES.WALKING),
      }
    }
    return {
      label: 'My Tour',
      run: (navigate) => navigate(homePath(), { replace: true }),
    }
  }

  if (pathname === '/begin') {
    return {
      label: 'My Tour',
      run: (navigate) => navigate(homePath(), { replace: true }),
    }
  }

  if (pathname === '/setup' || pathname === '/access/confirmed') {
    return { label: 'Home', run: (navigate) => navigate('/landing', { replace: true }) }
  }

  if (pathname === '/preview') {
    return { label: 'Home', run: (navigate) => navigate('/landing', { replace: true }) }
  }

  if (pathname === '/access') {
    return { label: 'Home', run: (navigate) => navigate('/landing', { replace: true }) }
  }

  if (pathname === '/no-ticket') {
    return { label: 'Back to walk', run: (navigate) => navigate('/journey', { replace: true }) }
  }

  if (pathname === '/map') {
    return { label: 'Back to walk', run: (navigate) => navigate('/journey', { replace: true }) }
  }

  if (pathname === '/stops' || pathname === '/journal') {
    return { label: 'My Tour', run: (navigate) => navigate('/tour', { replace: true }) }
  }

  if (pathname === '/tour') {
    return {
      label: hasAccess() ? 'Setup' : 'Home',
      run: (navigate) => navigate(hasAccess() ? '/setup' : '/landing', { replace: true }),
    }
  }

  if (COMPANION_TAB_PATHS.includes(pathname)) {
    return { label: 'My Tour', run: (navigate) => navigate('/tour', { replace: true }) }
  }

  return {
    label: 'Back',
    run: (navigate) => {
      if (window.history.length > 1) {
        navigate(-1)
        return
      }
      navigate(homePath(), { replace: true })
    },
  }
}
