import {
  hasComparisonSliderMedia,
  hasModernSliderMedia,
} from '../utils/sliderMedia'
import { cn } from './ui'

function HeadphonesIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 14v4a2 2 0 0 0 2 2h1V12H5a1 1 0 0 0-1 1v1Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 14v4a2 2 0 0 1-2 2h-1V12h2a1 1 0 0 1 1 1v1Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 14a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function ImageIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path d="m4 16 4.5-4.5 3 3L15 11l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function CompareIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="7" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="5" width="7" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function WaypointMetadataRow({ waypoint, className }) {
  if (!waypoint) return null

  const hasAudio = Boolean(waypoint.arrival_immersive_url)
  const hasImages = hasModernSliderMedia(waypoint)
  const hasThenNow = hasComparisonSliderMedia(waypoint)

  const items = [
    hasAudio ? { id: 'audio', label: 'Audio story', Icon: HeadphonesIcon } : null,
    hasImages ? { id: 'images', label: 'Images', Icon: ImageIcon } : null,
    hasThenNow ? { id: 'then-now', label: 'Then & now', Icon: CompareIcon } : null,
  ].filter(Boolean)

  if (!items.length) return null

  return (
    <ul className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      {items.map(({ id, label, Icon }) => (
        <li key={id} className="flex items-center gap-2 text-sm text-deep-slate">
          <Icon className="h-4 w-4 shrink-0 text-bronze" />
          <span className="font-medium">{label}</span>
        </li>
      ))}
    </ul>
  )
}

export default WaypointMetadataRow
