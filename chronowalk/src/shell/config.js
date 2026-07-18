import { NAV_ITEMS, NAV_TABS } from '../components/navigation/navConfig.jsx'

/**
 * Companion tabs: Walk returns to the live stop / player / reconstruction;
 * Tour is the merged roadmap + all-stops list (former My Tour + Stops).
 */
export const SHELL_TAB_ORDER = [NAV_TABS.WALK, NAV_TABS.TOUR, NAV_TABS.MAP, NAV_TABS.JOURNAL]

export const SHELL_TAB_META = {
  [NAV_TABS.WALK]: { to: '/journey', label: 'Walk' },
  [NAV_TABS.TOUR]: { to: '/tour', label: 'Tour' },
  [NAV_TABS.MAP]: { to: '/map', label: 'Map' },
  [NAV_TABS.JOURNAL]: { to: '/journal', label: 'Journal' },
}

export const SHELL_COMPANION_PATHS = [
  ...SHELL_TAB_ORDER.map((id) => SHELL_TAB_META[id].to),
  '/stops', // legacy deep links redirect to /tour but keep the bar visible
]

export function getShellTabs() {
  const byId = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item]))

  return SHELL_TAB_ORDER.map((id) => ({
    id,
    ...SHELL_TAB_META[id],
    Icon: byId[id]?.Icon,
  })).filter((tab) => tab.Icon)
}

/** Which shell tab should highlight for the current pathname. */
export function isShellTabActive(tabTo, pathname) {
  if (tabTo === '/journey') return pathname === '/journey'
  if (tabTo === '/tour') return pathname === '/tour' || pathname === '/stops'
  return pathname === tabTo
}

export const SHELL_SURFACE = {
  EXPLORER: 'explorer',
  COMPANION: 'companion',
}
