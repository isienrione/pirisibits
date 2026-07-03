export const NAV_TABS = {
  JOURNEY: 'journey',
  MAP: 'map',
  JOURNAL: 'journal',
}

const iconClass = 'h-5 w-5 shrink-0'

export const NAV_ITEMS = [
  {
    id: NAV_TABS.JOURNEY,
    label: 'Journey',
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
    id: NAV_TABS.JOURNAL,
    label: 'Journal',
    Icon: () => (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 0-2 2V4Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path d="M6 18h12M10 8h6M10 12h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
]
