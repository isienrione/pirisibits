import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGeoLocation } from '../hooks/useGeoLocation'
import { loadRomeTourManifest } from '../content/romeTourManifest'
import { beginLaunchTour } from '../state/launchJourney'
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics'
import LocationRequestPanel from '../components/journey/LocationRequestPanel'
import { Button, GoldButton } from '../components/ui'
import { ROUTES } from '../routes/paths'
import { FREE_PREVIEW_ANCIENT_POSTER } from '../data/freePreview'

export default function BeginJourneyPage() {
  const navigate = useNavigate()
  const manifest = useMemo(() => loadRomeTourManifest(), [])
  const firstStop = manifest.stops[0]
  const [locationRequested, setLocationRequested] = useState(false)

  const { locationStatus, retryLocation } = useGeoLocation({
    target: firstStop?.coords,
    geofenceThresholdM: firstStop?.radiusM ?? 30,
  })

  const requestLocation = useCallback(() => {
    setLocationRequested(true)
    retryLocation()
  }, [retryLocation])

  const startTour = useCallback(
    (fromCurrentLocation = false) => {
      triggerHaptic(HAPTIC_KIND.SUCCESS)
      beginLaunchTour(manifest, { stopId: firstStop?.id })
      navigate(ROUTES.journey, { replace: true, state: { fromCurrentLocation } })
    },
    [firstStop?.id, manifest, navigate]
  )

  const effectiveStatus = locationRequested ? locationStatus : null

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-obsidian via-[#242424] to-obsidian text-ivory">
      <div className="absolute inset-x-0 top-0 h-56 overflow-hidden opacity-80">
        <img
          src={FREE_PREVIEW_ANCIENT_POSTER}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-obsidian" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col px-6 pb-safe pt-safe">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 self-start text-ivory/70"
          onClick={() => navigate(ROUTES.landing)}
        >
          ← Back
        </Button>

        <div className="mt-8 flex flex-1 flex-col justify-center">
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Rome is ready when you are.
          </h1>
          <p className="mt-3 font-display text-lg italic text-gold">
            {firstStop?.shortTitle ?? 'Colosseum'}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ivory/75">
            {manifest.stops.length} places · about 2 days · yours forever
          </p>

          <LocationRequestPanel
            className="mt-6"
            status={effectiveStatus}
            onRequest={requestLocation}
            onRetry={retryLocation}
          />

          <div className="mt-8 flex flex-col gap-3">
            <GoldButton fullWidth showArrow onClick={() => startTour(false)}>
              Start tour
            </GoldButton>
            <Button
              variant="outline-dark"
              size="lg"
              fullWidth
              onClick={() => {
                requestLocation()
                startTour(true)
              }}
            >
              Start from where I am
            </Button>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-ivory/55">
            We use your location only while the tour is active to guide you between landmarks.
          </p>
        </div>
      </div>
    </div>
  )
}
