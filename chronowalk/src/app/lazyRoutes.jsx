import { Suspense } from 'react'
import ChronoWalkLanding from '../landing/ChronoWalkLanding.jsx'
import RedesignPreviewPage from '../redesign/pages/RedesignPreviewPage.jsx'
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
      <div>
        <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.5 }}>Loading ChronoWalk…</p>
        <p style={{ margin: '16px 0 0', fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.75 }}>
          Taking too long?{' '}
          <a href="/rome/reset-shell?force=1" style={{ color: 'inherit' }}>
            Refresh the app shell
          </a>
          {' '}
          - access stays on this device.
        </p>
      </div>
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

/**
 * Eager: free Pantheon /preview is a primary marketing CTA ("Try free").
 * A second hashed chunk can be poisoned by Cloudflare SPA HTML under /assets/*
 * (Safari: `'text/html' is not a valid JavaScript MIME type`).
 */
export function LazyPreviewPage(props) {
  return <RedesignPreviewPage {...props} />
}

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

export const LazyHomePage = lazyRoute(
  () => import('../redesign/pages/RedesignHomePage.jsx'),
  'home',
)

/** Eager: landing must not depend on a second hashed chunk Safari can poison. */
export function LazyLandingPage(props) {
  return <ChronoWalkLanding {...props} />
}

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

export const LazyContextPage = lazyRoute(
  () => import('../redesign/pages/NativeContextPage.jsx'),
  'context',
)

export const LazyExperiencePage = lazyRoute(
  () => import('../redesign/pages/NativeExperiencePage.jsx'),
  'experience',
)

export const LazyExplorePage = lazyRoute(
  () => import('../redesign/pages/NativeExplorePage.jsx'),
  'explore',
)

export const LazyDiscoveryPage = lazyRoute(
  () => import('../redesign/pages/NativeDiscoveryPage.jsx'),
  'discovery',
)

export const LazyBestNextPage = lazyRoute(
  () => import('../redesign/pages/NativeBestNextPage.jsx'),
  'best next',
)

export const LazyPlanPage = lazyRoute(
  () => import('../redesign/pages/NativePlanPage.jsx'),
  'plan',
)

export const LazyActiveRoutePage = lazyRoute(
  () => import('../redesign/pages/NativeActiveRoutePage.jsx'),
  'active route',
)

export const LazyWalkPage = lazyRoute(
  () => import('../redesign/pages/NativeWalkPage.jsx'),
  'walk',
)

export const LazyArrivalPage = lazyRoute(
  () => import('../redesign/pages/NativeArrivalPage.jsx'),
  'arrive',
)

export const LazyAdjustPlanPage = lazyRoute(
  () => import('../redesign/pages/NativeAdjustPlanPage.jsx'),
  'adjust plan',
)

export const LazyMysteryPage = lazyRoute(
  () => import('../redesign/pages/NativeMysteryPage.jsx'),
  'mystery',
)

export const LazyWalkTogetherPage = lazyRoute(
  () => import('../redesign/pages/RedesignWalkTogetherPage.jsx'),
  'walk together',
)

export const LazyCreditsPage = lazyRoute(
  () => import('../redesign/pages/RedesignCreditsPage.jsx'),
  'credits',
)

export const LazyAccessPage = lazyRoute(
  () => import('./pages/AccessPage.jsx').then((m) => ({ default: m.AccessPage })),
  'access',
)

export const LazyInvitePage = lazyRoute(
  () => import('./pages/InvitePage.jsx').then((m) => ({ default: m.InvitePage })),
  'invite',
)

export const LazyPurchaseFlowPage = lazyRoute(
  () => import('./pages/PurchaseFlowPage.jsx').then((m) => ({ default: m.PurchaseFlowPage })),
  'purchase',
)

export const LazyLegalTermsPage = lazyRoute(
  () => import('./pages/legal/LegalTermsPage.jsx'),
  'legal terms',
)

export const LazyLegalPrivacyPage = lazyRoute(
  () => import('./pages/legal/LegalPrivacyPage.jsx'),
  'legal privacy',
)

export const LazyLegalRefundPage = lazyRoute(
  () => import('./pages/legal/LegalRefundPage.jsx'),
  'legal refund',
)

export const LazyContactPage = lazyRoute(
  () => import('./pages/ContactPage.jsx'),
  'contact',
)

export const LazyFreePantheonPage = lazyRoute(
  () => import('../landing/acquisition/FreePantheonPage.jsx'),
  'free pantheon',
)

export const LazyAncientRomePage = lazyRoute(
  () => import('../landing/acquisition/AncientRomePage.jsx'),
  'ancient rome',
)

export const LazyHowItWorksPage = lazyRoute(
  () => import('../landing/acquisition/HowItWorksPage.jsx'),
  'how it works',
)
