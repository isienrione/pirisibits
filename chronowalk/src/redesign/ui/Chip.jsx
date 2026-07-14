import { R } from '../tokens.js'
import { TYPE } from '../typography.js'

/** Filter or badge chip — used in D1 Map filters and act badges */
export function Chip({ children, color, active = false, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="cw-motion-pressable"
      style={{
        minHeight: 36,
        padding: '6px 14px',
        border: `1px solid ${active ? color : `${color}55`}`,
        borderRadius: R.control,
        background: active ? `${color}20` : 'color-mix(in srgb, var(--bone, #f7f1e6) 88%, transparent)',
        color,
        ...TYPE.chip,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(6px)',
        transition:
          'background var(--d-ui, 200ms) var(--ease-enter), border-color var(--d-ui, 200ms) var(--ease-enter), transform var(--d-micro, 160ms) var(--ease-pressure)',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}
