import { T, F } from '../tokens.js'

/**
 * Low-emphasis text action (Route, Start from here, Edit stops, Skip).
 */
export function TextButton({
  children,
  onClick,
  style,
  disabled = false,
  type = 'button',
  underline = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 13,
        color: disabled ? `${T.muted}88` : T.muted,
        background: 'none',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: F.body,
        padding: 0,
        textDecoration: underline ? 'underline' : 'none',
        textUnderlineOffset: underline ? 3 : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
