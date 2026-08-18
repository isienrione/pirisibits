import { NAV_ITEMS, NAV_TABS } from '../components/navigation/navConfig.jsx'
import { t } from '../i18n/t.js'
import { JOURNEY_STATES } from '../state/journey.js'

/**
 * Companion tabs: Home is the hub (progress + manage);
 * Walk returns to the live stop / player / reconstruction;
 * Tour is the merged roadmap + all-stops list (former My Tour + Stops).
 */
export const SHELL_TAB_ORDER = [
  NAV_TABS.HOME,
  NAV_TABS.WALK,
  NAV_TABS.TOUR,
  NAV_TABS.MAP,
  NAV_TABS.JOURNAL,
]

export const NATIVE_SHELL_TAB_ORDER = [
  NAV_TABS.HOME,
  NAV_TABS.MAP,
  NAV_TABS.JOURNAL,
  NAV_TABS.SETTINGS,
]

export const SHELL_TAB_META = {
  [NAV_TABS.HOME]: { to: '/home', labelKey: 'shell.tab.home' },
  [NAV_TABS.WALK]: { to: '/journey', labelKey: 'shell.tab.walk' },
  [NAV_TABS.TOUR]: { to: '/tour', labelKey: 'shell.tab.tour' },
  [NAV_TABS.MAP]: { to: '/map', labelKey: 'shell.tab.map' },
  [NAV_TABS.JOURNAL]: { to: '/journal', labelKey: 'shell.tab.journal' },
  [NAV_TABS.SETTINGS]: { to: '/settings', labelKey: 'shell.tab.settings' },
}

export const SHELL_COMPANION_PATHS = [
  ...SHELL_TAB_ORDER.map((id) => SHELL_TAB_META[id].to),
  '/stops',
  '/settings',
  '/explore',
]

export function isWalkTabVisible(state) {
  return Boolean(state) && state !== JOURNEY_STATES.IDLE && state !== JOURNEY_STATES.COMPLETE
}

/**
 * @param {{ native?: boolean, walkActive?: boolean }} [options]
 * Default (no options) keeps Home · Walk · Tour · Map · Journal for web/legacy tests.
 */
export function getShellTabs({ native = false, walkActive = false } = {}) {
  const byId = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item]))
  const order = native
    ? walkActive
      ? [NAV_TABS.HOME, NAV_TABS.WALK, ...NATIVE_SHELL_TAB_ORDER.filter((id) => id !== NAV_TABS.HOME)]
      : NATIVE_SHELL_TAB_ORDER
    : SHELL_TAB_ORDER

  return order
    .map((id) => {
      const meta = SHELL_TAB_META[id]
      if (!meta) return null
      let labelKey = meta.labelKey
      if (native && id === NAV_TABS.HOME) labelKey = 'shell.tab.discover'
      if (native && id === NAV_TABS.JOURNAL) labelKey = 'shell.tab.saved'
      return {
        id,
        to: meta.to,
        label: t(labelKey),
        labelKey,
        Icon: byId[id]?.Icon,
      }
    })
    .filter((tab) => tab?.Icon)
}

export function isCompanionShellPath(pathname) {
  if (SHELL_COMPANION_PATHS.includes(pathname)) return true
  if (pathname === '/journey') return true
  return Boolean(pathname?.startsWith('/experience/'))
}

/** Which shell tab should highlight for the current pathname. */
export function isShellTabActive(tabTo, pathname) {
  if (tabTo === '/home') {
    return pathname === '/home' || pathname === '/explore' || Boolean(pathname?.startsWith('/experience/'))
  }
  if (tabTo === '/journey') return pathname === '/journey'
  if (tabTo === '/tour') return pathname === '/tour' || pathname === '/stops'
  if (tabTo === '/settings') return pathname === '/settings'
  return pathname === tabTo
}

export const SHELL_SURFACE = {
  EXPLORER: 'explorer',
  COMPANION: 'companion',
}
