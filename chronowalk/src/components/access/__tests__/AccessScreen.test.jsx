import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import AccessScreen from '../AccessScreen'
import { validateAccessToken } from '../../../lib/access'
import { track } from '../../../lib/track'

vi.mock('../../../lib/track', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, track: vi.fn() }
})

vi.mock('../../../lib/access', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    validateAccessToken: vi.fn().mockResolvedValue({ ok: false, reason: 'invalid_format' }),
  }
})

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>
}

function renderAccess(initialEntry = '/access') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/access"
          element={
            <>
              <AccessScreen />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

function submitCode(value) {
  fireEvent.change(screen.getByLabelText(/enter the access code from your email/i), {
    target: { value },
  })
  fireEvent.click(screen.getByRole('button', { name: /enter rome/i }))
}

describe('AccessScreen', () => {
  beforeEach(() => {
    vi.mocked(validateAccessToken).mockClear()
    vi.mocked(track).mockClear()
  })

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
      screen.getByLabelText(/enter the access code from your email/i),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/paste the code you received here/i)).toBeInTheDocument()
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

    fireEvent.change(screen.getByLabelText(/enter the access code from your email/i), {
      target: { value: 'dev' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enter rome/i }))

    await waitFor(() => {
      expect(screen.getByText(/confirming your purchase/i)).toBeInTheDocument()
    })
  })

  it('explains the RM code format when a booking number is entered', async () => {
    renderAccess()
    submitCode('#1234567890')

    expect(await screen.findByText(/this is not a chronowalk code/i)).toBeInTheDocument()
    expect(screen.getByText(/find it in your viator voucher/i)).toBeInTheDocument()
    expect(validateAccessToken).toHaveBeenCalledWith('1234567890')
    expect(track).toHaveBeenCalledWith('access_code_rejected', {
      reason: 'invalid_format',
      entry: 'manual',
      code_shape: 'digits',
      code_length: 10,
    })
  })

  it('validates again when the same code is resubmitted', async () => {
    renderAccess()
    submitCode('1234567890')
    await screen.findByText(/this is not a chronowalk code/i)

    fireEvent.click(screen.getByRole('button', { name: /enter rome/i }))
    await waitFor(() => expect(validateAccessToken).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(/this is not a chronowalk code/i)).toBeInTheDocument()
  })

  it('removes a rejected link token from the URL and keeps the error', async () => {
    renderAccess('/access?token=1234567890&utm_source=voucher')

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/access\?utm_source=voucher$/),
    )
    expect(screen.getByText(/this is not a chronowalk code/i)).toBeInTheDocument()
  })

  it('tells Viator buyers that the resend form is not for them', () => {
    renderAccess()
    expect(screen.getByText(/bought on viator\? you do not need this form/i)).toBeInTheDocument()
  })
})
