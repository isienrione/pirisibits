import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider.jsx'
import { getRomeRankableCatalog, getRomeRegistry, getRegistryItem } from '../../content/rome/registry.js'
import { consumerExperienceIdFor } from '../../content/rome/consumerHeroes.js'
import { resolveContentMedia } from '../../content/registry/media.js'
import { canAccessContentId } from '../contentAccess.js'
import {
  clearGuestSession,
  completeNativeContext,
  completeCurrentNativeOnboarding,
  GUEST_SESSION_KEY,
  hasCompletedGuestOnboarding,
  startNativeGuestExploration,
} from '../guestSession.js'
import { travelerFacingDistanceM, isPlausibleRomePosition } from '../geoSanity.js'
import { scoreHero } from '../rankHeroes.js'
import { formatDistance } from '../../redesign/ui/NativeContentCard.jsx'
import { composeProposedRoute, routeHasUniqueConsumerHeroes } from '../route/composer.js'
import { startHeroExperience } from '../heroExperience.js'
import { getShellTabs } from '../../shell/config.js'
import { isRouteLive } from '../route/model.js'
import { startRoute, clearRouteState } from '../route/store.js'
import NativeDiscoveryScreen from '../../redesign/screens/NativeDiscoveryScreen.jsx'
import NativeMapScreen from '../../redesign/screens/NativeMapScreen.jsx'
import NativeRoutePill from '../../redesign/ui/NativeRoutePill.jsx'
import { resetJourney } from '../../state/journey.js'

const here = dirname(fileURLToPath(import.meta.url))
const PANTHEON = { lat: 41.89885, lng: 12.47687 }

