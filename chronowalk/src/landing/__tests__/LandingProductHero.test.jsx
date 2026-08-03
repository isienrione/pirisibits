import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import LandingProductHero from '../v4/LandingProductHero.jsx'
import { LANDING_CTA, LANDING_PRICE_FALLBACK_LABEL } from '../landingData.js'

vi.mock('../landingAnalytics.js', () => ({
  LANDING_ANALYTICS_SECTIONS: { HERO: 'hero' },
}))

describe('LandingProductHero story slide enlarge', () => {
  it('opens a zoomable viewer when a story slide is enlarged', () => {
    render(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: /ChronoWalk Rome/i }))
    fireEvent.click(screen.getByRole('button', { name: /Enlarge ChronoWalk Rome/i }))

    const dialog = screen.getByRole('dialog', { name: /ChronoWalk Rome/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveTextContent(/Pinch or double-tap to zoom/i)
    expect(within(dialog).getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close viewer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps package hotspots while offering enlarge on the packages slide', () => {
    render(<LandingProductHero onPreview={() => {}} onChooseTour={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: /Choose your Roman walk/i }))
    expect(screen.getByRole('link', { name: 'Roma Eterna package' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Enlarge Choose your Roman walk/i }))
    expect(screen.getByRole('dialog', { name: /Choose your Roman walk/i })).toBeInTheDocument()
  })
})

describe('LandingProductHero CTA hierarchy', () => {
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
      name: `Unlock all 21 stops · ${LANDING_PRICE_FALLBACK_LABEL}`,
    })
    expect(paidCta).toHaveAttribute('href', '#pricing')
    expect(paidCta).toHaveTextContent(LANDING_CTA.unlockRomePriced)

    const freeCta = screen.getByRole('button', {
      name: LANDING_CTA.tryPantheonFree,
    })
    expect(freeCta).toHaveTextContent(LANDING_CTA.tryPantheonFree)

    expect(
      screen.getByText('Works in any browser · Offline mode available · No subscription'),
    ).toBeInTheDocument()
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
    expect(kids[0].textContent).toMatch(/Try the Pantheon stop free/i)
    expect(kids[1].textContent).toMatch(/Unlock all 21 stops/i)
    expect(kids[1].className).toMatch(/getapp/)
  })

  it('preserves Continue your walk without Pantheon helper copy', () => {
    const onContinueWalk = vi.fn()
    render(
      <LandingProductHero
        onPreview={() => {}}
        onChooseTour={() => {}}
        onGetApp={() => {}}
        onContinueWalk={onContinueWalk}
      />,
    )

    expect(screen.getByRole('button', { name: 'Continue your walk' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pantheon/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Continue your walk' }))
    expect(onContinueWalk).toHaveBeenCalledTimes(1)
  })
})
