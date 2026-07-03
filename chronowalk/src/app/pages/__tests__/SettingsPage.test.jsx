import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SettingsPage } from '../SettingsPage.jsx'

describe('SettingsPage shell', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders grouped settings sections with toggles', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Audio')).toBeInTheDocument()
    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.getByText('Background Play')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('switch', { name: /background play/i }))
    expect(screen.getByRole('switch', { name: /background play/i })).toHaveAttribute('aria-checked', 'false')
  })
})
