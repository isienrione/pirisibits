import { cn, focusRing } from '../ui'

function PlayIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72L19 12 8 5.14Z" />
    </svg>
  )
}

function PauseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

const SIZES = {
  lg: {
    button: 'h-[4.5rem] w-[4.5rem]',
    icon: 'h-7 w-7',
    playOffset: 'ml-1',
  },
  md: {
    button: 'h-14 w-14',
    icon: 'h-5 w-5',
    playOffset: 'ml-0.5',
  },
  sm: {
    button: 'h-10 w-10',
    icon: 'h-4 w-4',
    playOffset: 'ml-0.5',
  },
}

export function LargePlayButton({
  isPlaying,
  onToggle,
  size = 'lg',
  className,
  animateOnPlay = false,
}) {
  const sizing = SIZES[size] ?? SIZES.lg

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-terracotta text-warm-white shadow-cta transition-all duration-300 ease-out hover:bg-terracotta/92 active:scale-[0.97]',
        sizing.button,
        animateOnPlay && isPlaying && 'animate-audio-play-pulse',
        focusRing,
        className
      )}
    >
      {isPlaying ? (
        <PauseIcon className={sizing.icon} />
      ) : (
        <PlayIcon className={cn(sizing.icon, sizing.playOffset)} />
      )}
    </button>
  )
}
