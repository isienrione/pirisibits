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
    expect(screen.getByRole('link', { name: /unlock rome/i })).toHaveAttribute('href', '/landing')
  })

  it('submits a pasted token to the access route', async () => {
    render(
      <MemoryRouter initialEntries={['/access']}>
        <Routes>
          <Route path="/access" element={<AccessScreen />} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/access token/i), {
      target: { value: 'dev' },
    })
    fireEvent.click(screen.getByRole('button', { name: /restore access/i }))

    await waitFor(() => {
      expect(screen.getByText(/confirming your purchase/i)).toBeInTheDocument()
    })
  })
})
