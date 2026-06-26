import { useCallback, useState } from 'react'
import { readPlayerIconsPref, writePlayerIconsPref } from '../../utils/appPreferences'
import { Button } from './Button'
import { cn } from './cn'
import { focusRing } from './focusRing'
import { motionTap } from './motion'
import { PauseIcon, PlayIcon, StopIcon } from './icons/index.jsx'

const themes = {
  dark: {
    primary: 'bg-terracotta text-warm-white hover:bg-terracotta/90',
    secondary: 'bg-warm-white/10 text-warm-white hover:bg-warm-white/15',
  },
  light: {
    primary: 'bg-terracotta text-warm-white hover:bg-terracotta/90',
    secondary: 'border border-limestone/70 bg-warm-white/90 text-deep-slate hover:bg-sand/60',
  },
}

const controlBase =
  'inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 ease-motion-out'

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
        className={cn(controlBase, motionTap, palette.primary, focusRing)}
      >
        {isPlaying ? (
          <PauseIcon size="sm" />
        ) : (
          <PlayIcon size="sm" className="ml-0.5" />
        )}
      </button>
      {showStop && onStop ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop audio"
          className={cn(controlBase, motionTap, palette.secondary, focusRing)}
        >
          <StopIcon size="sm" />
        </button>
      ) : null}
    </div>
  )
}

export default MediaPlayerControls
