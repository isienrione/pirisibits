import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LegalMarkdown from '../LegalMarkdown.jsx'
import privacySource from '../../../content/legal/privacy-policy.md?raw'
import termsSource from '../../../content/legal/terms-of-service.md?raw'

describe('LegalMarkdown', () => {
  it('renders filled seller details in Terms', () => {
    render(<LegalMarkdown source={termsSource} />)
    expect(screen.getByRole('heading', { name: /terms of service/i })).toBeInTheDocument()
    expect(document.body.textContent).toContain('Chronowalk')
    expect(document.body.textContent).toContain('support@chronowalk.com')
    expect(document.body.textContent).toContain('20 July 2026')
    expect(document.body.textContent).toContain('https://chronowalk.com')
  })

  it('renders the Privacy Policy legal-basis table as a real table', () => {
    render(<LegalMarkdown source={privacySource} />)
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /what we do/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /legal basis/i })).toBeInTheDocument()
    expect(screen.getByText(/Deliver the experience you purchased/i)).toBeInTheDocument()
    expect(document.body.textContent).toContain('PostHog')
  })
})
