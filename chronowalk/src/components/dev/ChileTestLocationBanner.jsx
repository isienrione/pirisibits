import { isChileTestLocations } from '../../config/env.js'
import { getChileTestLocationSummary } from '../../data/testLocationOverrides.js'

/** Visible reminder that Rome geofences are mapped to Santiago test locations. */
export default function ChileTestLocationBanner() {
  if (!isChileTestLocations()) return null

  const lines = getChileTestLocationSummary()

  return (
    <div
      data-testid="chile-test-location-banner"
      role="status"
      style={{
        position: 'fixed',
        top: 'max(8px, env(safe-area-inset-top))',
        left: 'max(8px, env(safe-area-inset-left))',
        right: 'max(8px, env(safe-area-inset-right))',
        zIndex: 65,
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(22, 19, 15, 0.94)',
        border: '1px solid rgba(124, 154, 92, 0.45)',
        color: '#f5efe3',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        lineHeight: 1.4,
        pointerEvents: 'none',
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, letterSpacing: '0.06em', color: '#7c9a5c' }}>
        CHILE GPS TEST — Rome coords substituted
      </p>
      <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}