describe('T05.2 product fidelity after physical QA', () => {
  beforeEach(() => {
    localStorage.clear()
    clearGuestSession()
    clearRouteState()
    resetJourney()
  })

  it('sends an old guest with incomplete current Context to /context', () => {
    startNativeGuestExploration()
    completeNativeContext({ interestIds: ['architecture'], timeBudgetId: '30min' })
    expect(hasCompletedGuestOnboarding()).toBe(false)
  })

  it('sends a currently complete guest to home eligibility', () => {
    completeCurrentNativeOnboarding()
    expect(hasCompletedGuestOnboarding()).toBe(true)
  })

  it('migrates onboarding flow version independently of a stale completed flag', () => {
    startNativeGuestExploration()
    const raw = JSON.parse(localStorage.getItem(GUEST_SESSION_KEY))
    raw.onboardingCompleted = true
    raw.onboardingFlowVersion = 1
    raw.version = 1
    raw.context = { interestIds: ['art'], timeBudgetId: '1h', locationStatus: 'denied' }
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(raw))
    expect(hasCompletedGuestOnboarding()).toBe(false)
  })

  it('collapses w17 and w23 into one Pantheon consumer Experience', () => {
    const catalog = getRomeRankableCatalog()
    const pantheon = catalog.filter((item) => consumerExperienceIdFor(item) === 'rome:pantheon')
    expect(pantheon).toHaveLength(1)
    expect(pantheon[0].id).toBe('w17')
    expect(pantheon[0].title).toBe('The Pantheon')
    expect(pantheon[0].waypointIds).toEqual(['w17', 'w23'])
    expect(catalog.some((item) => item.id === 'w23')).toBe(false)
    expect(getRomeRegistry().heroes).toHaveLength(21)
    expect(getRomeRegistry().heroes.map((item) => item.id)).toEqual(expect.arrayContaining(['w17', 'w23']))
  })

  it('refuses a route with the same consumer Hero twice', () => {
    const catalog = getRomeRankableCatalog()
    const proposed = composeProposedRoute({
      context: completeCurrentNativeOnboarding({ lastPosition: PANTHEON, session: { location: PANTHEON, locationStatus: 'granted', availableTimeNow: '2h' } }).context,
      catalog,
      canAccess: canAccessContentId,
      position: PANTHEON,
    })
    const ids = proposed.items.map((item) => item.contentId)
    expect(ids.filter((id) => id === 'w17' || id === 'w23')).toHaveLength(1)
    expect(ids).not.toContain('w23')
    const byId = Object.fromEntries(catalog.map((item) => [item.id, item]))
    expect(routeHasUniqueConsumerHeroes(proposed.items, byId)).toBe(true)
  })

  it('does not display distance for invalid, zero, or malformed coordinates', () => {
    const hero = getRegistryItem('w17')
    expect(travelerFacingDistanceM({ lat: 0, lng: 0 }, hero.geo)).toBeNull()
    expect(travelerFacingDistanceM({ lat: Number.NaN, lng: 12 }, hero.geo)).toBeNull()
    expect(isPlausibleRomePosition({ lat: 40.7, lng: -74 })).toBe(false)
    expect(formatDistance(11_901_000)).toBeNull()
    expect(formatDistance(null)).toBeNull()
    const scored = scoreHero(hero, { position: { lat: 0, lng: 0 } })
    expect(scored.distanceM).toBeNull()
    expect(scored.whyReasons.join(' ')).not.toMatch(/min away/)
  })

  it('uses an honest generic placeholder when Discovery media is missing', () => {
    const discovery = getRegistryItem('d_rome_21')
    const media = resolveContentMedia(discovery)
    expect(media.source).toBe('placeholder')
    expect(media.path).toBeNull()
    expect(String(media.url)).not.toMatch(/pantheon|navona|trevi|elephant/i)
  })

  it('never uses an unrelated place photo as a media fallback', () => {
    const source = readFileSync(resolve(here, '../../content/registry/media.js'), 'utf8')
    expect(source).not.toMatch(/CLUSTER_FALLBACK_PHOTOS/)
    expect(source).not.toMatch(/CITY_FALLBACK_PHOTO/)
    const ignazio = getRegistryItem('d_rome_21')
    expect(String(ignazio.photo || '')).not.toMatch(/pantheon/i)
    expect(ignazio.mediaResolved.source).toBe('placeholder')
  })

  it('keeps native Discovery detail on the bright bone surface', () => {
    render(
      <MemoryRouter initialEntries={['/discovery/d_rome_22']}>
        <I18nProvider>
          <Routes>
            <Route path="/discovery/:discoveryId" element={<NativeDiscoveryScreen />} />
          </Routes>
        </I18nProvider>
      </MemoryRouter>,
    )
    const node = screen.getByTestId('native-discovery')
    expect(node.getAttribute('data-bright')).toBe('true')
    expect(node.style.background).toMatch(/#FAF6EF|rgb\(250,\s*246,\s*239\)/)
    expect(node.style.color).toMatch(/#1A1A1F|rgb\(26,\s*26,\s*31\)/)
  })

  it('native nav has no permanent Walk tab without an active route', () => {
    const tabs = getShellTabs({ native: true, walkActive: false })
    expect(tabs.map((tab) => tab.to)).toEqual(['/home', '/map', '/journal', '/settings'])
    expect(tabs.some((tab) => tab.to === '/journey')).toBe(false)
  })

  it('active route exposes a contextual Walk affordance via the route pill', () => {
    const catalog = getRomeRankableCatalog()
    const proposed = composeProposedRoute({
      context: completeCurrentNativeOnboarding({ lastPosition: PANTHEON, session: { location: PANTHEON, locationStatus: 'granted', availableTimeNow: '2h' } }).context,
      catalog,
      canAccess: canAccessContentId,
      position: PANTHEON,
    })
    const active = startRoute(proposed)
    expect(isRouteLive(active)).toBe(true)
    render(
      <MemoryRouter>
        <I18nProvider>
          <NativeRoutePill />
        </I18nProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('route-pill')).toBeInTheDocument()
    const tabs = getShellTabs({ native: true, walkActive: true })
    expect(tabs.some((tab) => tab.to === '/journey')).toBe(false)
  })

  it('native Map uses the Mapbox loader implementation', () => {
    const source = readFileSync(resolve(here, '../../redesign/screens/NativeMapScreen.jsx'), 'utf8')
    expect(source).toContain('loadMapboxRuntime')
    expect(source).toContain('native-mapbox')
    expect(source).toContain('mapbox://styles/mapbox')
    render(
      <MemoryRouter>
        <I18nProvider>
          <NativeMapScreen />
        </I18nProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('native-map').getAttribute('data-map-engine')).toMatch(/mapbox/)
    expect(screen.getByTestId('native-mapbox')).toBeInTheDocument()
  })

  it('keeps premium locks intact', () => {
    expect(canAccessContentId('w01')).toBe(false)
    expect(canAccessContentId('w17')).toBe(true)
  })

  it('still plays free Pantheon through internal w17 then w23', () => {
    const result = startHeroExperience('w17')
    expect(result.ok).toBe(true)
    expect(result.customWaypointIds).toEqual(['w17', 'w23'])
  })

  it('leaves web shell tabs unchanged', () => {
    expect(getShellTabs().map((tab) => tab.to)).toEqual(['/home', '/journey', '/tour', '/map', '/journal'])
  })
})
