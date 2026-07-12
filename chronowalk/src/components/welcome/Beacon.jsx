import { useReducedMotion } from '../../hooks/useReducedMotion'

export function Beacon({ className = '' }) {
  const reducedMotion = useReducedMotion()

  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 11,
        height: 11,
        borderRadius: '50%',
        background: 'var(--ember)',
        boxShadow: '0 0 12px var(--ember-glow)',
        animation: reducedMotion ? undefined : 'welcome-beacon 4s ease-in-out infinite',
      }}
    />
  )
}
