import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider.jsx'
import LandingFaqSectionV2 from '../LandingFaqSectionV2.jsx'

describe('LandingFaqSectionV2 from-app chrome', () => {
  it('shows back-to-app controls and extra spacing when opened from the app', () => {
    window.history.pushState({}, '', '/?from=app#faq')

    render(
      <MemoryRouter>
        <I18nProvider>
          <LandingFaqSectionV2 />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('faq-back-to-app')).toBeInTheDocument()
    expect(document.getElementById('faq')?.className).toMatch(/cw-v2-faq--from-app/)
    expect(screen.getByRole('link', { name: /open home|abrir inicio/i })).toHaveAttribute(
      'href',
      '/home',
    )

    const back = vi.spyOn(window.history, 'back')
    fireEvent.click(screen.getByRole('button', { name: /back to chronowalk|volver a chronowalk/i }))
    expect(back).toHaveBeenCalled()
    back.mockRestore()
  })
})
