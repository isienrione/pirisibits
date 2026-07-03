import { Link, useLocation } from 'react-router-dom'
import { useJourney } from '../../hooks/useJourney.js'
import { JOURNEY_STATES } from '../../state/journey.js'

const LINKS = [
  { to: '/journey', label: 'Walk' },
  { to: '/map', label: 'Map' },
  { to: '/journal', label: 'Journal' },
  { to: '/letter', label: 'Letter' },
]

export default function CompanionDock() {
  const { state } = useJourney()
  const location = useLocation()

  if (state === JOURNEY_STATES.IDLE) return null

  const onCompanionRoute = LINKS.some((link) => location.pathname === link.to)
  if (!onCompanionRoute) return null

  return (
    <nav
      aria-label="Companion navigation"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 'max(12px, env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        zIndex: 60,
        display: 'flex',
        gap: 6,
        padding: 6,
        borderRadius: 999,
        background: 'color-mix(in srgb, var(--ink) 90%, transparent)',
        border: '1px solid color-mix(in srgb, var(--warm-white) 12%, transparent)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {LINKS.map((link) => {
        const active = location.pathname === link.to

        return (
          <Link
            key={link.to}
            to={link.to}
            style={{
              padding: '8px 12px',
              borderRadius: 999,
              textDecoration: 'none',
              fontSize: 'var(--fs-meta)',
              fontWeight: 600,
              color: active ? 'var(--bone)' : 'var(--muted-warm)',
              background: active
                ? 'color-mix(in srgb, var(--accent) 88%, transparent)'
                : 'transparent',
            }}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
