import { F } from '../tokens.js'

/** Filter or badge chip — used in D1 Map filters and act badges */
export function Chip({ children, color, active = false, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        padding: '4px 12px',
        border: `1px solid ${active ? color : `${color}55`}`,
        borderRadius: 20,
        background: active ? `${color}20` : 'rgba(247,241,230,0.88)',
        color,
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(6px)',
        fontFamily: F.body,
        transition: 'background 200ms, border-color 200ms',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}
