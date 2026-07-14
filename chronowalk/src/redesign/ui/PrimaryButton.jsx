import { T, S, R, TAP } from '../tokens.js'
import { TYPE } from '../typography.js'

const PRESS =
  'opacity var(--d-feedback, 220ms) var(--ease-pressure), transform var(--d-micro, 160ms) var(--ease-pressure)'

/**
 * Primary full-width CTA — shared across begin, journey, and shell footers.
 * Default glow matches setup/cinematic screens; pass glow={false} for quieter shell CTAs.
 */
export function PrimaryButton({
  children,
  onClick,
  color = T.terracotta,
  textColor,
  style,
  disabled = false,
  glow = true,
  busy = false,
  type = 'button',
  className = '',
  ...rest
}) {
  const fg =
    textColor ??
    (color === T.gold || color === T.ember || color === T.terracotta || color === T.actI
      ? T.obsidian
      : T.warmWhite)
  const inert = disabled || busy
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={inert}
      className={['cw-motion-pressable', className].filter(Boolean).join(' ')}
      style={{
        width: '100%',
        minHeight: TAP.min,
        padding: `${S.m} ${S.l}`,
        background: color,
        color: fg,
        borderRadius: R.control,
        ...TYPE.button,
        border: 'none',
        cursor: busy ? 'wait' : inert ? 'not-allowed' : 'pointer',
        opacity: inert ? 0.55 : 1,
        boxShadow: glow && !inert ? `0 8px 28px ${color}40, 0 0 0 1px ${color}22` : 'none',
        transition: PRESS,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
