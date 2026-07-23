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
        className="redesign-app-shell cw-grain"
        data-testid="walk-together-page"
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
          onClick={handleBackToSettings}
          aria-label="Back to Settings"
          data-testid="walk-together-back-settings"
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
            fontWeight: 500,
            padding: '8px 0',
            minHeight: 44,
          }}
        >
          <ChevronLeft size={16} aria-hidden /> Back to Settings
        </button>

        <div style={{ marginTop: 8, maxWidth: 520 }}>
          <WalkTogetherPanel
            variant="settings"
            showContinue
            onContinue={handleContinueToWalk}
          />
        </div>
      </div>
    </RedesignRouteShell>
  )
}
