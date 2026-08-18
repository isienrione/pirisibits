import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import { getRomeRankableCatalog, getRegistryItem } from '../../../content/rome/registry.js'
import { canAccessContentId } from '../../contentAccess.js'
import {
  clearGuestSession,
  completeNativeContext,
  recordSavedExperience,
} from '../../guestSession.js'
import { clearLocalAccessState } from '../../accessSession.js'
import { CONTENT_TYPES } from '../../../content/registry/constants.js'
import * as paddle from '../../paddle.js'
import * as trackMod from '../../track.js'
import {
  TIME_FIT_TOLERANCE,
  addContentAnywhere,
  bifurcationOptions,
  clearRouteState,
  completeCurrentItem,
  completeRouteContent,
  composeProposedRoute,
  composeAndSave,
  currentRouteItem,
  endRoute,
  getActiveRoute,
  isMysteryHidden,
  liveItems,
  pathZigzagRatio,
  pauseRoute,
  readRouteState,
  removeAnyRouteItem,
  reorderRouteItems,
  replaceCurrentWith,
  resumeRoute,
  revealMystery,
  sanitizeRouteProps,
  startRoute,
} from '../index.js'
import NativePlanScreen from '../../../redesign/screens/NativePlanScreen.jsx'
import NativeDiscoverHome from '../../../redesign/screens/NativeDiscoverHome.jsx'
import NativeActiveRouteScreen from '../../../redesign/screens/NativeActiveRouteScreen.jsx'
import NativeBestNextScreen from '../../../redesign/screens/NativeBestNextScreen.jsx'
import NativeMysteryScreen from '../../../redesign/screens/NativeMysteryScreen.jsx'
import NativeMapScreen from '../../../redesign/screens/NativeMapScreen.jsx'
import NativeAdjustPlanScreen from '../../../redesign/screens/NativeAdjustPlanScreen.jsx'
import NativeArrivalScreen from '../../../redesign/screens/NativeArrivalScreen.jsx'

vi.spyOn(paddle, 'openPaddleCheckout')
vi.spyOn(trackMod, 'track')

const here = dirname(fileURLToPath(import.meta.url))
const PANTHEON = { lat: 41.89885, lng: 12.47687 }

function context(extra = {}) {
  return completeNativeContext({
    interestIds: ['architecture-design', 'people-everyday'],
    timeBudgetId: '2h',
    traveler: {
      iconicVsHidden: 'mix',
      walkingTolerance: 'moderate',
      transportModes: ['walk'],
      positiveInterestIds: ['architecture-design', 'people-everyday'],
    },
    session: { availableTimeNow: '2h', location: PANTHEON },
    lastPosition: PANTHEON,
    ...extra,
  }).context
}

function renderRoute(path = '/home') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider>
        <Routes>
          <Route path="/plan" element={<NativePlanScreen />} />
          <Route path="/home" element={<NativeDiscoverHome />} />
          <Route path="/route" element={<NativeActiveRouteScreen />} />
          <Route path="/route/adjust" element={<NativeAdjustPlanScreen />} />
          <Route path="/next" element={<NativeBestNextScreen />} />
          <Route path="/mystery/:routeItemId" element={<NativeMysteryScreen />} />
          <Route path="/mystery" element={<NativeMysteryScreen />} />
          <Route path="/map" element={<NativeMapScreen />} />
          <Route path="/arrive" element={<NativeArrivalScreen />} />
          <Route path="/walk" element={<div data-testid="walk-stub">WALK</div>} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  )
}

function composeFromContext(ctx = context()) {
  const catalog = getRomeRankableCatalog()
  return composeProposedRoute({
    context: ctx,
    catalog,
    canAccess: canAccessContentId,
    position: ctx.lastPosition || PANTHEON,
    completedIds: ctx.history?.completedExperienceIds || [],
    dismissedIds: ctx.history?.dismissedExperienceIds || [],
  })
}

