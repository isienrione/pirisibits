import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import { HERO_STOP_IDS } from '../../../i18n/audio/heroStopAudioMap.js'
import { getRomeRegistry } from '../../../content/rome/registry.js'
import { ROME_DISCOVERIES } from '../../../content/rome/discoveries.js'
import {
  DISCOVERY_IDS,
  FREE_DISCOVERY_IDS,
  ANCIENT_DISCOVERY_IDS,
  HISTORIC_DISCOVERY_IDS,
  LEGACY_SKU_PATTERN,
  ROME_NATIVE_OFFERINGS,
  unlockScopesForDiscovery,
} from '../../../content/rome/coverage.js'
import { resolveContentMedia } from '../../../content/registry/media.js'
import { CONTENT_TYPES, GEO_STATUS } from '../../../content/registry/constants.js'
import { canAccessContentId, canAccessDiscovery, canAccessHero } from '../../../lib/contentAccess.js'
import {
  clearGuestSession,
  completeNativeContext,
  isExperienceSaved,
  readGuestSession,
  recordSavedExperience,
} from '../../../lib/guestSession.js'
import { clearLocalAccessState } from '../../../lib/accessSession.js'
import { bestNext, rankHeroes } from '../../../lib/rankHeroes.js'
import NativeDiscoverHome from '../NativeDiscoverHome.jsx'
import NativeExploreScreen from '../NativeExploreScreen.jsx'
import NativeDiscoveryScreen from '../NativeDiscoveryScreen.jsx'
import NativeExperienceScreen from '../NativeExperienceScreen.jsx'
import NativeSavedScreen from '../NativeSavedScreen.jsx'
import NativeMapScreen from '../NativeMapScreen.jsx'
import NativeBestNextScreen from '../NativeBestNextScreen.jsx'
import NativeCoverageSheet from '../../ui/NativeCoverageSheet.jsx'
import * as paddle from '../../../lib/paddle.js'

vi.spyOn(paddle, 'openPaddleCheckout')

const here = dirname(fileURLToPath(import.meta.url))

