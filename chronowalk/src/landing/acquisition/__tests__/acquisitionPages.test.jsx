import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import FreePantheonPage from '../FreePantheonPage.jsx'
import AncientRomePage from '../AncientRomePage.jsx'
import HowItWorksPage from '../HowItWorksPage.jsx'
import { DocumentSeo } from '../../../seo/useDocumentSeo.js'
import { getPageMeta } from '../../../seo/pageMeta.js'
import { getLandingTierStats } from '../../landingTierStats.js'
import {
  resetAcquisitionAnalyticsForTests,
  trackAcquisitionPageView,
} from '../acquisitionAnalytics.js'

vi.mock('../../../lib/track.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    isAnalyticsReady: () => true,
    track: vi.fn(() => true),
  }
})

vi.mock('../../../lib/googleAds.js', () => ({
  ensureGtagStub: () => vi.fn(),
}))

vi.mock('../../v4/LandingThenNowProof.jsx', () => ({
  default: function MockThenNow() {
    return <div data-testid="then-now-proof">Then/Now</div>
  },
}))

vi.mock('../../v4/LandingProductDemo.jsx', () => ({
  default: function MockDemo() {
    return <div data-testid="product-demo">Product demo</div>
  },
}))

vi.mock('../../../components/legal/CheckoutConsentDialog.jsx', () => ({
  default: function MockConsent() {
    return null
  },
}))

vi.mock('../../useLandingPrice.js', () => ({
  useLandingPrice: () => ({ cents: 1499 }),
}))

function renderPage(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DocumentSeo />
      <Routes>
        <Route path={path} element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('acquisition pages', () => {
  beforeEach(() => {
    resetAcquisitionAnalyticsForTests()
    document.head.querySelectorAll('meta[name="robots"], link[rel="canonical"]').forEach((el) => {
      el.remove()
    })
  })

  it('renders /free-pantheon with one H1 and free start CTA', () => {
    renderPage('/free-pantheon', <FreePantheonPage />)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(/complete audio stop/i)
    expect(
      screen.getByRole('button', { name: /Start the Pantheon experience/i }),
    ).toBeInTheDocument()
    expect(document.title).toBe(getPageMeta('/free-pantheon').title)
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://chronowalk.com/free-pantheon',
    )
  })

  it('renders /ancient-rome with verified Roma Antica stop count and checkout CTAs', () => {
    const stopCount = getLandingTierStats('rome-essential').stopCount
    renderPage('/ancient-rome', <AncientRomePage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Ancient Rome/i)
    expect(screen.getAllByText(new RegExp(`${stopCount} stops`)).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Choose Roma Antica/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Unlock all 21 stops/i }).length).toBeGreaterThan(0)
    expect(document.title).toBe(getPageMeta('/ancient-rome').title)
  })

  it('renders /how-it-works with three steps and free/paid choice', () => {
    renderPage('/how-it-works', <HowItWorksPage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText(/Open and prepare/i)).toBeInTheDocument()
    expect(screen.getByText(/Start where you are/i)).toBeInTheDocument()
    expect(screen.getByText(/Listen, reveal and continue/i)).toBeInTheDocument()
    expect(screen.getByTestId('product-demo')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Try the Pantheon stop free/i }),
    ).toBeInTheDocument()
    expect(document.title).toBe(getPageMeta('/how-it-works').title)
  })

  it('fires one page-view event per acquisition page type', async () => {
    const { track } = await import('../../../lib/track.js')
    track.mockClear()
    expect(trackAcquisitionPageView('free_pantheon')).toBe(true)
    expect(trackAcquisitionPageView('free_pantheon')).toBe(false)
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'free_pantheon_page_view',
      expect.objectContaining({ landing_page_type: 'free_pantheon' }),
    )
  })

  it('keeps acquisition CTAs wired to existing preview and product IDs', () => {
    renderPage('/free-pantheon', <FreePantheonPage />)
    expect(screen.getByRole('link', { name: /full 21-stop Rome tour/i })).toHaveAttribute(
      'href',
      '/#pricing',
    )
    expect(screen.getByRole('link', { name: /How ChronoWalk works/i })).toHaveAttribute(
      'href',
      '/how-it-works',
    )
  })
})
