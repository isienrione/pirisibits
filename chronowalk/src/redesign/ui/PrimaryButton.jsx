import { T, S } from '../tokens.js'
import { TYPE } from '../typography.js'

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
  type = 'button',
  className = '',
  ...rest
}) {
  const fg =
    textColor ??
    (color === T.gold || color === T.ember || color === T.terracotta || color === T.actI
      ? T.obsidian
      : T.warmWhite)
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={['cw-motion-pressable', className].filter(Boolean).join(' ')}
      style={{
        width: '100%',
        padding: S.m,
        background: color,
        color: fg,
        borderRadius: 12,
        ...TYPE.button,
        border: 'none',
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        boxShadow: glow ? `0 0 22px ${color}55` : 'none',
        transition:
          'opacity var(--d-feedback, 220ms) var(--ease-pressure), transform var(--d-micro, 160ms) var(--ease-pressure)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
