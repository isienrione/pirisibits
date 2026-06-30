import { useCallback, useEffect, useMemo, useState } from 'react'
import { getTourProduct } from '../../data/tourProducts'
import { getDefaultSelectableTourId } from '../TourCatalog'
import { getInitialPreTourScreen, PRE_TOUR_SCREENS } from './preTourConfig'
import PreTourScreenShell from './PreTourScreenShell'
import { resolveTourIdForProduct } from './catalogUtils'
import BeginJourneyView from './views/BeginJourneyView'
import CatalogView from './views/CatalogView'
import FreePreviewView from './views/FreePreviewView'
import OwnedHomeView from './views/OwnedHomeView'
import PermissionsView from './views/PermissionsView'
import PwaInstallView from './views/PwaInstallView'
import TourDetailView from './views/TourDetailView'
import WelcomeView from './views/WelcomeView'

const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`

const HERO_SCREENS = new Set([PRE_TOUR_SCREENS.WELCOME, PRE_TOUR_SCREENS.OWNED_HOME])

export function PreTourFlow({
  initialTourId,
  ownedTourIds,
  ownsAllTours,
  onPurchaseProduct,
  onStartTour,
  onTryFreePreview,
}) {
  const hasOwnedTours = ownsAllTours || ownedTourIds.length > 0
  const [screenStack, setScreenStack] = useState(() => [getInitialPreTourScreen(hasOwnedTours)])
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [selectedTourId, setSelectedTourId] = useState(
    () => initialTourId ?? getDefaultSelectableTourId(ownedTourIds, ownsAllTours)
  )
  const [pendingLaunch, setPendingLaunch] = useState(null)
  const [beginJourneyTourId, setBeginJourneyTourId] = useState(null)
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)

  const currentScreen = screenStack[screenStack.length - 1]
  const canGoBack = screenStack.length > 1

  useEffect(() => {
    if (initialTourId && (ownsAllTours || ownedTourIds.includes(initialTourId))) {
      setSelectedTourId(initialTourId)
    }
  }, [initialTourId, ownedTourIds, ownsAllTours])

  const pushScreen = useCallback((screen) => {
    setScreenStack((stack) => [...stack, screen])
  }, [])

  const popScreen = useCallback(() => {
    setScreenStack((stack) => {
      if (stack.length <= 1) return stack
      const leaving = stack[stack.length - 1]
      if (leaving === PRE_TOUR_SCREENS.PERMISSIONS) {
        setPendingLaunch(null)
      }
      return stack.slice(0, -1)
    })
  }, [])

  const goToPermissions = useCallback((launch) => {
    setPendingLaunch(launch)
    pushScreen(PRE_TOUR_SCREENS.PERMISSIONS)
  }, [pushScreen])

  const completePermissions = useCallback(() => {
    if (pendingLaunch?.type === 'freePreview') {
      onTryFreePreview()
    } else if (pendingLaunch?.type === 'tour' && pendingLaunch.tour) {
      onStartTour(pendingLaunch.tour)
    }
    setPendingLaunch(null)
  }, [onStartTour, onTryFreePreview, pendingLaunch])

  const openProductDetail = useCallback(
    (productId) => {
      setSelectedProductId(productId)
      pushScreen(PRE_TOUR_SCREENS.TOUR_DETAIL)
    },
    [pushScreen]
  )

  const beginJourneyForProduct = useCallback(
    (productId) => {
      const product = getTourProduct(productId)
      const tourId = resolveTourIdForProduct(product)
      if (tourId) {
        setSelectedTourId(tourId)
        setBeginJourneyTourId(tourId)
      }
      pushScreen(PRE_TOUR_SCREENS.BEGIN_JOURNEY)
    },
    [pushScreen]
  )

  const beginJourneyForTour = useCallback(
    (tourId) => {
      setSelectedTourId(tourId)
      setBeginJourneyTourId(tourId)
      pushScreen(PRE_TOUR_SCREENS.BEGIN_JOURNEY)
    },
    [pushScreen]
  )

  const launchFreePreview = useCallback(() => {
    goToPermissions({ type: 'freePreview' })
  }, [goToPermissions])

  const launchTour = useCallback(
    (tour) => {
      goToPermissions({ type: 'tour', tour })
    },
    [goToPermissions]
  )

  const handlePurchase = useCallback(
    (productId) => onPurchaseProduct(productId),
    [onPurchaseProduct]
  )

  const showHero = HERO_SCREENS.has(currentScreen)
  const isCinematicScreen = currentScreen === PRE_TOUR_SCREENS.BEGIN_JOURNEY

  const screenContent = useMemo(() => {
    switch (currentScreen) {
      case PRE_TOUR_SCREENS.WELCOME:
        return (
          <WelcomeView
            onBrowseTours={() => pushScreen(PRE_TOUR_SCREENS.CATALOG)}
            onTryFreePreview={() => pushScreen(PRE_TOUR_SCREENS.FREE_PREVIEW)}
            onPwaInstall={() => pushScreen(PRE_TOUR_SCREENS.PWA_INSTALL)}
          />
        )

      case PRE_TOUR_SCREENS.CATALOG:
        return (
          <CatalogView
            ownedTourIds={ownedTourIds}
            ownsAllTours={ownsAllTours}
            onOpenProduct={openProductDetail}
            onTryFreePreview={() => pushScreen(PRE_TOUR_SCREENS.FREE_PREVIEW)}
          />
        )

      case PRE_TOUR_SCREENS.TOUR_DETAIL:
        return (
          <TourDetailView
            productId={selectedProductId}
            ownedTourIds={ownedTourIds}
            ownsAllTours={ownsAllTours}
            onPurchase={handlePurchase}
            onBeginJourney={beginJourneyForProduct}
            onTryFreePreview={() => pushScreen(PRE_TOUR_SCREENS.FREE_PREVIEW)}
          />
        )

      case PRE_TOUR_SCREENS.FREE_PREVIEW:
        return (
          <FreePreviewView
            onStartPreview={launchFreePreview}
            onBrowseTours={() => pushScreen(PRE_TOUR_SCREENS.CATALOG)}
          />
        )

      case PRE_TOUR_SCREENS.PWA_INSTALL:
        return <PwaInstallView />

      case PRE_TOUR_SCREENS.OWNED_HOME:
        return (
          <OwnedHomeView
            ownedTourIds={ownedTourIds}
            ownsAllTours={ownsAllTours}
            selectedTourId={selectedTourId}
            onSelectTour={setSelectedTourId}
            onBeginJourney={beginJourneyForTour}
            onTryFreePreview={() => pushScreen(PRE_TOUR_SCREENS.FREE_PREVIEW)}
            onBrowseTours={() => pushScreen(PRE_TOUR_SCREENS.CATALOG)}
          />
        )

      case PRE_TOUR_SCREENS.BEGIN_JOURNEY:
        return null

      case PRE_TOUR_SCREENS.PERMISSIONS:
        return <PermissionsView onContinue={completePermissions} />

      default:
        return null
    }
  }, [
    beginJourneyForProduct,
    beginJourneyForTour,
    completePermissions,
    currentScreen,
    handlePurchase,
    launchFreePreview,
    launchTour,
    openProductDetail,
    ownedTourIds,
    ownsAllTours,
    pushScreen,
    selectedProductId,
    beginJourneyTourId,
    selectedTourId,
  ])

  if (isCinematicScreen) {
    return (
      <BeginJourneyView
        tourId={beginJourneyTourId ?? selectedTourId}
        onStartJourney={(tour) => launchTour(tour)}
        onBack={canGoBack ? popScreen : undefined}
      />
    )
  }

  return (
    <PreTourScreenShell
      showHero={showHero}
      heroSrc={heroSrc}
      onHeroError={setHeroSrc}
      canGoBack={canGoBack}
      onBack={popScreen}
    >
      {screenContent}
    </PreTourScreenShell>
  )
}

export { getDefaultSelectableTourId, resolveActiveTour } from '../TourCatalog'

export default PreTourFlow
