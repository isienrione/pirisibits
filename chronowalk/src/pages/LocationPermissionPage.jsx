import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { isDebugGeo } from '../config/env'
import { BronzeButton, Button } from '../components/ui'
import { metaLabel } from '../components/ui/styles'
import { offlineDownloadPath } from '../routes/paths'

const HEADLINE = "We'll know exactly when you've reached each story."

const SUPPORTING_COPY =
  'Each place unlocks the moment you arrive · as if the city recognized you were standing there. That is when history stops feeling distant and starts feeling alive.'

function requestLocationAccess() {
  if (isDebugGeo() || !navigator.geolocation) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(),
      () => resolve(),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  })
}

export default function LocationPermissionPage() {
  const navigate = useNavigate()
  const { destinationId } = useParams()
  const [isRequesting, setIsRequesting] = useState(false)

  const continueToJourney = () => {
    navigate(offlineDownloadPath(destinationId), { replace: true })
  }

  const handleEnable = async () => {
    if (isRequesting) return
    setIsRequesting(true)
    await requestLocationAccess()
    setIsRequesting(false)
    continueToJourney()
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ivory text-deep-slate paper-texture">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 pb-safe pt-safe sm:px-8">
        <p className={metaLabel + ' text-bronze'}>Before you walk</p>

        <h1 className="mt-4 font-display text-[2.5rem] font-semibold leading-[1.02] tracking-tight sm:text-5xl">
          {HEADLINE}
        </h1>

        <p className="mt-6 max-w-md text-lg leading-relaxed text-soft-slate sm:text-xl">
          {SUPPORTING_COPY}
        </p>

        <div className="mt-12 flex flex-col gap-4">
          <BronzeButton size="lg" fullWidth disabled={isRequesting} onClick={handleEnable}>
            {isRequesting ? 'Enabling…' : 'Enable Location'}
          </BronzeButton>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled={isRequesting}
            onClick={continueToJourney}
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  )
}
