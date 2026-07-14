import { T, F, S } from '../tokens.js'

export function GhostButton({ children, onClick, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: `${S.m} ${S.l}`,
        border: `1.5px solid rgba(245,239,227,0.25)`,
        color: T.warmWhite,
        borderRadius: 12,
        fontFamily: F.body,
        fontSize: 15,
        background: 'rgba(11,11,13,0.35)',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
