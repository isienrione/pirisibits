import { Suspense } from 'react'
import { lazyWithRecovery } from '../utils/lazyWithRecovery.js'

function lazyRoute(importFn, label) {
  const LazyComponent = lazyWithRecovery(importFn, label)

  return function LazyRoute(props) {
    return (
      <Suspense fallback={null}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

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

export const LazyJourneyPage = lazyRoute(
  () => import('./pages/PlaceholderPages.jsx').then((m) => ({ default: m.JourneyPage })),
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
