import { useEffect, useMemo, useRef, useState } from 'react'
import tourHeroFallback from '../assets/tour-hero.svg'
import { track } from '../analytics/analytics'
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { Button, GlassPanel } from './ui'
import OfflineDownloadPanel from './offline/OfflineDownloadPanel'
import PwaInstallPanel from './PwaInstallPanel'
import TourIntroContent from './TourIntroContent'
import TourCatalog, {
  getDefaultSelectableTourId,
  resolveActiveTour,
} from './TourCatalog'

const APP_NAME = 'ChronoWalk'
const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`

function TourLanding({
  singleWaypointId,
  initialTourId,
  ownedTourIds,
  ownsAllTours,
  onPurchaseProduct,
  onStartTour,
  onTryFreePreview,
}) {
  const hasOwnedTours = ownsAllTours || ownedTourIds.length > 0
  const catalogRef = useRef(null)
  const [selectedTourId, setSelectedTourId] = useState(
    () => initialTourId ?? getDefaultSelectableTourId(ownedTourIds, ownsAllTours)
  )
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)
  const pwaInstall = usePwaInstall()

  useEffect(() => {
    if (initialTourId && (ownsAllTours || ownedTourIds.includes(initialTourId))) {
      setSelectedTourId(initialTourId)
    }
  }, [initialTourId, ownedTourIds, ownsAllTours])

  useEffect(() => {
    track('landing_viewed')
  }, [])

  const activeTour = useMemo(
    () => resolveActiveTour(selectedTourId, ownedTourIds, ownsAllTours),
    [selectedTourId, ownedTourIds, ownsAllTours]
  )

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

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (singleWaypointId) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-warm-white">
      <div
        className={
          hasOwnedTours
            ? 'absolute inset-x-0 top-0 h-[min(52vh,34rem)] sm:h-[min(56vh,36rem)]'
            : 'absolute inset-x-0 top-0 h-[min(58vh,36rem)] sm:h-[min(62vh,38rem)]'
        }
      >
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
        <div
          className={
            hasOwnedTours
              ? 'h-[min(34vh,14rem)] shrink-0 sm:h-[min(38vh,16rem)]'
              : 'h-[min(30vh,12rem)] shrink-0 sm:h-[min(34vh,14rem)]'
          }
          aria-hidden="true"
        />

        <GlassPanel className="rounded-3xl p-6 shadow-glass-lg sm:p-8 lg:p-10" grain>
          {!hasOwnedTours ? (
            <TourIntroContent
              onTryFreePreview={onTryFreePreview}
              onViewTours={scrollToCatalog}
            />
          ) : (
            <>
              <p className="text-eyebrow uppercase text-terracotta">{APP_NAME}</p>
              <h1 className="mt-3 font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-deep-slate sm:text-4xl">
                Your Rome walking tours
              </h1>
              <p className="mt-4 text-base leading-relaxed text-soft-slate">
                Pick up where you left off or switch between your purchased routes.
              </p>
            </>
          )}

          <div
            ref={catalogRef}
            id="tour-catalog"
            className={hasOwnedTours ? 'mt-8' : 'mt-12 border-t border-limestone/60 pt-10'}
          >
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
          ) : !hasOwnedTours ? (
            <p className="mt-8 rounded-2xl border border-limestone/70 bg-sand/40 px-4 py-3 text-sm text-soft-slate">
              Purchase a tour above to begin. The Complete Rome bundle unlocks both routes — walk
              them in an afternoon each or spread across different days.
            </p>
          ) : null}
        </GlassPanel>

        {pwaInstall.showInstallOption || pwaInstall.installed ? (
          <PwaInstallPanel
            className="mt-4 shadow-glass-lg"
            compact
            installed={pwaInstall.installed}
            canPromptInstall={pwaInstall.canPromptInstall}
            showIosInstructions={pwaInstall.showIosInstructions}
            showInstallOption={pwaInstall.showInstallOption}
            onInstall={() => {
              triggerHaptic(HAPTIC_KIND.SOFT_TAP)
              void pwaInstall.promptInstall()
            }}
          />
        ) : null}

        <div className="h-6 shrink-0 sm:h-8" aria-hidden="true" />
      </div>
    </div>
  )
}

export default TourLanding
