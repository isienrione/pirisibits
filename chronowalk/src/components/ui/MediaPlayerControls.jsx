import { useCallback, useState } from 'react'
import { readPlayerIconsPref, writePlayerIconsPref } from '../../utils/appPreferences'
import { Button } from './Button'
import { cn } from './cn'
import { focusRing } from './focusRing'

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

function StopIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
    </svg>
  )
}

const controlBase =
  'inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors'

const themes = {
  dark: {
    primary: 'bg-bronze text-ivory shadow-bronze-cta hover:bg-bronze/90',
    secondary: 'bg-ivory/10 text-ivory hover:bg-ivory/15 border border-gold/20',
  },
  light: {
    primary: 'bg-bronze text-ivory shadow-bronze-cta hover:bg-bronze/90',
    secondary: 'border border-bronze/35 bg-ivory text-deep-slate hover:bg-parchment/50',
  },
}

export function MediaPlayerControls({
  isPlaying,
  onToggle,
  onStop,
  showStop = true,
  theme = 'dark',
  className,
}) {
  const [useIcons, setUseIcons] = useState(() => readPlayerIconsPref())
  const palette = themes[theme] ?? themes.dark

  const handleToggle = useCallback(() => {
    if (!useIcons) {
      writePlayerIconsPref(true)
      setUseIcons(true)
    }
    onToggle?.()
  }, [onToggle, useIcons])

  if (!useIcons) {
    return (
      <Button
        size="sm"
        className={cn('px-4', className)}
        onClick={handleToggle}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
    )
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        className={cn(controlBase, palette.primary, focusRing)}
      >
        {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="ml-0.5 h-[18px] w-[18px]" />}
      </button>
      {showStop && onStop ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop audio"
          className={cn(controlBase, palette.secondary, focusRing)}
        >
          <StopIcon className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export default MediaPlayerControls
