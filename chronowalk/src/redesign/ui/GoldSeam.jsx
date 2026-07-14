import { useEffect, useRef } from 'react'
import { T } from '../tokens.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { resolveGoldSeamPreset } from './goldSeamPresets.js'

/**
 * Gold Seam — ChronoWalk signature brand mark for meaningful moments only.
 *
 * Prefer `moment` presets from `goldSeamPresets.js`. Low-level props override
 * the preset for one-off compositions. See `docs/GOLD_SEAM.md`.
 */
export function GoldSeam({
  moment,
  variant: variantProp,
  motion: motionProp,
  accent,
  thickness: thicknessProp,
  length: lengthProp,
  glow: glowProp,
  pct = 0,
  play = true,
  loop: loopProp,
  duration: durationProp,
  delay: delayProp,
  leadingDot: leadingDotProp,
  layout: layoutProp,
  onComplete,
  className = '',
  style: extraStyle,
  'aria-hidden': ariaHidden = true,
  ...rest
}) {
  const reducedMotion = useReducedMotion()
  const preset = resolveGoldSeamPreset(moment)
  const completeRef = useRef(onComplete)
  completeRef.current = onComplete

  const variant = variantProp ?? preset.variant
  const motion = reducedMotion ? 'none' : (motionProp ?? preset.motion)
  const thickness = thicknessProp ?? preset.thickness ?? 1.5
  const length = lengthProp ?? preset.length
  const glow = glowProp ?? preset.glow ?? true
  const loop = loopProp ?? preset.loop ?? false
  const duration = durationProp ?? preset.duration ?? 1000
  const delay = delayProp ?? preset.delay ?? 0
  const leadingDot = leadingDotProp ?? preset.leadingDot ?? false
  const layout = layoutProp ?? preset.layout ?? 'inline'

  const color = accent ?? 'var(--gold, #d4af37)'

  useEffect(() => {
    if (!play || motion === 'none' || loop || !completeRef.current) return undefined
    const ms = delay + duration + 40
    const id = window.setTimeout(() => completeRef.current?.(), ms)
    return () => window.clearTimeout(id)
  }, [play, motion, loop, delay, duration, moment])

  const glowShadow = glow
    ? accent
      ? `0 0 12px ${withAlpha(accent, 0.45)}`
      : 'var(--seam-glow, 0 0 12px rgba(212, 175, 55, 0.45))'
    : 'none'

  const animName = motionToAnimation(motion, variant, loop)
  const animIteration = loop ? 'infinite' : 1
  const cycleMs = loop && motion === 'drawDown' && variant === 'vertical' ? duration + 1200 : duration
  const animation =
    play && animName && motion !== 'none'
      ? `${animName} ${cycleMs}ms ${easingFor(motion)} ${delay}ms ${animIteration} both`
      : undefined

  const { 'data-testid': testId, ...domRest } = rest
  const seamStyle = {
    '--cw-seam-color': color,
    '--cw-seam-thickness': `${thickness}px`,
    '--cw-seam-duration': `${cycleMs}ms`,
    background: color,
    boxShadow: glowShadow,
    pointerEvents: 'none',
    animation,
    ...layoutStyles(variant, layout, length, pct, thickness),
    ...extraStyle,
  }

  const classes = [
    'cw-gold-seam',
    `cw-gold-seam--${variant}`,
    motion !== 'none' ? `cw-gold-seam--${motion}` : null,
    layout === 'fill' ? 'cw-gold-seam--fill' : null,
    play ? null : 'cw-gold-seam--paused',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={seamStyle}
      data-gold-seam={moment || variant}
      data-testid={testId ?? (moment ? `gold-seam-${moment}` : 'gold-seam')}
      aria-hidden={ariaHidden}
      {...domRest}
    >
      {leadingDot && motion === 'drawDown' && play && !reducedMotion ? (
        <span className="cw-gold-seam__dot" aria-hidden />
      ) : null}
    </div>
  )
}

function motionToAnimation(motion, variant, loop) {
  switch (motion) {
    case 'breathe':
      return 'cwGoldSeamBreathe'
    case 'drawDown':
      if (variant === 'tick') return 'cwGoldSeamDrawDownTick'
      return loop ? 'cwGoldSeamDrawDownLoop' : 'cwGoldSeamDrawDown'
    case 'drawAcross':
      return 'cwGoldSeamDrawAcross'
    case 'flash':
      return 'cwGoldSeamFlash'
    case 'pulse':
      return 'cwGoldSeamPulse'
    default:
      return null
  }
}

function easingFor(motion) {
  if (motion === 'drawDown' || motion === 'drawAcross') return 'cubic-bezier(0.4, 0, 0.2, 1)'
  if (motion === 'flash') return 'cubic-bezier(0.22, 1, 0.36, 1)'
  return 'ease-in-out'
}

function layoutStyles(variant, layout, length, pct, thickness) {
  if (variant === 'progress') {
    return {
      position: layout === 'fill' ? 'absolute' : 'relative',
      top: layout === 'fill' ? 0 : undefined,
      left: layout === 'fill' ? 0 : undefined,
      height: Math.max(thickness, 3),
      width: `${Math.max(0, Math.min(1, pct)) * 100}%`,
      zIndex: 5,
    }
  }

  if (variant === 'horizontal' || variant === 'flash') {
    const w = length ?? (layout === 'fill' ? '100%' : 48)
    return {
      position: layout === 'fill' ? 'absolute' : 'relative',
      left: layout === 'fill' ? 0 : undefined,
      right: layout === 'fill' ? 0 : undefined,
      width: typeof w === 'number' ? w : w,
      height: thickness,
      margin: layout === 'inline' ? '0 auto' : undefined,
      zIndex: 4,
      transformOrigin: variant === 'flash' ? 'center center' : 'left center',
    }
  }

  if (variant === 'tick') {
    const h = length ?? 28
    return {
      position: 'relative',
      width: thickness,
      height: typeof h === 'number' ? h : h,
      margin: '0 auto',
      zIndex: 4,
      transformOrigin: 'top center',
      flexShrink: 0,
    }
  }

  // vertical fill (purchase / tour unlock ceremony)
  return {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: thickness,
    marginLeft: -thickness / 2,
    transformOrigin: 'top center',
    zIndex: 4,
  }
}

function withAlpha(hexOrCss, alpha) {
  if (typeof hexOrCss !== 'string' || !hexOrCss.startsWith('#') || hexOrCss.length < 7) {
    return hexOrCss
  }
  const r = Number.parseInt(hexOrCss.slice(1, 3), 16)
  const g = Number.parseInt(hexOrCss.slice(3, 5), 16)
  const b = Number.parseInt(hexOrCss.slice(5, 7), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return hexOrCss
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Default accent when callers need a JS color (canvas / tests). */
export const GOLD_SEAM_ACCENT = T.gold
