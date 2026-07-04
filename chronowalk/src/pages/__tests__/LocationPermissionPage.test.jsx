import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LocationPermissionPage from '../LocationPermissionPage'
import { ROUTES } from '../../routes/paths'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

function renderLocationPermission() {
  return render(
    <MemoryRouter initialEntries={['/begin/rome/location']}>
      <Routes>
        <Route path="/begin/:destinationId/location" element={<LocationPermissionPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LocationPermissionPage', () => {
  beforeEach(() => {
    navigate.mockClear()
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: {
        getCurrentPosition: vi.fn((_success, error) => error?.({ code: 1 })),
      },
    })
  })

  it('renders permission copy without mentioning GPS', () => {
    renderLocationPermission()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /we'll know exactly when you've reached each story/i,
      })
    ).toBeInTheDocument()
    expect(screen.getByText(/each place unlocks the moment you arrive/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enable location/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /not now/i })).toBeInTheDocument()
    expect(screen.queryByText(/gps/i)).not.toBeInTheDocument()
  })

  it('requests location and continues to journey when enabled', async () => {
    navigator.geolocation.getCurrentPosition = vi.fn((success) => success({}))

    renderLocationPermission()

    fireEvent.click(screen.getByRole('button', { name: /enable location/i }))

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(ROUTES.journey, {
        replace: true,
        state: { destinationId: 'rome' },
      })
    })
  })

  it('continues to journey when not now is tapped', () => {
    renderLocationPermission()

    fireEvent.click(screen.getByRole('button', { name: /not now/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.journey, {
      replace: true,
      state: { destinationId: 'rome' },
    })
  })
})
