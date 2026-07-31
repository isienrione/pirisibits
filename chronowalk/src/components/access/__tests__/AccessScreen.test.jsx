import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AccessScreen from '../AccessScreen'

vi.mock('../../../lib/access', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    validateAccessToken: vi.fn().mockResolvedValue({ ok: false, reason: 'invalid_format' }),
  }
})

describe('AccessScreen', () => {
  it('shows restore instructions without a token', () => {
    render(
      <MemoryRouter initialEntries={['/access']}>
        <Routes>
          <Route path="/access" element={<AccessScreen />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByText(/personal link/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /didn.t get your access email/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /email me a fresh access link/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /see rome packages/i })).toHaveAttribute(
      'href',
      '/#pricing',
    )
    expect(screen.getByRole('link', { name: /hear the pantheon/i })).toHaveAttribute('href', '/preview')
  })

  it('submits a pasted token to the access route', async () => {
    render(
      <MemoryRouter initialEntries={['/access']}>
        <Routes>
          <Route path="/access" element={<AccessScreen />} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/from your email/i), {
      target: { value: 'dev' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enter rome/i }))

    await waitFor(() => {
      expect(screen.getByText(/confirming your purchase/i)).toBeInTheDocument()
    })
  })
})
