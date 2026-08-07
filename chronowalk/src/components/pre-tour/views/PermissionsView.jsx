import { useState } from 'react'
import { enableLocationForTour } from '../../../lib/locationAccess'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import { Button, EditorialTitle } from '../../ui'

export function PermissionsView({ onContinue }) {
  const [busy, setBusy] = useState(false)

  const handleEnable = async () => {
    setBusy(true)
    triggerHaptic(HAPTIC_KIND.SOFT_TAP)
    try {
      await enableLocationForTour({
        waitForFix: false,
        skipIfDeniedAlready: false,
      })
    } finally {
      setBusy(false)
      onContinue()
    }
  }

  return (
    <div className="bg-ink900 rounded-card rounded-3xl p-6  sm:p-8">
      <EditorialTitle
        eyebrow="Before you walk"
        size="md"
        subtitle="ChronoWalk uses your location only to detect when you arrive at each landmark and to guide you along the route. We never track you in the background when the tour is closed."
      >
        Enable location for GPS guidance
      </EditorialTitle>

      <ul className="mt-6 space-y-3 text-sm text-muted">
        <li>Arrival stories unlock when you reach each stop</li>
        <li>Walking directions stay in sync with your position</li>
        <li>You can change this anytime in Settings</li>
      </ul>

      <div className="mt-8 flex flex-col gap-3">
        <Button size="lg" fullWidth disabled={busy} onClick={handleEnable}>
          {busy ? 'Requesting access…' : 'Enable location & continue'}
        </Button>
        <Button
          variant="ghost"
          fullWidth
          disabled={busy}
          onClick={() => {
            triggerHaptic(HAPTIC_KIND.SOFT_TAP)
            onContinue()
          }}
        >
          Continue without enabling
        </Button>
      </div>
    </div>
  )
}

export default PermissionsView
