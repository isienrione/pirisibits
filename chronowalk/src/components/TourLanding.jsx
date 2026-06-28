import { useEffect, useMemo, useState } from 'react'
import tourHeroFallback from '../assets/tour-hero.svg'
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics'
import { Button, GlassPanel } from './ui'
import OfflineDownloadPanel from './offline/OfflineDownloadPanel'
import TourCatalog, {
  getDefaultSelectableTourId,
  resolveActiveTour,
} from './TourCatalog'

const APP_NAME = 'ChronoWalk'
const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`

const VALUE_PROPOSITION =
  'Walk through Rome with place-aware audio, guided stories, and visual reconstructions of the ancient city.'

function TourLanding({
  singleWaypointId,
  initialTourId,
  ownedTourIds,
  ownsAllTours,
  onPurchaseProduct,
  onStartTour,
}) {
  const [selectedTourId, setSelectedTourId] = useState(
    () => initialTourId ?? getDefaultSelectableTourId(ownedTourIds, ownsAllTours)
  )
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)

  useEffect(() => {
    if (initialTourId && (ownsAllTours || ownedTourIds.includes(initialTourId))) {
      setSelectedTourId(initialTourId)
    }
  }, [initialTourId, ownedTourIds, ownsAllTours])

  const activeTour = useMemo(
    () => resolveActiveTour(selectedTourId, ownedTourIds, ownsAllTours),
    [selectedTourId, ownedTourIds, ownsAllTours]
  )

  const canStart = Boolean(activeTour)

  const handlePurchase = (productId) => {
    const result = onPurchaseProduct(productId)
    if (result?.ok) {
      const unlocked = result.tourIds ?? ownedTourIds
      if (!selectedTourId) {
        setSelectedTourId(getDefaultSelectableTourId(unlocked, ownsAllTours))
      }
    }
  }

  const handleHeroError = () => {
    if (heroSrc !== tourHeroFallback) {
      setHeroSrc(tourHeroFallback)
    }
  }

  if (singleWaypointId) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-warm-white">
      <div className="absolute inset-x-0 top-0 h-[min(52vh,34rem)] sm:h-[min(56vh,36rem)]">
        <img
          src={heroSrc}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-[center_38%]"
          onError={handleHeroError}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-warm-white/10 via-warm-white/35 to-warm-white"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-deep-slate/45 via-deep-slate/5 to-transparent"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-safe pt-safe sm:px-6 lg:max-w-3xl">
        <div className="h-[min(34vh,14rem)] shrink-0 sm:h-[min(38vh,16rem)]" aria-hidden="true" />

        <GlassPanel className="rounded-3xl p-6 shadow-glass-lg sm:p-8 lg:p-10">
          <p className="text-eyebrow uppercase text-terracotta">{APP_NAME}</p>
          <h1 className="mt-3 font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-deep-slate sm:text-4xl">
            Rome walking tours
          </h1>
          <p className="mt-4 text-base leading-relaxed text-soft-slate">{VALUE_PROPOSITION}</p>

          <div className="mt-8">
            <TourCatalog
              selectedTourId={selectedTourId}
              ownedTourIds={ownedTourIds}
              ownsAllTours={ownsAllTours}
              onSelectTour={setSelectedTourId}
              onPurchaseProduct={handlePurchase}
            />
          </div>

          {activeTour ? (
            <div className="mt-8 border-t border-limestone/60 pt-6">
              <p className="text-eyebrow uppercase text-terracotta">Ready to walk</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-deep-slate">
                {activeTour.title}
              </h2>
              <p className="mt-2 text-sm text-soft-slate">
                <span className="font-semibold text-deep-slate">{activeTour.stopIds.length} stops</span>
                <span className="text-limestone"> · </span>
                {activeTour.subtitle}
              </p>

              <Button
                size="lg"
                fullWidth
                className="mt-5"
                onClick={() => {
                  triggerHaptic(HAPTIC_KIND.SUCCESS)
                  onStartTour(activeTour)
                }}
              >
                Start {activeTour.title}
              </Button>

              <div className="mt-5">
                <OfflineDownloadPanel tour={activeTour} compact />
              </div>

              <p className="mt-5 text-center text-[0.7rem] leading-relaxed text-soft-slate/90 sm:text-xs">
                Walk to the first stop to unlock your opening story. Location is used only to guide
                you between landmarks.
              </p>
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border border-limestone/70 bg-sand/40 px-4 py-3 text-sm text-soft-slate">
              Purchase a tour above to begin. Own both routes with the Complete Rome bundle and
              switch between them anytime from this screen.
            </p>
          )}
        </GlassPanel>

        <div className="h-6 shrink-0 sm:h-8" aria-hidden="true" />
      </div>
    </div>
  )
}

export default TourLanding
