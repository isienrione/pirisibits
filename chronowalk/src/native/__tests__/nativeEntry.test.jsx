import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { __setPublishedPackagesForTests } from '../../catalog/cityRegistry.js'
import { clearCatalogCache } from '../../catalog/catalogService.js'
import { loadCityPackage } from '../../content/cityPackage/index.js'
import {
  shouldUseNativeAppEntry,
  getNativeEntryModel,
  getNativeFreePreviewPath,
  listNativeSoloProductsForCity,
} from '../nativeEntryRouting.js'
import {
  getOfflineStatusPresentation,
  getRestorePresentation,
  getPurchaseUnavailableMessage,
} from '../nativeCopy.js'
import { NativeAppEntry } from '../NativeAppEntry.jsx'
import { NativeProductList } from '../NativeProductList.jsx'
import { NativeCityHome } from '../NativeCityHome.jsx'
import { JOURNEY_STATES } from '../../state/journey.js'
import { isReducedMotionPreferred } from '../../utils/haptics.js'

function stubCapacitor({ native = false, platform = 'web' } = {}) {
  vi.stubGlobal('Capacitor', {
    isNativePlatform: () => native,
    getPlatform: () => platform,
    isNative: native,
  })
  if (typeof window !== 'undefined') {
    window.Capacitor = {
      isNativePlatform: () => native,
      getPlatform: () => platform,
      isNative: native,
    }
  }
}

beforeEach(() => {
  vi.unstubAllGlobals()
  if (typeof window !== 'undefined') {
    delete window.Capacitor
  }
  clearCatalogCache()
  __setPublishedPackagesForTests(null)
})

describe('native entry rendering', () => {
  it('web root keeps marketing entry (shouldUseNativeAppEntry false)', () => {
    expect(shouldUseNativeAppEntry()).toBe(false)
  })

  it('native iOS renders NativeAppEntry home', () => {
    stubCapacitor({ native: true, platform: 'ios' })
    render(
      <MemoryRouter>
        <NativeAppEntry forceNative />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('native-app-entry')).toBeTruthy()
    expect(screen.getByTestId('native-city-home')).toBeTruthy()
    expect(screen.getByText(/Walk through Rome as it once was/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Explore Rome/i })).toBeTruthy()
  })
})

describe('Continue Walk visibility', () => {
  it('shows Continue Walk only when progress exists', () => {
    const idle = getNativeEntryModel({
      journeySnapshot: { state: JOURNEY_STATES.IDLE, context: {} },
    })
    expect(idle.continueWalk.available).toBe(false)

    const resumable = getNativeEntryModel({
      journeySnapshot: {
        state: JOURNEY_STATES.WALKING,
        context: { currentSequenceIndex: 2, completedWaypointIds: ['w01'] },
      },
    })
    expect(resumable.continueWalk.available).toBe(true)

    render(
      <MemoryRouter>
        <NativeCityHome
          model={resumable}
          purchaseService={{ restorePurchases: async () => ({ ok: true, candidates: [] }) }}
          downloadService={{ getDownloadStatus: async () => ({ status: 'not_downloaded' }) }}
          onExploreProducts={() => {}}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /Continue Walk/i })).toBeTruthy()
    expect(screen.getByTestId('native-progress-chip')).toBeTruthy()
  })
})

describe('single-city presentation', () => {
  it('presents Rome directly with more-cities footnote', () => {
    const model = getNativeEntryModel()
    expect(model.mode).toBe('city_home')
    expect(model.city.cityId).toBe('rome')
    expect(model.cities.some((c) => c.cityId === 'harbor')).toBe(false)

    render(
      <MemoryRouter>
        <NativeAppEntry forceNative />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('native-more-cities')).toHaveTextContent(/More cities coming/i)
    expect(screen.queryByTestId('native-app-entry-city-list')).toBeNull()
  })
})

describe('product cards', () => {
  it('renders flagship Roma Eterna card and App Store price fallback', async () => {
    const products = listNativeSoloProductsForCity('rome')
    render(
      <MemoryRouter>
        <NativeProductList
          products={products}
          purchaseService={{
            canPurchaseProduct: () => ({ ok: false, code: 'apple_product_disabled' }),
            purchaseProduct: async () => ({ ok: false }),
            getAvailableProducts: async () => ({ ok: true, products: [] }),
          }}
        />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('native-product-card-rome-complete')).toBeTruthy()
    expect(screen.getByText('Recommended')).toBeTruthy()
    expect(screen.getByTestId('native-price-rome-complete')).toHaveTextContent(
      /Available after App Store configuration/i,
    )
    expect(screen.getByRole('button', { name: /Get Roma Eterna/i })).toBeTruthy()
  })
})