function renderNative(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider>
        <Routes>
          <Route path="/home" element={<NativeDiscoverHome />} />
          <Route path="/explore" element={<NativeExploreScreen />} />
          <Route path="/discovery/:discoveryId" element={<NativeDiscoveryScreen />} />
          <Route path="/experience/:heroId" element={<NativeExperienceScreen />} />
          <Route path="/journal" element={<NativeSavedScreen />} />
          <Route path="/map" element={<NativeMapScreen />} />
          <Route path="/next" element={<NativeBestNextScreen />} />
          <Route path="/journey" element={<div data-testid="canonical-player">CANONICAL PLAYER</div>} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('Rome product skeleton T04', () => {
  const registry = getRomeRegistry()

  beforeEach(() => {
    localStorage.clear()
    clearLocalAccessState()
    clearGuestSession()
    paddle.openPaddleCheckout.mockClear()
    completeNativeContext({ interestIds: ['architecture-design', 'art'], timeBudgetId: '30min' })
  })

  it('resolves all 21 Heroes and 30 Discoveries with cityId/type/id/title', () => {
    expect(registry.heroes).toHaveLength(21)
    expect(registry.heroes.map((item) => item.id).sort()).toEqual([...HERO_STOP_IDS].sort())
    expect(registry.discoveries).toHaveLength(30)
    expect(registry.discoveries.map((item) => item.id)).toEqual([...DISCOVERY_IDS])
    expect(ROME_DISCOVERIES).toHaveLength(30)
    for (const item of [...registry.heroes, ...registry.discoveries, ...registry.reveals]) {
      expect(item.cityId).toBe('rome')
      expect(item.contentType).toBeTruthy()
      expect(item.id).toBeTruthy()
      expect(item.title.length).toBeGreaterThan(2)
    }
  })

  it('falls back safely when Discovery media is missing', () => {
    const discovery = registry.byId.d_rome_21
    const media = resolveContentMedia(discovery)
    expect(media.url).toBeTruthy()
    expect(media.status).toBe('placeholder')
    expect(discovery.photo).toBeTruthy()
  })

  it('marks Discovery coordinates as NEEDS_QA', () => {
    expect(registry.byId.d_rome_01.geo.status).toBe(GEO_STATUS.NEEDS_QA)
    expect(ANCIENT_DISCOVERY_IDS).toHaveLength(8)
    expect(HISTORIC_DISCOVERY_IDS).toHaveLength(22)
    expect(FREE_DISCOVERY_IDS).toEqual(['d_rome_19', 'd_rome_21', 'd_rome_22', 'd_rome_24'])
  })

  it('lets a guest browse locked content and open a free Discovery', () => {
    expect(canAccessHero('w17')).toBe(true)
    expect(canAccessHero('w01')).toBe(false)
    expect(canAccessDiscovery('d_rome_22')).toBe(true)
    expect(canAccessDiscovery('d_rome_01')).toBe(false)

    renderNative('/experience/w01')
    expect(screen.getByTestId('native-experience')).toBeInTheDocument()
    expect(screen.getByText(/the colosseum/i)).toBeInTheDocument()

    renderNative('/discovery/d_rome_22')
    expect(screen.getByTestId('native-discovery')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('discovery-done'))
    expect(screen.getByTestId('native-best-next')).toBeInTheDocument()
    expect(readGuestSession()?.context.history.completedExperienceIds).toContain('d_rome_22')
  })

  it('does not start a locked premium Hero or Discovery', () => {
    renderNative('/experience/w01')
    fireEvent.click(screen.getByTestId('experience-start'))
    expect(screen.getByTestId('native-unlock-sheet')).toBeInTheDocument()
    expect(screen.queryByTestId('canonical-player')).not.toBeInTheDocument()
    expect(paddle.openPaddleCheckout).not.toHaveBeenCalled()

    renderNative('/discovery/d_rome_01')
    fireEvent.click(screen.getByTestId('discovery-done'))
    expect(screen.getByTestId('native-unlock-sheet')).toBeInTheDocument()
    expect(readGuestSession()?.context.history.completedExperienceIds || []).not.toContain('d_rome_01')
  })

  it('keeps free Pantheon playable', () => {
    renderNative('/experience/w17')
    fireEvent.click(screen.getByTestId('experience-start'))
    expect(screen.getByTestId('canonical-player')).toBeInTheDocument()
  })

  it('persists Saved for a guest without an account', () => {
    recordSavedExperience('w17')
    recordSavedExperience('d_rome_22')
    expect(isExperienceSaved('w17')).toBe(true)
    renderNative('/journal')
    expect(screen.getByTestId('saved-card-w17')).toBeInTheDocument()
    expect(screen.getByTestId('saved-card-d_rome_22')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('saved-remove-w17'))
    expect(isExperienceSaved('w17')).toBe(false)
  })

  it('ranks Heroes and Discoveries together and penalizes completed items', () => {
    const catalog = [...registry.heroes, ...registry.discoveries]
    const open = rankHeroes({
      catalog,
      interestIds: ['art'],
      timeBudgetId: '30min',
      canAccess: (id) => canAccessContentId(id),
    })
    expect(open.ranked.some((item) => item.contentType === CONTENT_TYPES.DISCOVERY)).toBe(true)
    expect(open.ranked.some((item) => item.contentType === CONTENT_TYPES.HERO)).toBe(true)

    const penalized = rankHeroes({
      catalog,
      interestIds: ['art'],
      timeBudgetId: '30min',
      canAccess: (id) => canAccessContentId(id),
      completedIds: ['d_rome_22'],
    })
    const before = open.ranked.find((item) => item.id === 'd_rome_22')
    const after = penalized.ranked.find((item) => item.id === 'd_rome_22')
    expect(after.score).toBeLessThan(before.score)
  })

  it('reuses the ranker for Best Next', () => {
    const catalog = [...registry.heroes, ...registry.discoveries]
    const next = bestNext({
      catalog,
      excludeIds: ['d_rome_22'],
      interestIds: ['art'],
      timeBudgetId: '30min',
      canAccess: (id) => canAccessContentId(id),
    })
    expect(next.ranked.every((item) => item.id !== 'd_rome_22')).toBe(true)
    expect(next.primary).toBeTruthy()
    expect(next.alternatives.length).toBeLessThanOrEqual(2)
  })

  it('distinguishes Hero vs Discovery on the map', () => {
    renderNative('/map')
    fireEvent.click(screen.getByTestId('native-map-zoom'))
    expect(screen.getByTestId('map-marker-w17').getAttribute('data-content-type')).toBe('hero')
    expect(screen.getByTestId('map-marker-d_rome_22').getAttribute('data-content-type')).toBe('discovery')
  })

  it('uses native coverage names without legacy SKU language and without Paddle', () => {
    for (const offering of ROME_NATIVE_OFFERINGS) {
      expect(LEGACY_SKU_PATTERN.test(`${offering.displayName} ${offering.tagline}`)).toBe(false)
    }
    render(
      <MemoryRouter>
        <I18nProvider>
          <NativeCoverageSheet open heroId="w01" title="The Colosseum" onClose={() => {}} />
        </I18nProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText('Ancient Rome')).toBeInTheDocument()
    expect(screen.getByText('Historic Center')).toBeInTheDocument()
    expect(screen.getByText('All Central Rome')).toBeInTheDocument()
    expect(screen.queryByText(/historica|antica|eterna|rome-essential|rome-central/i)).not.toBeInTheDocument()
    expect(paddle.openPaddleCheckout).not.toHaveBeenCalled()
  })

  it('assigns coverage by cluster rather than dumping every Discovery into complete-only', () => {
    expect(unlockScopesForDiscovery('d_rome_01')).toEqual(['rome-ancient', 'rome-complete'])
    expect(unlockScopesForDiscovery('d_rome_22')).toEqual(['rome-free', 'rome-historic-center', 'rome-complete'])
    expect(ANCIENT_DISCOVERY_IDS.every((id) => !FREE_DISCOVERY_IDS.includes(id))).toBe(true)
  })

  it('renders Explore Rome in sections, not a single 51-card list', () => {
    renderNative('/explore')
    expect(screen.getByTestId('native-explore')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-testid^="explore-section-"]').length).toBeGreaterThan(1)
  })

  it('does not call Paddle from native coverage, map, saved, or discovery UI', () => {
    const files = [
      '../../ui/NativeCoverageSheet.jsx',
      '../NativeMapScreen.jsx',
      '../NativeSavedScreen.jsx',
      '../NativeDiscoveryScreen.jsx',
      '../NativeDiscoverHome.jsx',
      '../NativeExperienceScreen.jsx',
    ]
    for (const relative of files) {
      const source = readFileSync(resolve(here, relative), 'utf8')
      expect(source).not.toMatch(/paddle/i)
    }
  })

  it('leaves web landing and paid Paddle purchase routes unchanged', () => {
    const router = readFileSync(resolve(here, '../../../app/AppRouter.jsx'), 'utf8')
    expect(router).toContain('path="/"')
    expect(router).toContain('PublicLandingRoute')
    expect(router).toContain('path="/purchase"')
    expect(router).toContain('warnPaddleAtStartup')
    const purchase = readFileSync(resolve(here, '../../../app/pages/PurchaseFlowPage.jsx'), 'utf8')
    expect(purchase).toMatch(/Paddle/)
  })
})
