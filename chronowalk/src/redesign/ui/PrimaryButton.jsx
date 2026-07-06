import { T, F } from '../tokens.js'

export function PrimaryButton({ children, onClick, color = T.ember, textColor, style, disabled = false }) {
  const fg = textColor ?? (color === T.ember ? T.obsidian : T.warmWhite)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '15px',
        background: color,
        color: fg,
        borderRadius: 12,
        fontFamily: F.body,
        fontWeight: 600,
        fontSize: 15,
        border: 'none',
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        boxShadow: `0 0 22px ${color}55`,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
