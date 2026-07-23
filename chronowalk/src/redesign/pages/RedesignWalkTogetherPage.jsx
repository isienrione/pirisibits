import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getActiveWalkPath } from '../../lib/appEntry.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import WalkTogetherPanel from '../ui/WalkTogetherPanel.jsx'
import { T, F } from '../tokens.js'

/**
 * Persistent Couple/Family management screen — reachable after onboarding.
 * Primary action returns to the active walk; secondary returns to Settings.
 */
export default function RedesignWalkTogetherPage() {
  const navigate = useNavigate()

  const handleBackToSettings = () => {
    // `/settings` opens the shared sheet via SettingsSheetProvider, then returns
    // to the prior route (or a safe fallback). Avoids relying on browser history alone.
    navigate('/settings')
  }

  const handleContinueToWalk = () => {
    navigate(getActiveWalkPath())
  }

  return (
    <RedesignRouteShell>
      <div
        className="redesign-app-shell cw-grain cw-walk-together-page"
        data-testid="walk-together-page"
        style={{
          minHeight: '100dvh',
          background: T.bone,
          color: T.ink,
          fontFamily: F.body,
          padding:
            'max(16px, env(safe-area-inset-top)) max(18px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left))',
        }}
      >
        <div
          className="cw-walk-together-page__column"
          style={{
            width: '100%',
            maxWidth: 840,
            margin: '0 auto',
          }}
        >
          <button
            type="button"
            onClick={handleBackToSettings}
            aria-label="Back to Settings"
            data-testid="walk-together-back-settings"
            className="cw-walk-together-page__back"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: T.ink,
              fontFamily: F.body,
              fontSize: 14,
              fontWeight: 600,
              padding: '8px 0',
              minHeight: 44,
            }}
          >
            <ChevronLeft size={16} aria-hidden /> Back to Settings
          </button>

          <div style={{ marginTop: 10 }}>
            <WalkTogetherPanel
              variant="settings"
              showContinue
              onContinue={handleContinueToWalk}
            />
          </div>
        </div>
      </div>
    </RedesignRouteShell>
  )
}