describe('T05 adaptive curated route', () => {
  beforeEach(() => {
    localStorage.clear()
    clearLocalAccessState()
    clearGuestSession()
    clearRouteState()
    paddle.openPaddleCheckout.mockClear()
    trackMod.track.mockClear()
  })

  it('creates a ProposedRoute from Travel Context', () => {
    const proposed = composeFromContext()
    expect(proposed?.id).toMatch(/^pr_/)
    expect(proposed.cityId).toBe('rome')
    expect(proposed.items.length).toBeGreaterThanOrEqual(2)
    expect(proposed.contextSnapshot).toBeTruthy()
  })

  it('fits availableTimeNow within tolerance', () => {
    const proposed = composeFromContext()
    expect(proposed.estimatedDurationMin).toBeLessThanOrEqual(120 * TIME_FIT_TOLERANCE + 1)
  })

  it('contains 2–5 items', () => {
    const proposed = composeFromContext()
    expect(proposed.items.length).toBeGreaterThanOrEqual(2)
    expect(proposed.items.length).toBeLessThanOrEqual(5)
  })

  it('does not zig-zag from Pantheon to Appia when nearby centro exists', () => {
    const proposed = composeFromContext()
    const ids = proposed.items.map((item) => item.contentId)
    expect(ids).not.toContain('w22')
    const catalogById = Object.fromEntries(getRomeRankableCatalog().map((item) => [item.id, item]))
    expect(pathZigzagRatio(proposed.items, catalogById)).toBeLessThan(4.5)
  })

  it('may mix Hero and Discovery', () => {
    const proposed = composeFromContext()
    const types = new Set(proposed.items.map((item) => item.contentType))
    expect(types.has(CONTENT_TYPES.HERO)).toBe(true)
    expect(proposed.items.length).toBeGreaterThanOrEqual(2)
  })

  it('starts a free guest route with startable content', () => {
    const proposed = composeFromContext()
    expect(canAccessContentId(proposed.items[0].contentId)).toBe(true)
  })

  it('startRoute persists ActiveRoute', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    const active = startRoute(proposed)
    expect(active.status).toBe('active')
    expect(getActiveRoute()?.proposedRouteId).toBe(proposed.id)
    expect(JSON.parse(localStorage.getItem('cw_route_v1')).active.proposedRouteId).toBe(proposed.id)
  })

  it('ActiveRoute survives reload from localStorage', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    startRoute(proposed)
    const raw = localStorage.getItem('cw_route_v1')
    expect(raw).toBeTruthy()
    const restored = readRouteState()
    expect(restored.active.currentRouteItemId).toBeTruthy()
    expect(restored.active.items.length).toBe(proposed.items.length)
  })

  it('completing an item advances to the default continuation', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    startRoute(proposed)
    const first = currentRouteItem(getActiveRoute())
    completeCurrentItem()
    const next = currentRouteItem(getActiveRoute())
    expect(next.contentId).not.toBe(first.contentId)
    const options = bifurcationOptions({
      active: getActiveRoute(),
      catalog: getRomeRankableCatalog(),
      context: context(),
      position: PANTHEON,
    })
    expect(options.recommended.contentId).toBe(next.contentId)
  })

  it('shows at most two alternatives', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    startRoute(proposed)
    completeCurrentItem()
    const options = bifurcationOptions({
      active: getActiveRoute(),
      catalog: getRomeRankableCatalog(),
      context: context(),
      position: PANTHEON,
    })
    expect(options.alternatives.length).toBeLessThanOrEqual(2)
  })

  it('selecting an alternative mutates the remaining route without left-tour copy', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    startRoute(proposed)
    completeCurrentItem()
    const options = bifurcationOptions({
      active: getActiveRoute(),
      catalog: getRomeRankableCatalog(),
      context: context(),
      position: PANTHEON,
    })
    const alt = options.alternatives[0]
    expect(alt).toBeTruthy()
    const before = currentRouteItem(getActiveRoute()).contentId
    replaceCurrentWith(alt.item)
    expect(currentRouteItem(getActiveRoute()).contentId).toBe(alt.contentId)
    expect(currentRouteItem(getActiveRoute()).contentId).not.toBe(before)
    renderRoute( '/next')
    expect(screen.queryByText(/left the tour/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/left tour/i)).not.toBeInTheDocument()
  })

  it('hides mystery name and image before reveal', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    const mystery = proposed.items.find((item) => item.isMysteryDiscovery) || {
      ...proposed.items[1],
      isMysteryDiscovery: true,
      mysteryPresentation: { hidden: true, revealedEarly: false, revealedAtArrival: false },
      contentId: 'd_rome_27',
      contentType: CONTENT_TYPES.DISCOVERY,
    }
    const items = proposed.items.map((item, index) => (index === 1 ? { ...item, ...mystery, routeItemId: item.routeItemId } : item))
    startRoute({ ...proposed, items })
    const current = getActiveRoute().items[1]
    expect(isMysteryHidden(current)).toBe(true)
    renderRoute( `/mystery/${current.routeItemId}`)
    expect(screen.getByTestId('mystery-card-front')).toBeInTheDocument()
    expect(screen.queryByText(/il facchino/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('mystery-card-front').querySelector('img')).toBeNull()
  })

  it('reveal early exposes identity', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    const base = proposed.items[1]
    const items = proposed.items.map((item, index) =>
      index === 1
        ? {
            ...base,
            contentId: 'd_rome_27',
            contentType: CONTENT_TYPES.DISCOVERY,
            isMysteryDiscovery: true,
            mysteryPresentation: { hidden: true, revealedEarly: false, revealedAtArrival: false },
          }
        : item,
    )
    startRoute({ ...proposed, items })
    const mysteryItem = getActiveRoute().items[1]
    renderRoute( `/mystery/${mysteryItem.routeItemId}`)
    fireEvent.click(screen.getByTestId('mystery-reveal'))
    expect(screen.getByTestId('mystery-card-back')).toBeInTheDocument()
    expect(screen.getByText(/il facchino/i)).toBeInTheDocument()
    expect(getActiveRoute().items[1].mysteryPresentation.revealedEarly).toBe(true)
  })

  it('mystery arrival exposes identity', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    const items = proposed.items.map((item, index) =>
      index === 0
        ? {
            ...item,
            contentId: 'd_rome_27',
            contentType: CONTENT_TYPES.DISCOVERY,
            isMysteryDiscovery: true,
            mysteryPresentation: { hidden: true, revealedEarly: false, revealedAtArrival: false },
          }
        : item,
    )
    startRoute({ ...proposed, items })
    renderRoute( '/arrive')
    expect(screen.getByText(/il facchino/i)).toBeInTheDocument()
    expect(getActiveRoute().items[0].mysteryPresentation.revealedAtArrival).toBe(true)
  })

  it('reorder persists', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    startRoute(proposed)
    const ids = liveItems(getActiveRoute()).map((item) => item.routeItemId).reverse()
    reorderRouteItems(ids)
    expect(liveItems(getActiveRoute()).map((item) => item.routeItemId)).toEqual(ids)
  })

  it('remove persists', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    startRoute(proposed)
    const target = liveItems(getActiveRoute())[1]
    removeAnyRouteItem(target.routeItemId)
    expect(getActiveRoute().items.find((item) => item.routeItemId === target.routeItemId).state).toBe('removed')
  })

  it('add content persists', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    startRoute(proposed)
    addContentAnywhere(getRegistryItem('d_rome_22'))
    expect(liveItems(getActiveRoute()).some((item) => item.contentId === 'd_rome_22')).toBe(true)
  })

  it('pause and resume persist', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    startRoute(proposed)
    pauseRoute()
    expect(getActiveRoute().status).toBe('paused')
    resumeRoute({ position: PANTHEON })
    expect(getActiveRoute().status).toBe('active')
  })

  it('end route stops active guidance', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    startRoute(proposed)
    endRoute()
    expect(getActiveRoute().status).toBe('ended')
    expect(getActiveRoute().currentRouteItemId).toBeNull()
  })

  it('ActiveRoute Hero completion does not force old linear next stop', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    startRoute(proposed)
    const first = currentRouteItem(getActiveRoute())
    completeRouteContent(first.contentId)
    expect(currentRouteItem(getActiveRoute())?.contentId).not.toBe(first.contentId)
    const source = readFileSync(resolve(here, '../../../components/journey/JourneyShell.jsx'), 'utf8')
    expect(source).toContain('completeRouteContent')
    expect(source).toContain('Navigate to="/next"')
  })

  it('standalone Best Next still ranks without an active route', () => {
    context()
    renderRoute( '/next')
    expect(screen.getByTestId('native-best-next')).toBeInTheDocument()
    expect(screen.queryByTestId('native-bifurcation')).not.toBeInTheDocument()
    expect(screen.getByTestId('best-next-primary')).toBeInTheDocument()
  })

  it('map renders the active route', () => {
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    startRoute(proposed)
    renderRoute( '/map')
    expect(screen.getByTestId('map-active-route')).toBeInTheDocument()
    expect(screen.getByTestId(`map-route-marker-${proposed.items[0].contentId}`)).toBeInTheDocument()
  })

  it('saved item can be added via Adjust Plan', () => {
    context()
    recordSavedExperience('w01')
    const proposed = composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    startRoute(proposed)
    renderRoute('/route/adjust')
    fireEvent.click(screen.getByTestId('adjust-add-saved-w01'))
    expect(liveItems(getActiveRoute()).some((item) => item.contentId === 'w01')).toBe(true)
  })

  it('premium item can appear later but cannot start without entitlement', () => {
    const proposed = composeFromContext()
    const locked = proposed.items.filter((item) => !canAccessContentId(item.contentId))
    expect(canAccessContentId(proposed.items[0].contentId)).toBe(true)
    if (locked.length) {
      expect(locked[0].contentId).not.toBe(proposed.items[0].contentId)
      startRoute(proposed)
      const items = getActiveRoute().items.map((item, index) =>
        index === 0 ? { ...locked[0], state: 'active', routeItemId: item.routeItemId } : item,
      )
      localStorage.setItem(
        'cw_route_v1',
        JSON.stringify({ version: 1, proposed, active: { ...getActiveRoute(), items, currentRouteItemId: items[0].routeItemId } }),
      )
      renderRoute( '/arrive')
      fireEvent.click(screen.getByTestId('arrive-start'))
      expect(screen.getByTestId('native-unlock-sheet')).toBeInTheDocument()
      expect(paddle.openPaddleCheckout).not.toHaveBeenCalled()
    }
  })

  it('does not call Paddle', () => {
    renderRoute('/plan')
    expect(paddle.openPaddleCheckout).not.toHaveBeenCalled()
  })

  it('leaves web landing and paid purchase routes intact', () => {
    const router = readFileSync(resolve(here, '../../../app/AppRouter.jsx'), 'utf8')
    expect(router).toContain('path="/"')
    expect(router).toContain('PublicLandingRoute')
    expect(router).toContain('path="/purchase"')
  })

  it('route analytics emit without PII', () => {
    composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    const calls = trackMod.track.mock.calls.filter((call) => String(call[0]).startsWith('route_'))
    expect(calls.length).toBeGreaterThan(0)
    for (const [, props] of calls) {
      expect(props).not.toHaveProperty('email')
      expect(props).not.toHaveProperty('name')
      expect(props).not.toHaveProperty('phone')
    }
    expect(sanitizeRouteProps({ cityId: 'rome', email: 'a@b.c', userId: 'x' })).toEqual({ cityId: 'rome' })
  })

  it('introduces no StoreKit dependency', () => {
    const files = [
      '../index.js',
      '../store.js',
      '../composer.js',
      '../../../redesign/screens/NativePlanScreen.jsx',
      '../../../redesign/screens/NativeActiveRouteScreen.jsx',
      '../../../redesign/screens/NativeBestNextScreen.jsx',
      '../../../redesign/screens/NativeDiscoverHome.jsx',
    ]
    for (const relative of files) {
      const source = readFileSync(resolve(here, relative), 'utf8')
      expect(source).not.toMatch(/storekit|StoreKit/i)
    }
  })

  it('renders Proposed Plan and Active Route surfaces', () => {
    composeAndSave({ context: context(), canAccess: canAccessContentId, position: PANTHEON })
    renderRoute( '/plan')
    expect(screen.getByTestId('native-plan')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('plan-start'))
    expect(screen.getByTestId('native-active-route')).toBeInTheDocument()
  })
})
