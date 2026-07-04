import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CreditsScreen from '../CreditsScreen.jsx'

vi.mock('../../hooks/useV2Journey.js', () => ({
  useTourManifest: () => ({
    manifest: {
      waypoints: {
        w01: {
          title: 'The Colosseum',
          now_image: {
            source: 'wikimedia',
            credit: 'Photo: Ada Lovelace, Wikimedia Commons',
            source_url: 'https://commons.wikimedia.org/wiki/File:Colosseum.jpg',
          },
        },
      },
    },
    loading: false,
    error: null,
  }),
}))

describe('CreditsScreen', () => {
  it('renders wikimedia credits and the about-imagery paragraph', () => {
    render(
      <MemoryRouter>
        <CreditsScreen />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /credits & sources/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /present-day photography/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /about our imagery/i })).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /ada lovelace/i })
    expect(link).toHaveAttribute('href', 'https://commons.wikimedia.org/wiki/File:Colosseum.jpg')

    expect(screen.getByText(/Present-day photographs are sourced from Wikimedia Commons/)).toBeInTheDocument()
    expect(screen.getByText(/see each waypoint's caption for source notes\./)).toBeInTheDocument()
  })
})
