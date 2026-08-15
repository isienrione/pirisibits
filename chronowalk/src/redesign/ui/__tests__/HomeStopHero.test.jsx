import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import HomeStopHero from '../HomeStopHero.jsx'

vi.mock('../../lib/waypointPresentation.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    photoForWaypoint: (waypoint) => waypoint?.photo ?? null,
  }
})

function renderHero(props) {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <div style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
          <HomeStopHero {...props}>
            <span>Header</span>
          </HomeStopHero>
        </div>
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('HomeStopHero', () => {
  it('renders the current stop photo when available', () => {
    renderHero({
      waypoint: {
        id: 'castel-sant-angelo',
        title: "Castel Sant'Angelo",
        photo: '/waypoints/castel-sant-angelo/modern-poster.jpg',
      },
    })

    const image = screen.getByTestId('home-stop-hero-image')
    expect(image).toHaveAttribute('src', '/waypoints/castel-sant-angelo/modern-poster.jpg')
    expect(screen.getByLabelText(/current stop: castel sant'angelo|parada actual: castel sant'angelo/i)).toBeInTheDocument()
  })

  it('falls back without an image when no waypoint is provided', () => {
    renderHero({ waypoint: null })
    expect(screen.queryByTestId('home-stop-hero-image')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/your tour home|inicio de tu recorrido/i)).toBeInTheDocument()
  })
})
