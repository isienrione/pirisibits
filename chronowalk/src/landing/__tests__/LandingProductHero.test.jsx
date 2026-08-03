import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import LandingProductHero from '../v4/LandingProductHero.jsx'
import { LANDING_CTA } from '../landingData.js'

vi.mock('../landingAnalytics.js', () => ({
  LANDING_ANALYTICS_SECTIONS: { HERO: 'hero' },
}))

describe('LandingProductHero manual gallery', () => {
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
})

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
      name: 'Unlock from €9.99',
    })
    expect(paidCta).toHaveAttribute('href', '#pricing')
    expect(paidCta).toHaveTextContent(LANDING_CTA.unlockRomePriced)

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
    expect(kids[1].textContent).toMatch(/Unlock from €9\.99/i)
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
      name: 'Unlock from €9.99',
    })
    expect(screen.getByRole('button', { name: 'Continue your walk' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: LANDING_CTA.tryPantheonFree })).not.toBeInTheDocument()

    const actions = document.querySelector('.cw-v4-hero__actions')
    const kids = [...actions.querySelectorAll('a, button')]
    expect(kids).toHaveLength(2)
    expect(kids[0].textContent).toMatch(/Unlock from €9\.99/i)
    expect(kids[1].textContent).toMatch(/Continue your walk/i)

    fireEvent.click(screen.getByRole('button', { name: 'Continue your walk' }))
    expect(onContinueWalk).toHaveBeenCalledTimes(1)
    fireEvent.click(unlock)
    expect(onGetApp).toHaveBeenCalledTimes(1)
    expect(onPreview).not.toHaveBeenCalled()
  })
})
