import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import LandingProductHero from '../v4/LandingProductHero.jsx'
import { LANDING_CTA } from '../landingData.js'
import { __setLaunchOfferActiveForTests } from '../../lib/launchOffer.js'
import { I18nProvider, useI18n } from '../../i18n/I18nProvider.jsx'
import { LOCALE_STORAGE_KEY } from '../../i18n/storage.js'
import { LOCALES } from '../../i18n/locales.js'
import { setActiveLocale } from '../../i18n/activeLocale.js'

vi.mock('../landingAnalytics.js', () => ({
  LANDING_ANALYTICS_SECTIONS: { HERO: 'hero' },
  trackThenNowDemoViewed: vi.fn(),
  trackThenNowDemoStarted: vi.fn(),
  trackThenNowDemoCompleted: vi.fn(),
}))

function LocaleSwitcher() {
  const { setLocale } = useI18n()
  return (
    <button type="button" onClick={() => setLocale(LOCALES.ES)}>
      Switch to Spanish
    </button>
  )
}

function renderHero(ui) {
  return render(
    <I18nProvider>
      {ui}
      <LocaleSwitcher />
    </I18nProvider>,
  )
}

describe('LandingProductHero manual gallery', () => {
  beforeEach(() => {
    __setLaunchOfferActiveForTests(true)
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    setActiveLocale(LOCALES.EN)
  })

  afterEach(() => {
    __setLaunchOfferActiveForTests(null)
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    setActiveLocale(LOCALES.EN)
  })

  it('does not auto-advance slides on a timer', () => {
    vi.useFakeTimers()
    render(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Main hero image' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    vi.advanceTimersByTime(60_000)

    expect(screen.getByRole('tab', { name: 'Main hero image' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    vi.useRealTimers()
  })

  it('advances only via controls and keeps accessible labels', () => {
    render(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Next hero image' }))
    expect(screen.getByRole('tab', { name: /ChronoWalk Rome/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Previous hero image' }))
    expect(screen.getByRole('tab', { name: 'Main hero image' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    fireEvent.click(screen.getByRole('tab', { name: /Choose your Roman walk/i }))
    expect(screen.getByRole('tab', { name: /Choose your Roman walk/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('supports keyboard arrows when the gallery is focused', () => {
    render(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)
    const gallery = document.getElementById('top')
    expect(gallery).toBeTruthy()
    gallery.focus()
    fireEvent.keyDown(gallery, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: /ChronoWalk Rome/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('keeps the CTA hero active after a locale swap so buttons stay clickable', () => {
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    renderHero(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    expect(screen.getByRole('tab', { name: /Main hero image|Imagen principal/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Switch to Spanish' }))
    })

    expect(screen.getByRole('tab', { name: /Main hero image|Imagen principal/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    // Slide 0 stays active → hero CTAs keep pointer-events (inactive layers are inert).
    expect(document.querySelector('.cw-v4-hero__slide-layer.is-active .cw-v4-hero__actions')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /Panteón|Pantheon|adelanto|sneak peek|gratis|free/i }),
    ).toBeInTheDocument()
  })

  it('shows the live Then/Now demo on the first story frame (not static Spanish art)', () => {
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    renderHero(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Switch to Spanish' }))
    })

    fireEvent.click(screen.getByRole('button', { name: /Next hero image|Imagen siguiente/i }))

    expect(
      screen.getByRole('tab', { name: /ChronoWalk Roma\. Camina libremente/i }),
    ).toHaveAttribute('aria-selected', 'true')

    expect(screen.getByTestId('hero-then-now-slide')).toBeInTheDocument()
    expect(
      document.querySelector('.cw-v4-hero__slide-layer--then-now.is-active'),
    ).toBeTruthy()
    expect(
      document.querySelector('.cw-v4-hero__slide-layer--art.is-active img.cw-v4-hero__art'),
    ).toBeNull()
  })
})

describe('LandingProductHero story slide enlarge', () => {
  beforeEach(() => {
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    setActiveLocale(LOCALES.EN)
  })

  afterEach(() => {
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    setActiveLocale(LOCALES.EN)
  })

  it('opens a zoomable viewer when a story slide is enlarged', () => {
    render(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: /The ruin becomes the room/i }))
    fireEvent.click(screen.getByRole('button', { name: /Enlarge The ruin becomes the room/i }))

    const dialog = screen.getByRole('dialog', { name: /The ruin becomes the room/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveTextContent(/Pinch or double-tap to zoom/i)
    expect(within(dialog).getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close viewer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('embeds interactive Then/Now on the second hero slide without enlarge', () => {
    render(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: /ChronoWalk Rome/i }))
    expect(screen.getByTestId('hero-then-now-slide')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Enlarge ChronoWalk Rome/i }),
    ).not.toBeInTheDocument()
  })

  it('keeps package hotspots while offering enlarge on the packages slide', () => {
    render(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: /Choose your Roman walk/i }))
    expect(screen.getByRole('link', { name: 'Roma Eterna' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Enlarge Choose your Roman walk/i }))
    expect(screen.getByRole('dialog', { name: /Choose your Roman walk/i })).toBeInTheDocument()
  })

  it('adds tier poster slides before Choose your walk with pricing hotspots', () => {
    render(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: /Roma Historica/i }))
    expect(screen.getByRole('link', { name: /Roma Historica/i })).toHaveAttribute(
      'href',
      '#rome-central',
    )

    fireEvent.click(screen.getByRole('tab', { name: /Roma Antica/i }))
    expect(screen.getByRole('link', { name: /Roma Antica/i })).toHaveAttribute(
      'href',
      '#rome-essential',
    )

    fireEvent.click(screen.getByRole('tab', { name: /Roma Eterna/i }))
    expect(screen.getByRole('link', { name: /Roma Eterna/i })).toHaveAttribute(
      'href',
      '#rome-complete',
    )
  })

  it('overlays Launch Offer scratched prices on package poster slides', () => {
    __setLaunchOfferActiveForTests(true)
    render(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: /Roma Historica/i }))
    const historicaOffer = screen.getByTestId('cw-hero-pkg-offer-rome-central')
    expect(historicaOffer).toHaveTextContent('€9.99')
    expect(historicaOffer).toHaveTextContent('€4.99')
    expect(historicaOffer).toHaveTextContent(/Launch offer/i)
    expect(historicaOffer).toHaveTextContent(/Save €5/i)

    fireEvent.click(screen.getByRole('tab', { name: /Roma Antica/i }))
    const anticaOffer = screen.getByTestId('cw-hero-pkg-offer-rome-essential')
    expect(anticaOffer).toHaveTextContent('€6.99')
    expect(anticaOffer).toHaveTextContent(/Save €3/i)

    fireEvent.click(screen.getByRole('tab', { name: /Roma Eterna/i }))
    const eternaOffer = screen.getByTestId('cw-hero-pkg-offer-rome-complete')
    expect(eternaOffer).toHaveTextContent('€14.99')
    expect(eternaOffer).toHaveTextContent('€10')
    expect(eternaOffer).toHaveTextContent(/Save €4\.99/i)
  })
})

describe('LandingProductHero CTA hierarchy', () => {
  beforeEach(() => {
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    setActiveLocale(LOCALES.EN)
  })

  afterEach(() => {
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    setActiveLocale(LOCALES.EN)
  })

  it('leads with paid unlock and a clear Pantheon free preview', () => {
    const onPreview = vi.fn()
    const onGetApp = vi.fn()
    render(
      <LandingProductHero onPreview={onPreview} onChooseTour={() => {}} onGetApp={onGetApp} />,
    )

    expect(screen.getByText(/Self-guided audio walking tour of Rome/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Ancient Rome, brought back to life as you walk.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('At your own pace.')).toBeInTheDocument()
    expect(
      screen.getByText('Colosseum, Roman Forum, The Pantheon & 18 other stops'),
    ).toBeInTheDocument()
    expect(screen.getByText(/visual ancient reconstructions/i)).toBeInTheDocument()
    expect(
      screen.queryByText('visual ancient reconstructions', { selector: 'mark' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('Colosseum, Roman Forum, The Pantheon & 18 other stops', {
        selector: 'mark',
      }),
    ).toBeInTheDocument()

    const paidCta = screen.getByRole('link', {
      name: 'Try a tour from €4.99',
    })
    expect(paidCta).toHaveAttribute('href', '#pricing')
    expect(paidCta).toHaveAttribute('aria-label', LANDING_CTA.unlockRomePriced)
    expect(paidCta).toHaveTextContent(/Try a tour from €4\.99/)
    expect(paidCta.querySelector('[data-testid="cw-offer-price"]')).toBeFalsy()

    const freeCta = screen.getByRole('button', {
      name: LANDING_CTA.tryPantheonFree,
    })
    expect(freeCta).toHaveTextContent('Try one stop for free: The Pantheon Part 1')

    const actions = document.querySelector('.cw-v4-hero__actions')
    const kids = [...actions.querySelectorAll('a, button')]
    expect(kids).toHaveLength(2)
    expect(kids[0]).toBe(paidCta)
    expect(kids[1]).toBe(freeCta)
    expect(actions.className).toMatch(/actions--pair/)

    expect(
      screen.queryByText('Works in any browser · Offline mode available · No subscription'),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'How does ChronoWalk work?' })).not.toBeInTheDocument()

    fireEvent.click(paidCta)
    expect(onGetApp).toHaveBeenCalledTimes(1)

    fireEvent.click(freeCta)
    expect(onPreview).toHaveBeenCalledWith('hero')
  })

  it('puts Pantheon free CTA first for pantheon intent', async () => {
    const onPreview = vi.fn()
    const onGetApp = vi.fn()
    const { resolveLandingIntentHero } = await import('../landingIntent.js')
    const hero = resolveLandingIntentHero('pantheon')
    render(
      <LandingProductHero
        hero={hero}
        onPreview={onPreview}
        onChooseTour={() => {}}
        onGetApp={onGetApp}
      />,
    )

    const actions = document.querySelector('.cw-v4-hero__actions')
    const kids = [...actions.querySelectorAll('a, button')]
    expect(kids).toHaveLength(2)
    expect(kids[0].textContent).toMatch(/Try the Pantheon stop free/i)
    expect(kids[1].textContent).toMatch(/Try a tour from €4\.99|Try from €4\.99/)
    expect(kids[1].className).toMatch(/getapp/)
  })

  it('swaps only the free Pantheon pill for Continue when the walker has access', () => {
    const onContinueWalk = vi.fn()
    const onGetApp = vi.fn()
    const onPreview = vi.fn()
    render(
      <LandingProductHero
        onPreview={onPreview}
        onChooseTour={() => {}}
        onGetApp={onGetApp}
        onContinueWalk={onContinueWalk}
      />,
    )

    const unlock = screen.getByRole('link', {
      name: 'Try a tour from €4.99',
    })
    expect(screen.getByRole('button', { name: 'Continue your walk' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: LANDING_CTA.tryPantheonFree })).not.toBeInTheDocument()

    const actions = document.querySelector('.cw-v4-hero__actions')
    const kids = [...actions.querySelectorAll('a, button')]
    expect(kids).toHaveLength(2)
    expect(kids[0].textContent).toMatch(/Try a tour from €4\.99|Try from €4\.99/)
    expect(kids[1].textContent).toMatch(/Continue your walk/i)

    fireEvent.click(screen.getByRole('button', { name: 'Continue your walk' }))
    expect(onContinueWalk).toHaveBeenCalledTimes(1)
    fireEvent.click(unlock)
    expect(onGetApp).toHaveBeenCalledTimes(1)
    expect(onPreview).not.toHaveBeenCalled()
  })
})
