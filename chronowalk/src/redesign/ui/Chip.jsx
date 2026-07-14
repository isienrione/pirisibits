import { TYPE } from '../typography.js'

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
        ...TYPE.chip,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(6px)',
        transition: 'background var(--d-ui, 200ms) var(--ease-enter), border-color var(--d-ui, 200ms) var(--ease-enter)',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}
