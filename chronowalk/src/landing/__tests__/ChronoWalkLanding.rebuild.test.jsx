import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ChronoWalkLanding from '../ChronoWalkLanding.jsx'
import { LANDING_PRODUCT } from '../landingProduct.js'

vi.mock('../../lib/track.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    track: vi.fn(),
    isAnalyticsReady: () => true,
    initAnalytics: vi.fn(),
    getAnalyticsConsent: () => 'accepted',
    setAnalyticsConsent: vi.fn(),
    subscribeAnalyticsConsent: () => () => {},
  }
})

vi.mock('../../lib/checkout.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    openCheckout: vi.fn(async () => ({ ok: false, reason: 'not_configured' })),
  }
})

function renderLanding(search = '') {
  window.history.replaceState({}, '', `/landing${search}`)
  return render(
    <MemoryRouter initialEntries={[`/landing${search}`]}>
      <ChronoWalkLanding />
    </MemoryRouter>,
  )
}

describe('ChronoWalkLanding rebuild', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the product-first v4 hierarchy', async () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/See what stood here/i)
    expect(screen.getByRole('heading', { name: /ruin becomes the room/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Hear Rome/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /continuous story/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Try the Pantheon free/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Choose your Rome walk/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Share the walk/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Built for walking Rome/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Before you walk/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Rome is already around you/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/ChronoWalk at the Pantheon/i)).toBeInTheDocument()
    expect(await screen.findByText(/FREE PREVIEW/i)).toBeInTheDocument()
    expect(screen.getByText(/^The Pantheon$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Audio$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Read instead/i })).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', {
        name: new RegExp(`Unlock all ${LANDING_PRODUCT.eterna.stopCount}`),
      }).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText(/Most Popular/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Everything follows where you are/i)).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\b18 stops\b|\b22 stops\b/)
  })

  it('uses curiosity-first hero CTAs in organic mode', () => {
    renderLanding()
    const heroPrimary = document.getElementById('hero-primary-cta')
    expect(heroPrimary).toHaveTextContent(/Try the Pantheon stop free/i)
    expect(heroPrimary).toHaveClass('cw-rb-btn--curiosity')
    expect(screen.getAllByRole('button', { name: /See the complete Rome walk/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Unlock all 21 stops/i }).length).toBeGreaterThan(0)
    expect(document.querySelector('.cw-rb-btn--urgency')).toBeTruthy()
    expect(document.querySelector('.cw-rb-pricing .cw-rb-btn--commit')).toBeTruthy()
  })

  it('switches geo mode to preview-first primary CTA and omits planning sections', () => {
    renderLanding('?src=geo')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Standing in front of history/i)
    expect(screen.getAllByRole('button', { name: /Try the Pantheon stop free/i }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: /Choose your Rome walk/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /continuous story/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Share the walk/i })).not.toBeInTheDocument()
  })

  it('never injects raw host query text', () => {
    renderLanding('?src=qr&host=<img%20src=x%20onerror=alert(1)>')
    expect(document.body.innerHTML).not.toContain('onerror=alert')
    expect(screen.queryByText(/Prepared for/i)).not.toBeInTheDocument()
  })

  it('shows a known host context for validated QR hosts', () => {
    renderLanding('?src=qr&host=demo')
    expect(screen.getByText(/Recommended by your host/i)).toBeInTheDocument()
  })

  it('keeps a compact header brand unit', () => {
    renderLanding()
    expect(document.querySelector('.cw-rb-header')).toBeTruthy()
    expect(document.querySelector('.cw-rb-header__trust')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Try free$/i })).not.toBeInTheDocument()
  })

  it('omits survey-style situation cards on the film landing', () => {
    renderLanding()
    expect(screen.queryByRole('heading', { name: /What kind of Rome day/i })).not.toBeInTheDocument()
  })

  it('ships the real Pantheon free-preview player in the hero phone', async () => {
    renderLanding()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(await screen.findByTestId('waypoint-immersive')).toBeInTheDocument()
    expect(screen.getByLabelText(/Press and hold to cross/i)).toBeInTheDocument()
    expect(screen.getAllByLabelText(/Play narration|Pause narration|Play|Pause/i).length).toBeGreaterThan(0)
  })
})
