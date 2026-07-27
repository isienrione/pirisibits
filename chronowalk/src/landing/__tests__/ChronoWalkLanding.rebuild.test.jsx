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

  it('renders the CRO product-led hierarchy', () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/See what stood here/i)
    expect(screen.getByRole('heading', { name: /ruin becomes the room/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Everything follows where you are/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Try the Pantheon free/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Choose your Rome walk/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Never lose your place/i })).toBeInTheDocument()
    expect(screen.getAllByText(/The complete Rome walk/i).length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('button', {
        name: new RegExp(`Unlock all ${LANDING_PRODUCT.eterna.stopCount}`),
      }).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText(/Most Popular/i)).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\b18 stops\b|\b22 stops\b/)
  })

  it('uses purchase-first hero CTAs in organic mode', () => {
    renderLanding()
    expect(screen.getAllByRole('button', { name: /Unlock all 21 stops/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Try the Pantheon stop free/i }).length).toBeGreaterThan(0)
  })

  it('switches geo mode to preview-first primary CTA and omits planning sections', () => {
    renderLanding('?src=geo')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Standing in front of history/i)
    expect(screen.getAllByRole('button', { name: /Try the Pantheon stop free/i }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: /What kind of Rome day/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Never lose your place/i })).not.toBeInTheDocument()
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

  it('keeps a compact header brand unit without a glowing Try free CTA', () => {
    renderLanding()
    expect(document.querySelector('.cw-rb-header')).toBeTruthy()
    expect(document.querySelector('.cw-rb-header__trust')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Try free$/i })).not.toBeInTheDocument()
  })

  it('omits survey-style situation cards on the film landing', () => {
    renderLanding()
    expect(screen.queryByRole('heading', { name: /What kind of Rome day/i })).not.toBeInTheDocument()
  })

  it('exposes stacked product-proof cards without tabs', () => {
    renderLanding()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Reveal Ancient Rome/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Hear the story$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Keep walking$/i })).toBeInTheDocument()
  })
})
