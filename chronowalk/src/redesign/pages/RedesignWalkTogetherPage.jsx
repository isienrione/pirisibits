import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import WalkTogetherPanel from '../ui/WalkTogetherPanel.jsx'
import { T, F } from '../tokens.js'

/**
 * Persistent Couple/Family management screen — reachable after onboarding.
 * Back returns to the previous screen (typically Settings).
 */
export default function RedesignWalkTogetherPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/begin', { replace: true })
  }

  return (
    <RedesignRouteShell>
      <div
        className="redesign-app-shell cw-grain"
        style={{
          minHeight: '100dvh',
          background: T.bone,
          color: T.ink,
          fontFamily: F.body,
          padding:
            'max(16px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom))',
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back to Settings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: T.muted,
            fontFamily: F.body,
            fontSize: 13,
            padding: '8px 0',
            minHeight: 44,
          }}
        >
          <ChevronLeft size={16} aria-hidden /> Settings
        </button>

        <div style={{ marginTop: 8, maxWidth: 520 }}>
          <WalkTogetherPanel variant="settings" />
        </div>
      </div>
    </RedesignRouteShell>
  )
}
