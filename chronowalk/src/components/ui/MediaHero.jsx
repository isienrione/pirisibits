import { useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { cn } from './cn'

const GRADIENT_CLASS = {
  none: null,
  bottom: 'bg-gradient-to-t from-deep-slate/70 via-deep-slate/25 to-transparent',
  strong: 'bg-gradient-to-t from-deep-slate/88 via-deep-slate/50 via-[42%] to-deep-slate/5',
  subtle: 'bg-gradient-to-t from-deep-slate/45 via-transparent to-transparent',
  vignette:
    'bg-[linear-gradient(to_bottom,rgba(23,33,43,0.18)_0%,transparent_38%,rgba(23,33,43,0.62)_100%)]',
}

const ROUNDED_CLASS = {
  none: '',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  bottom: 'rounded-b-3xl',
  frame: 'rounded-b-[2rem]',
}

const ASPECT_CLASS = {
  auto: '',
  '4/3': 'aspect-[4/3]',
  '16/10': 'aspect-[16/10]',
  '16/9': 'aspect-[16/9]',
  '3/4': 'aspect-[3/4]',
  screen: 'min-h-[min(85vh,52rem)]',
}

export function MediaHero({
  src,
  alt = '',
  aspect = 'auto',
  rounded = 'none',
  gradient = 'bottom',
  zoom = false,
  fadeIn = false,
  className,
  imageClassName,
  objectPosition = 'center',
  onError,
  onLoad,
  referrerPolicy = 'no-referrer',
  children,
}) {
  const reducedMotion = useReducedMotion()
  const [loaded, setLoaded] = useState(!src)

  const handleLoad = (event) => {
    setLoaded(true)
    onLoad?.(event)
  }

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden bg-gradient-to-br from-sand via-limestone/40 to-warm-white',
        ASPECT_CLASS[aspect] ?? aspect,
        ROUNDED_CLASS[rounded] ?? rounded,
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy={referrerPolicy}
          onLoad={handleLoad}
          onError={onError}
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            zoom && !reducedMotion && 'animate-hero-ken-burns',
            fadeIn && 'transition-opacity duration-[900ms] ease-out',
            fadeIn && (loaded ? 'opacity-100' : 'opacity-0'),
            imageClassName
          )}
          style={{ objectPosition }}
        />
      ) : null}

      {GRADIENT_CLASS[gradient] ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-[1]',
            GRADIENT_CLASS[gradient],
            fadeIn && 'transition-opacity duration-[900ms] ease-out',
            fadeIn && (loaded ? 'opacity-100' : 'opacity-0')
          )}
          aria-hidden="true"
        />
      ) : null}

      {children ? <div className="absolute inset-0 z-[2]">{children}</div> : null}
    </div>
  )
}
