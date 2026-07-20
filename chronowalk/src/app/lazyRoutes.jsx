import { Suspense } from 'react'
import { lazyWithRecovery } from '../utils/lazyWithRecovery.js'

function BootLoadingFallback() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem 1.5rem',
        background: '#16130f',
        color: '#f5efe3',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.5 }}>Loading ChronoWalk…</p>
    </main>
  )
}

function lazyRoute(importFn, label) {
  const LazyComponent = lazyWithRecovery(importFn, label)

  return function LazyRoute(props) {
    return (
      <Suspense fallback={<BootLoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

export const LazyWaypointPreviewPage = lazyRoute(
  () => import('../redesign/pages/RedesignWaypointPreviewPage.jsx'),
  'waypoint preview',
)

export const LazyColosseumPreviewPage = lazyRoute(
  () => import('../redesign/pages/RedesignColosseumPreviewPage.jsx'),
  'colosseum preview',
)

export const LazyPreviewPage = lazyRoute(
  () => import('../redesign/pages/RedesignPreviewPage.jsx'),
  'preview',
)

export const LazySetupPage = lazyRoute(
  () => import('../redesign/pages/RedesignSetupPage.jsx'),
  'setup',
)

export const LazyAccessConfirmedPage = lazyRoute(
  () => import('../redesign/pages/RedesignAccessConfirmedPage.jsx'),
  'access confirmed',
)

export const LazyNoTicketPage = lazyRoute(
  () => import('../redesign/pages/RedesignNoTicketPage.jsx'),
  'no ticket',
)

export const LazyWelcomePage = lazyRoute(
  () => import('../redesign/pages/RedesignWelcomePage.jsx'),
  'welcome',
)

export const LazyBeginPage = lazyRoute(
  () => import('./pages/BeginPage.jsx').then((m) => ({ default: m.BeginPage })),
  'begin',
)

export const LazyTourPage = lazyRoute(
  () => import('../redesign/pages/RedesignTourPage.jsx'),
  'tour',
)

export const LazyLandingPage = lazyRoute(
  () => import('../landing/ChronoWalkLanding.jsx'),
  'landing',
)

export const LazyJourneyPage = lazyRoute(
  () => import('../redesign/pages/RedesignJourneyPage.jsx'),
  'journey',
)

export const LazyMapPage = lazyRoute(
  () => import('../redesign/pages/RedesignMapPage.jsx'),
  'map',
)

export const LazyStopsPage = lazyRoute(
  () => import('../redesign/pages/RedesignStopsPage.jsx'),
  'stops',
)

export const LazyJournalPage = lazyRoute(
  () => import('../redesign/pages/RedesignJournalPage.jsx'),
  'journal',
)

export const LazyMemoryDetailPage = lazyRoute(
  () => import('../redesign/pages/RedesignMemoryDetailPage.jsx'),
  'memory detail',
)

export const LazyLetterPage = lazyRoute(
  () => import('../redesign/pages/RedesignLetterPage.jsx'),
  'letter',
)

export const LazySettingsPage = lazyRoute(
  () => import('../redesign/pages/RedesignSettingsPage.jsx'),
  'settings',
)

export const LazyCreditsPage = lazyRoute(
  () => import('../redesign/pages/RedesignCreditsPage.jsx'),
  'credits',
)

export const LazyAccessPage = lazyRoute(
  () => import('./pages/AccessPage.jsx').then((m) => ({ default: m.AccessPage })),
  'access',
)
