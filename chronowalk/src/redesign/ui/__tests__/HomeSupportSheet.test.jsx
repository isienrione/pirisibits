import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import HomeSupportSheet, { SUPPORT_EMAIL, supportMailtoHref } from '../HomeSupportSheet.jsx'

describe('HomeSupportSheet', () => {
  it('builds a mailto link to support@chronowalk.com', () => {
    expect(SUPPORT_EMAIL).toBe('support@chronowalk.com')
    expect(supportMailtoHref()).toContain(`mailto:${SUPPORT_EMAIL}`)
    expect(supportMailtoHref()).toContain('subject=')
    expect(supportMailtoHref()).toContain('body=')
  })

  it('explains email support and exposes the mailto CTA', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <I18nProvider>
          <HomeSupportSheet open onClose={onClose} />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: new RegExp(SUPPORT_EMAIL, 'i') })
    expect(link.getAttribute('href')).toContain(`mailto:${SUPPORT_EMAIL}`)

    fireEvent.click(screen.getByRole('button', { name: /close|cerrar/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
