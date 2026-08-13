import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
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

function LocationProbe() {
  const location = useLocation()
  return (
    <div data-testid="location-probe">
      {location.pathname}
      {location.hash}
    </div>
  )
}

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

vi.mock('../../v4/LandingProductPhoneStage.jsx', () => ({
  default: function MockPhoneStage() {
    return <div data-testid="product-phone-stage">Phone stage</div>
  },
  LandingDemoChapterPhone: function MockChapterPhone({ chapterId }) {
    return <div data-testid={`demo-chapter-phone-${chapterId}`}>Phone {chapterId}</div>
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

vi.mock('../FreePantheonPreviewEmbed.jsx', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    default: function MockEmbed(props) {
      return (
        <div data-testid="pantheon-preview-embed">
          <div data-testid="pantheon-phone-frame" id="try-pantheon" />
          <aside data-testid="pantheon-phone-tip">
            <p>This phone is the demo</p>
            <p>Interact with the phone screen and enjoy a piece of ChronoWalk</p>
          </aside>
          <button type="button" onClick={() => props.onUnlockFullTour?.()}>
            Unlock full tour
          </button>
        </div>
      )
    },
  }
})

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

function renderPage(path, element, { routes } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DocumentSeo />
      <LocationProbe />
      <Routes>
        <Route path={path} element={element} />
        {routes}
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

  it('renders a compact /free-pantheon guided by phone interaction', () => {
    renderPage('/free-pantheon', <FreePantheonPage />)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(/exterior chapter free/i)
    expect(screen.queryByText(/What the free experience includes/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Start the Pantheon experience/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Show me now/i })).not.toBeInTheDocument()
    const tip = screen.getByTestId('pantheon-phone-tip')
    expect(tip).toHaveTextContent(/This phone is the demo/i)
    expect(tip).toHaveTextContent(/Interact with the phone screen and enjoy a piece of ChronoWalk/i)
    expect(FREE_PANTHEON_COPY.includesCompact).toContain('Part 1 of 4 only')
    expect(screen.getByTestId('pantheon-phone-frame')).toBeInTheDocument()
    expect(document.getElementById('try-pantheon')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /Explore the full 21-stop Rome tour/i }),
    ).toHaveAttribute('href', '/')
    expect(document.title).toBe(getPageMeta('/free-pantheon').title)
  })

  it('routes preview unlock to landing pricing, not /access', () => {
    renderPage('/free-pantheon', <FreePantheonPage />, {
      routes: (
        <>
          <Route path="/" element={<div data-testid="landing-home">Landing</div>} />
          <Route path="/access" element={<div data-testid="access-page">Access</div>} />
        </>
      ),
    })

    fireEvent.click(screen.getByRole('button', { name: /^Unlock full tour$/i }))

    expect(screen.getByTestId('landing-home')).toBeInTheDocument()
    expect(screen.queryByTestId('access-page')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/#pricing')
  })

  it('renders /ancient-rome with verified Roma Antica stop count and checkout CTAs', () => {
    const stopCount = getLandingTierStats('rome-essential').stopCount
    renderPage('/ancient-rome', <AncientRomePage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Ancient Rome/i)
    expect(screen.getAllByText(new RegExp(`${stopCount} stops`)).length).toBeGreaterThan(0)
    expect(screen.getByText('Via Sacra')).toBeInTheDocument()
    expect(screen.getByText('Palatine terrace viewpoint')).toBeInTheDocument()
    expect(screen.queryByText('Temple of Saturn')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /See the complete route/i })).toHaveAttribute(
      'href',
      '/#rome-essential',
    )
    expect(screen.getByRole('button', { name: /Choose Roma Antica/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Choose Roma Historica/i })).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: /Unlock full tours from €4\.99|Unlock all 21 stops/i })
        .length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByRole('link', { name: /See more details of each route and pricing/i }),
    ).toHaveAttribute('href', '/#pricing')
    const disclaimers = screen.getAllByRole('note')
    expect(disclaimers.length).toBeGreaterThanOrEqual(1)
    expect(disclaimers[0]).toHaveTextContent(/Admission tickets are not included/i)
    expect(disclaimers[0]).toHaveTextContent(/Colosseum, Roman Forum, Palatine/i)
    expect(document.title).toBe(getPageMeta('/ancient-rome').title)
  })

  it('renders /how-it-works with sequential phone chapters and free/paid choice', () => {
    renderPage('/how-it-works', <HowItWorksPage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByTestId('how-it-works-sequential-demo')).toBeInTheDocument()
    expect(screen.getByText(/Begin your chosen walking route/i)).toBeInTheDocument()
    expect(screen.queryByText(/Choose your Rome walk/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Wander freely/i)).toBeInTheDocument()
    expect(screen.queryByText(/Scroll to follow the phone/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Try the Pantheon stop free/i }),
    ).toBeInTheDocument()
    expect(document.title).toBe(getPageMeta('/how-it-works').title)
  })

  it('exposes language choice on every acquisition landing header', () => {
    renderPage('/how-it-works', <HowItWorksPage />)
    expect(screen.getByTestId('landing-language-control')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /choose language/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /español/i })).toBeInTheDocument()
    expect(
      screen.getByText(/Audio in English & Spanish — choose your language/i),
    ).toBeInTheDocument()
  })

  it('fires one page-view event per acquisition page type', async () => {
    const { track } = await import('../../../lib/track.js')
    track.mockClear()
    expect(trackAcquisitionPageView('free_pantheon')).toBe(true)
    expect(trackAcquisitionPageView('free_pantheon')).toBe(false)
    expect(track).toHaveBeenCalledTimes(1)
  })
})
