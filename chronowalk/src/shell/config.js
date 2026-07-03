import { NAV_ITEMS, NAV_TABS } from '../components/navigation/navConfig.jsx'

/**
 * Visual shell configuration — change labels, routes, or tab order here
 * without touching journey logic or content models.
 */
export const SHELL_TAB_ORDER = [NAV_TABS.JOURNEY, NAV_TABS.MAP, NAV_TABS.JOURNAL]

export const SHELL_TAB_META = {
  [NAV_TABS.JOURNEY]: { to: '/journey', label: 'Journey' },
  [NAV_TABS.MAP]: { to: '/map', label: 'Map' },
  [NAV_TABS.JOURNAL]: { to: '/journal', label: 'Journal' },
}

export const SHELL_COMPANION_PATHS = SHELL_TAB_ORDER.map((id) => SHELL_TAB_META[id].to)

export function getShellTabs() {
  const byId = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item]))

  return SHELL_TAB_ORDER.map((id) => ({
    id,
    ...SHELL_TAB_META[id],
    Icon: byId[id]?.Icon,
  })).filter((tab) => tab.Icon)
}

/** Explorer (daylight) vs companion (ink) — presentation only. */
export const SHELL_SURFACE = {
  EXPLORER: 'explorer',
  COMPANION: 'companion',
}
