export function LocationIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2" fill="currentColor" />
    </svg>
  )
}

export function OfflineIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 12a8.5 8.5 0 0 1 14.8-5.8M20.5 12A8.5 8.5 0 0 1 5.7 17.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="m4 4 16 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function AudioIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 8.5v7l6.5-3.5L9 8.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M5 10v4M3 9v6M19 10v4M21 9v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MediaIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="m10 10 4 2-4 2v-4Z" fill="currentColor" />
    </svg>
  )
}

export function RouteIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 19c0-2.2 1.8-4 4-4h4c2.2 0 4-1.8 4-4s-1.8-4-4-4H9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="6" cy="19" r="2" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="18" cy="7" r="2" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

export function JourneyIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 12 20 7.5M12 12v9M12 12 4 7.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

export const EMPTY_STATE_ICONS = {
  location: LocationIcon,
  offline: OfflineIcon,
  audio: AudioIcon,
  media: MediaIcon,
  route: RouteIcon,
  journey: JourneyIcon,
}
