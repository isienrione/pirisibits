import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import FreePantheonPage from '../FreePantheonPage.jsx'
import AncientRomePage from '../AncientRomePage.jsx'
import HowItWorksPage from '../HowItWorksPage.jsx'
import { DocumentSeo } from '../../../seo/useDocumentSeo.js'
import { getPageMeta } from '../../../seo/pageMeta.js'
import { getLandingTierStats } from '../../landingTierStats.js'
import { FREE_PANTHEON_COPY } from '../acquisitionCopy.js'
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

vi.mock('../../v4/LandingProductPhoneFrame.jsx', () => ({
  default: function MockPhone({ children }) {
    return <div data-testid="pantheon-phone-frame">{children}</div>
  },
}))

vi.mock('../../../redesign/screens/A2FreePreviewStory.jsx', () => ({
  default: function MockStory() {
    return <div data-testid="pantheon-preview-story">Pantheon preview story</div>
  },
}))

vi.mock('../../../hooks/useV2Journey.js', () => ({
  useTourManifest: () => ({
    loading: false,
    manifest: { system: { preview: 'w17_ch1.mp3' }, waypoints: [] },
  }),
}))

vi.mock('../../../content/manifest.js', () => ({
  getWaypoint: () => ({
    id: 'w17',
    title: 'The Pantheon',
  }),
}))

vi.mock('../../../components/legal/CheckoutConsentDialog.jsx', () => ({
  default: function MockConsent() {
    return null
  },
}))

vi.mock('../../useLandingPrice.js', () => ({
  useLandingPrice: () => ({ cents: 1499 }),
}))

vi.mock('../../previewAudioHandoff.js', () => ({
  consumePreviewPlaybackIntent: () => false,
  getPreviewSessionAudio: () => ({
    play: vi.fn(async () => {}),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    paused: true,
    currentTime: 0,
    duration: 0,
    ended: false,
    readyState: 0,
  }),
  primePreviewAudioForNavigation: vi.fn(),
  retainPreviewPlaybackIntent: vi.fn(),
  stopPreviewSessionAudio: vi.fn(),
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

  it('renders a compact /free-pantheon with immediate start and phone nearby', () => {
    renderPage('/free-pantheon', <FreePantheonPage />)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(/exterior chapter free/i)
    expect(screen.queryByText(/What the free experience includes/i)).not.toBeInTheDocument()
    expect(FREE_PANTHEON_COPY.includesCompact).toContain('Part 1 of 4 only')
    expect(screen.getByRole('link', { name: /Peek the phone first/i })).toHaveAttribute(
      'href',
      '#try-pantheon',
    )
    expect(screen.getAllByRole('button', { name: /Start the Pantheon experience/i }).length).toBeGreaterThan(0)
    expect(screen.getByTestId('pantheon-phone-frame')).toBeInTheDocument()
    expect(document.getElementById('try-pantheon')).toBeTruthy()
    expect(document.title).toBe(getPageMeta('/free-pantheon').title)
  })

  it('opens immersive preview from the hero start CTA', () => {
    renderPage('/free-pantheon', <FreePantheonPage />)
    fireEvent.click(screen.getAllByRole('button', { name: /Start the Pantheon experience/i })[0])
    expect(
      screen.getByRole('dialog', { name: /Pantheon Part 1 exterior experience/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Back to free Pantheon page/i }),
    ).toBeInTheDocument()
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
  })
})
