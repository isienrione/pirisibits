import { T, F, S } from '../tokens.js'

/**
 * Quiet outline CTA for bone / light surfaces (journey complete, journal actions).
 * Appearance matches the common muted-border full-width secondary used in C8e / F1.
 */
export function SecondaryButton({
  children,
  onClick,
  style,
  disabled = false,
  type = 'button',
  color = T.muted,
  borderColor,
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: S.m,
        background: 'transparent',
        color,
        borderRadius: 12,
        fontFamily: F.body,
        fontWeight: 500,
        fontSize: 14,
        border: `1px solid ${borderColor ?? `${T.muted}33`}`,
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
