export const NAV_TABS = {
  TOUR: 'tour',
  MAP: 'map',
  STOPS: 'stops',
  DIRECTIONS: 'directions',
  SETTINGS: 'settings',
}

const iconClass = 'h-5 w-5 shrink-0'

export const NAV_ITEMS = [
  {
    id: NAV_TABS.TOUR,
    label: 'Tour',
    Icon: () => (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path d="M12 12 20 7.5M12 12v9M12 12 4 7.5" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    ),
  },
  {
    id: NAV_TABS.MAP,
    label: 'Map',
    Icon: () => (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path d="m9 4 .034 14M15 6v14" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    ),
  },
  {
    id: NAV_TABS.STOPS,
    label: 'Stops',
    Icon: () => (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 7h14M5 12h14M5 17h10"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="18" cy="17" r="2" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    ),
  },
  {
    id: NAV_TABS.SETTINGS,
    label: 'Settings',
    Icon: () => (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]