describe('restore states', () => {
  it('shows polished restore empty / success / error copy', () => {
    expect(getRestorePresentation({ ok: true, candidates: [] }).kind).toBe('empty')
    expect(getRestorePresentation({ ok: true, candidates: [{ id: 1 }] }).kind).toBe('success')
    expect(getRestorePresentation({ ok: false, code: 'storekit_unavailable' }).title).toMatch(
      /unavailable/i,
    )
    expect(JSON.stringify(getRestorePresentation({ ok: false, code: 'x' }))).not.toMatch(/paddle/i)
  })

  it('exposes Restore Purchases and reports empty restore', async () => {
    stubCapacitor({ native: true, platform: 'ios' })
    const restorePurchases = vi.fn(async () => ({
      ok: true,
      candidates: [],
      serverVerified: false,
    }))
    render(
      <MemoryRouter>
        <NativeAppEntry
          forceNative
          purchaseService={{
            restorePurchases,
            canPurchaseProduct: () => ({ ok: false }),
            purchaseProduct: async () => ({ ok: false }),
            getAvailableProducts: async () => ({ ok: true, products: [] }),
          }}
          downloadService={{
            getDownloadStatus: async () => ({ status: 'ready' }),
          }}
        />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Restore Purchases/i }))
    await waitFor(() => expect(restorePurchases).toHaveBeenCalled())
    await waitFor(() => {
      expect(screen.getByTestId('native-restore-status')).toHaveTextContent(/Nothing to restore/i)
    })
  })
})

describe('offline state', () => {
  it('humanizes offline / download presentation', () => {
    expect(getOfflineStatusPresentation({ status: 'ready' }).label).toBe('Ready offline')
    expect(getOfflineStatusPresentation({ status: 'downloading' }).label).toBe('Downloading…')
    expect(getOfflineStatusPresentation(null, { online: false }).label).toMatch(/Needs internet/i)
  })

  it('shows Ready offline chip when downloaded', async () => {
    render(
      <MemoryRouter>
        <NativeCityHome
          model={getNativeEntryModel()}
          purchaseService={{ restorePurchases: async () => ({ ok: true, candidates: [] }) }}
          downloadService={{ getDownloadStatus: async () => ({ status: 'ready' }) }}
          onExploreProducts={() => {}}
        />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('native-offline-status')).toHaveTextContent(/Ready offline/i)
    })
  })
})

describe('StoreKit unavailable', () => {
  it('never uses Paddle language for unavailable purchases', async () => {
    expect(getPurchaseUnavailableMessage('paddle_unavailable_on_native')).not.toMatch(/paddle/i)
    expect(getPurchaseUnavailableMessage('apple_product_disabled')).toMatch(/App Store configuration/i)

    stubCapacitor({ native: true, platform: 'ios' })
    const purchaseProduct = vi.fn()
    render(
      <MemoryRouter>
        <NativeProductList
          products={listNativeSoloProductsForCity('rome')}
          purchaseService={{
            canPurchaseProduct: () => ({ ok: false, code: 'storekit_unavailable' }),
            purchaseProduct,
            getAvailableProducts: async () => ({ ok: true, products: [] }),
          }}
        />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Get Roma Eterna/i }))
    await waitFor(() => {
      expect(screen.getByText(/In-App Purchase unavailable/i)).toBeTruthy()
    })
    expect(purchaseProduct).not.toHaveBeenCalled()
    expect(document.body.textContent).not.toMatch(/paddle/i)
  })
})

describe('accessibility labels', () => {
  it('exposes VoiceOver-friendly labels for primary actions and settings', () => {
    render(
      <MemoryRouter>
        <NativeCityHome
          model={getNativeEntryModel()}
          purchaseService={{ restorePurchases: async () => ({ ok: true, candidates: [] }) }}
          downloadService={{ getDownloadStatus: async () => ({ status: 'not_downloaded' }) }}
          onExploreProducts={() => {}}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Explore Rome' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try the Pantheon stop free' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Restore purchases' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Downloads' })).toBeTruthy()
  })
})

describe('reduced motion', () => {
  it('detects prefers-reduced-motion without throwing', () => {
    expect(typeof isReducedMotionPreferred()).toBe('boolean')
  })

  it('applies reduced-motion shell class when preferred', () => {
    const matchMedia = vi.fn().mockImplementation((query) => ({
      matches: String(query).includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    window.matchMedia = matchMedia
    render(
      <MemoryRouter>
        <NativeAppEntry forceNative />
      </MemoryRouter>,
    )
    expect(document.querySelector('.cw-native-shell--reduced')).toBeTruthy()
  })
})

describe('no Paddle / no PWA install prompts', () => {
  it('native home copy contains no Paddle or PWA install language', () => {
    const { container } = render(
      <MemoryRouter>
        <NativeAppEntry forceNative />
      </MemoryRouter>,
    )
    const text = container.textContent || ''
    expect(text).not.toMatch(/paddle/i)
    expect(text).not.toMatch(/add to home screen|install app|pwa/i)
    expect(getNativeFreePreviewPath('rome')).toBe('/preview')
    expect(loadCityPackage('harbor').isFixture).toBe(true)
  })
})

describe('catalog safety', () => {
  it('fails safely with no published city', () => {
    const model = getNativeEntryModel({ cities: [] })
    expect(model.ok).toBe(false)
    render(
      <MemoryRouter>
        <NativeAppEntry forceNative modelOptions={{ cities: [] }} />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('native-app-entry-empty')).toBeTruthy()
  })

  it('second published city uses city list without Rome-only branching', () => {
    const model = getNativeEntryModel({
      cities: [
        { cityId: 'rome', name: 'Rome', slug: 'rome' },
        { cityId: 'athens', name: 'Athens', slug: 'athens' },
      ],
    })
    expect(model.mode).toBe('city_list')
  })
})
