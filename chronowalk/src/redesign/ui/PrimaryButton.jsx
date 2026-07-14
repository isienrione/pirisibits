import { T, F, S } from '../tokens.js'

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
      style={{
        width: '100%',
        padding: S.m,
        background: color,
        color: fg,
        borderRadius: 12,
        fontFamily: F.body,
        fontWeight: 600,
        fontSize: 15,
        border: 'none',
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        boxShadow: glow ? `0 0 22px ${color}55` : 'none',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
