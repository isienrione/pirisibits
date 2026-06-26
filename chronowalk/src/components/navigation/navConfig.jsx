import { ArrivalIcon, HistoryIcon, MapIcon, SettingsIcon } from '../ui/icons/index.jsx'

export const NAV_TABS = {
  TOUR: 'tour',
  MAP: 'map',
  STOPS: 'stops',
  DIRECTIONS: 'directions',
  SETTINGS: 'settings',
}

export const NAV_ITEMS = [
  {
    id: NAV_TABS.TOUR,
    label: 'Tour',
    Icon: (props) => <ArrivalIcon size="md" {...props} />,
  },
  {
    id: NAV_TABS.MAP,
    label: 'Map',
    Icon: (props) => <MapIcon size="md" {...props} />,
  },
  {
    id: NAV_TABS.STOPS,
    label: 'Stops',
    Icon: (props) => <HistoryIcon size="md" {...props} />,
  },
  {
    id: NAV_TABS.SETTINGS,
    label: 'Settings',
    Icon: (props) => <SettingsIcon size="md" {...props} />,
  },
]
