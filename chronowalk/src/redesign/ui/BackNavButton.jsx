import { ChevronLeft } from 'lucide-react'
import { T, F, withAlpha } from '../tokens.js'

/**
 * Obvious back control — ChevronLeft + contextual label.
 *
 * variant:
 * - fixed: global top-left pill (FlowEscapeButton)
 * - immersive: dark pill on photo backgrounds
 * - inline: muted text link on bone/light surfaces
 */
export default function BackNavButton({
  label = 'Back',
  onClick,
  variant = 'inline',
  className = '',
  fixed = false,
  ...rest
}) {
  const resolvedVariant = fixed ? 'fixed' : variant

  if (resolvedVariant === 'fixed') {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={`cw-back-nav cw-back-nav--fixed ${className}`.trim()}
        style={{
          position: 'fixed',
          top: 'max(8px, env(safe-area-inset-top))',
          left: 'max(8px, env(safe-area-inset-left))',
          zIndex: 120,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          minHeight: 44,
          padding: '8px 14px 8px 10px',
          borderRadius: 999,
          border: `1px solid ${withAlpha(T.warmWhite, '28')}`,
          background: 'rgba(11, 11, 13, 0.82)',
          color: T.warmWhite,
          fontFamily: F.body,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.02em',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
        {...rest}
      >
        <ChevronLeft size={18} strokeWidth={2.25} aria-hidden />
        <span>{label}</span>
      </button>
    )
  }

  if (resolvedVariant === 'immersive') {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={`cw-back-nav cw-back-nav--immersive cw-immersive-hit-back ${className}`.trim()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          minHeight: 44,
          padding: '8px 14px 8px 10px',
          borderRadius: 999,
          border: 'none',
          background: 'rgba(11, 11, 13, 0.72)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: T.warmWhite,
          fontFamily: F.body,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
        {...rest}
      >
        <ChevronLeft size={17} strokeWidth={2.25} aria-hidden />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`cw-back-nav cw-back-nav--inline ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        minHeight: 44,
        padding: '8px 4px',
        margin: '-8px -4px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        color: T.muted,
        fontFamily: F.body,
        fontSize: 13,
        fontWeight: 500,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
      {...rest}
    >
      <ChevronLeft size={16} strokeWidth={2.25} aria-hidden />
      <span>{label}</span>
    </button>
  )
}
