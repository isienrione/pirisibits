import { cn } from '../cn'

export const ICON_STROKE = 1.75

export const ICON_SIZES = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-7 w-7',
  '2xl': 'h-12 w-12',
}

const strokeProps = {
  stroke: 'currentColor',
  strokeWidth: ICON_STROKE,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconBase({ size = 'md', className, children, ...props }) {
  return (
    <svg
      className={cn(ICON_SIZES[size] ?? ICON_SIZES.md, 'shrink-0', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

function S({ d, ...props }) {
  return <path d={d} {...strokeProps} {...props} />
}

function C({ cx, cy, r, ...props }) {
  return <circle cx={cx} cy={cy} r={r} {...strokeProps} {...props} />
}

export function AudioIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M9 8.5v7l6.5-3.5L9 8.5Z" {...strokeProps} />
      <S d="M5 10v4M3 9.5v5M19 10v4M21 9.5v5" />
    </IconBase>
  )
}

export function NavigationIcon(props) {
  return (
    <IconBase {...props}>
      <S d="M6 19c0-2.2 1.8-4 4-4h4c2.2 0 4-1.8 4-4s-1.8-4-4-4H9" />
      <C cx={6} cy={19} r={2} />
      <C cx={18} cy={7} r={2} />
    </IconBase>
  )
}

export function HistoryIcon(props) {
  return (
    <IconBase {...props}>
      <C cx={12} cy={12} r={8} />
      <S d="M12 8v5l3 2" />
      <S d="M8 4.5 6 6.5 8 8.5" />
    </IconBase>
  )
}

export function CompassIcon(props) {
  return (
    <IconBase {...props}>
      <C cx={12} cy={12} r={9} />
      <S d="m16 8-2.5 6.5L8 16l2.5-6.5L16 8Z" />
      <C cx={12} cy={12} r={1.25} fill="currentColor" stroke="none" />
    </IconBase>
  )
}

export function MapIcon(props) {
  return (
    <IconBase {...props}>
      <S d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
      <S d="m9 4 .034 14M15 6v14" />
    </IconBase>
  )
}

export function ArrivalIcon(props) {
  return (
    <IconBase {...props}>
      <S d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
      <S d="M12 12 20 7.5M12 12v9M12 12 4 7.5" />
    </IconBase>
  )
}

export function GalleryIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="7" width="16" height="11" rx="2" {...strokeProps} />
      <S d="m4 16.5 4.5-4 3 2.5L15 10.5l5 4" />
      <circle cx="9" cy="10" r="1.25" fill="currentColor" stroke="none" />
    </IconBase>
  )
}

export function SettingsIcon(props) {
  return (
    <IconBase {...props}>
      <C cx={12} cy={12} r={3} />
      <S d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
    </IconBase>
  )
}

export function ProfileIcon(props) {
  return (
    <IconBase {...props}>
      <C cx={12} cy={8} r={3.5} />
      <S d="M5.5 19.5c1.2-3 3.4-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
    </IconBase>
  )
}

export function DeveloperIcon(props) {
  return (
    <IconBase {...props}>
      <S d="m8 9-3 3 3 3M16 9l3 3-3 3M13.5 7.5l-3 9" />
    </IconBase>
  )
}

export function LocationIcon(props) {
  return (
    <IconBase {...props}>
      <C cx={12} cy={12} r={9} opacity={0.35} />
      <S d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <C cx={12} cy={11} r={2} fill="currentColor" stroke="none" />
    </IconBase>
  )
}

export function OfflineIcon(props) {
  return (
    <IconBase {...props}>
      <S d="M3.5 12a8.5 8.5 0 0 1 14.8-5.8M20.5 12A8.5 8.5 0 0 1 5.7 17.8" />
      <S d="m4 4 16 16" />
    </IconBase>
  )
}

export function LockIcon(props) {
  return (
    <IconBase {...props}>
      <S d="M8 11V8a4 4 0 0 1 8 0v3" />
      <S d="M5 11h14v10H5z" />
    </IconBase>
  )
}

export function PlayIcon({ size = 'md', className, ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <path d="M9 8.5v7l7-3.5-7-3.5Z" fill="currentColor" stroke="none" />
    </IconBase>
  )
}

export function PauseIcon(props) {
  return (
    <IconBase {...props}>
      <S d="M8 7v10M16 7v10" />
    </IconBase>
  )
}

export function StopIcon(props) {
  return (
    <IconBase {...props}>
      <S d="M8 8h8v8H8z" />
    </IconBase>
  )
}

export function ChevronsHorizontalIcon(props) {
  return (
    <IconBase {...props}>
      <S d="M8 8 4 12l4 4M16 8l4 4-4 4" />
    </IconBase>
  )
}

/** @deprecated Use ArrivalIcon */
export const JourneyIcon = ArrivalIcon

/** @deprecated Use GalleryIcon */
export const MediaIcon = GalleryIcon

/** @deprecated Use NavigationIcon */
export const RouteIcon = NavigationIcon

export const EMPTY_STATE_ICONS = {
  location: LocationIcon,
  offline: OfflineIcon,
  audio: AudioIcon,
  media: GalleryIcon,
  route: NavigationIcon,
  journey: ArrivalIcon,
}
