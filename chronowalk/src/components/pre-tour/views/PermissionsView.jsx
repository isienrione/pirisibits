import { useState } from 'react'
import { isDebugGeo } from '../../../config/env'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import { BronzeButton, Button, EditorialTitle, GlassPanel } from '../../ui'

function requestLocationAccess() {
  if (isDebugGeo() || !navigator.geolocation) {
    return Promise.resolve('granted')
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      () => resolve('denied'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  })
}

export function PermissionsView({ onContinue }) {
  const [busy, setBusy] = useState(false)

  const handleEnable = async () => {
    setBusy(true)
    triggerHaptic(HAPTIC_KIND.SOFT_TAP)
    await requestLocationAccess()
    setBusy(false)
    onContinue()
  }

  return (
    <GlassPanel className="rounded-3xl p-6 shadow-plaque-lg sm:p-8" grain>
      <EditorialTitle
        eyebrow="Before you walk"
        size="md"
        subtitle="ChronoWalk uses your location only to detect when you arrive at each landmark and to guide you along the route. We never track you in the background when the tour is closed."
      >
        Enable location for GPS guidance
      </EditorialTitle>

      <ul className="mt-6 space-y-3 text-sm text-soft-slate">
        <li>Arrival stories unlock when you reach each stop</li>
        <li>Walking directions stay in sync with your position</li>
        <li>You can change this anytime in Settings</li>
      </ul>

      <div className="mt-8 flex flex-col gap-3">
        <BronzeButton size="lg" fullWidth disabled={busy} onClick={handleEnable}>
          {busy ? 'Requesting access…' : 'Enable location & continue'}
        </BronzeButton>
        <Button
          variant="text"
          fullWidth
          onClick={() => {
            triggerHaptic(HAPTIC_KIND.SOFT_TAP)
            onContinue()
          }}
        >
          Continue without enabling
        </Button>
      </div>
    </GlassPanel>
  )
}

export default PermissionsView
