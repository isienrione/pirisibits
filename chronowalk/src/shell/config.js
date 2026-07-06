import { NAV_ITEMS, NAV_TABS } from '../components/navigation/navConfig.jsx'

const useFigmaRedesign = import.meta.env.VITE_FIGMA_REDESIGN !== 'false'

/** Figma spec: Journey · Stops · Map · Journal */
export const SHELL_TAB_ORDER = useFigmaRedesign
  ? [NAV_TABS.TOUR, NAV_TABS.STOPS, NAV_TABS.MAP, NAV_TABS.JOURNAL]
  : [NAV_TABS.TOUR, NAV_TABS.MAP, NAV_TABS.JOURNAL]

export const SHELL_TAB_META = {
  [NAV_TABS.TOUR]: { to: '/journey', label: 'Journey' },
  [NAV_TABS.STOPS]: { to: '/stops', label: 'Stops' },
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

export const SHELL_SURFACE = {
  EXPLORER: 'explorer',
  COMPANION: 'companion',
}
