import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider.jsx'
import LandingFaqSectionV2 from '../LandingFaqSectionV2.jsx'
import { FAQ_FROM_APP_STORAGE_KEY, markFaqOpenedFromApp } from '../faqFromApp.js'

describe('LandingFaqSectionV2 from-app chrome', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('shows a fixed back-to-app bar when opened from the app query', () => {
    window.history.pushState({}, '', '/?from=app#faq')

    render(
      <MemoryRouter>
        <I18nProvider>
          <LandingFaqSectionV2 />
        </I18nProvider>
      </MemoryRouter>,
    )

    const bar = screen.getByTestId('faq-back-to-app')
    expect(bar).toBeInTheDocument()
    expect(bar.className).toMatch(/cw-v2-faq__app-bar--fixed/)
    expect(document.getElementById('faq')?.className).toMatch(/cw-v2-faq--from-app/)
    expect(screen.getByRole('link', { name: /open home|abrir inicio/i })).toHaveAttribute(
      'href',
      '/home',
    )
  })

  it('keeps from-app chrome when only sessionStorage is set', () => {
    markFaqOpenedFromApp()
    expect(window.sessionStorage.getItem(FAQ_FROM_APP_STORAGE_KEY)).toBe('1')
    window.history.pushState({}, '', '/#faq')

    render(
      <MemoryRouter>
        <I18nProvider>
          <LandingFaqSectionV2 />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('faq-back-to-app')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to chronowalk|volver a chronowalk/i })).toBeInTheDocument()
  })

  it('routes Back to ChronoWalk to /home when there is no in-app referrer', () => {
    window.history.pushState({}, '', '/?from=app#faq')
    const assign = vi.fn()
    vi.stubGlobal('location', {
      ...window.location,
      assign,
      href: 'https://chronowalk.com/?from=app#faq',
    })

    render(
      <MemoryRouter>
        <I18nProvider>
          <LandingFaqSectionV2 />
        </I18nProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /back to chronowalk|volver a chronowalk/i }))
    expect(assign).toHaveBeenCalledWith('/home')
    vi.unstubAllGlobals()
  })
})
