import { cn } from '../../ui'

function GpsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s6-5.33 6-10a6 6 0 1 0-12 0c0 4.67 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="11" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function AudioIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18V6l8-2v14M6 15a3 3 0 0 0 3 3 3 3 0 0 0 3-3V9a3 3 0 0 0-3-3 3 3 0 0 0-3 3v6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M18 8.5a4.5 4.5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RevealIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 15l3-3 2 2 4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9h16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const FEATURES = [
  { id: 'gps', label: 'GPS guided', Icon: GpsIcon },
  { id: 'audio', label: 'Audio stories', Icon: AudioIcon },
  { id: 'reveals', label: 'Visual reveals', Icon: RevealIcon },
]

export function TourFeatureRow({ className }) {
  return (
    <ul className={cn('flex items-start justify-between gap-2', className)}>
      {FEATURES.map(({ id, label, Icon }) => (
        <li key={id} className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 text-ivory/90">
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ivory/75">
            {label}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default TourFeatureRow
