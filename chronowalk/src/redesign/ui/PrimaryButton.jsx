import { T, F, S } from '../tokens.js'

export function PrimaryButton({ children, onClick, color = T.terracotta, textColor, style, disabled = false }) {
  const fg =
    textColor ??
    (color === T.gold || color === T.ember || color === T.terracotta || color === T.actI
      ? T.obsidian
      : T.warmWhite)
  return (
    <button
      type="button"
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
        boxShadow: `0 0 22px ${color}55`,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
