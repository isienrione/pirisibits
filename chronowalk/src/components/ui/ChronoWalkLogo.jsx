import { cn } from './cn.js'
import { noteDebugLogoTap } from '../debug/debugPanelGate.js'

/** Official brand assets - see /public/brand/ */
const ASSETS = {
  emblem: {
    dark: '/brand/emblem-dark.png',
    light: '/brand/emblem-light.png',
  },
  horizontal: {
    dark: '/brand/lockup-horizontal-dark.png',
    light: '/brand/lockup-horizontal-light.png',
  },
  stacked: {
    dark: '/brand/lockup-stacked-dark.png',
    light: '/brand/lockup-horizontal-light.png',
  },
}

const ASPECT = {
  horizontal: 4 / 3,
  stacked: 1,
}

function EmblemImage({ variant, size, className, alt = 'ChronoWalk emblem', onPointerDown }) {
  return (
    <img
      src={ASSETS.emblem[variant]}
      alt={alt}
      width={size}
      height={size}
      className={cn('block shrink-0', className)}
      style={{ width: size, height: 'auto' }}
      decoding="async"
      onPointerDown={onPointerDown}
    />
  )
}

function LockupImage({ src, width, aspect, className, alt = 'ChronoWalk', onPointerDown }) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={Math.round(width / aspect)}
      className={cn('block max-w-full', className)}
      style={{ width, height: 'auto' }}
      decoding="async"
      onPointerDown={onPointerDown}
    />
  )
}

function WordmarkTitle({ variant, className }) {
  const color =
    variant === 'light'
      ? 'var(--color-obsidian, #0B0B0D)'
      : 'var(--color-warm-ivory, #FAF6EF)'

  return (
    <span
      className={cn('font-brand-title block leading-none', className)}
      style={{
        fontFamily: "'Fraunces', Georgia, serif",
        textTransform: 'uppercase',
        letterSpacing: '0.22em',
        fontSize: 'clamp(1.05rem, 3.2vw, 1.4rem)',
        fontWeight: 400,
        color,
      }}
    >
      CHRONOWALK
    </span>
  )
}

/**
 * ChronoWalk brand lockup - official raster assets from the brand manual.
 *
 * @param {'dark' | 'light'} variant - `dark` on obsidian; `light` on warm ivory surfaces.
 * @param {'horizontal' | 'stacked'} layout - Manual horizontal or stacked lockup.
 * @param {number} [size] - Emblem-only square size (px); omits wordmark.
 */
export default function ChronoWalkLogo({
  className,
  width = 320,
  variant = 'dark',
  layout = 'horizontal',
  showWordmark = true,
  hideTagline = false,
  size,
  color: _legacyColor,
}) {
  const stacked = layout === 'stacked' || width < 240
  const onLogoPointerDown = () => {
    noteDebugLogoTap()
  }

  if (size != null) {
    return (
      <EmblemImage
        variant={variant}
        size={size}
        className={className}
        onPointerDown={onLogoPointerDown}
      />
    )
  }

  if (!showWordmark) {
    const emblemSize = Math.round(Math.min(Math.max(width * 0.28, 60), 104))
    return (
      <EmblemImage
        variant={variant}
        size={emblemSize}
        className={className}
        onPointerDown={onLogoPointerDown}
      />
    )
  }

  const useFullLockup = !hideTagline
  const lockupKey = stacked ? 'stacked' : 'horizontal'

  if (useFullLockup) {
    return (
      <LockupImage
        src={ASSETS[lockupKey][variant]}
        width={width}
        aspect={ASPECT[lockupKey]}
        className={className}
        onPointerDown={onLogoPointerDown}
      />
    )
  }

  const emblemSize = Math.round(Math.min(Math.max(width * 0.28, 60), 104))

  return (
    <div
      className={cn(
        'inline-flex shrink-0 bg-transparent border-0 shadow-none p-0 m-0',
        stacked ? 'flex-col items-center text-center' : 'flex-row items-center',
        className,
      )}
      style={{ gap: stacked ? '0.75rem' : '1rem', maxWidth: width }}
      role="img"
      aria-label="ChronoWalk"
      onPointerDown={onLogoPointerDown}
      data-cw-debug-logo-tap="1"
    >
      <EmblemImage variant={variant} size={emblemSize} alt="" />
      <WordmarkTitle variant={variant} />
    </div>
  )
}
