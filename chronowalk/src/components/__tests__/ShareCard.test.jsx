import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ShareCard from '../ShareCard'

const waypoint = {
  id: 'colosseum',
  title: 'The Colosseum',
  media_cache_version: 1,
  modern_poster_url: '/waypoints/colosseum/exterior/modern-poster.jpg',
  ancient_poster_url: '/waypoints/colosseum/exterior/ancient-poster.jpg',
}

describe('ShareCard', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        blob: async () => new Blob(['image'], { type: 'image/jpeg' }),
      }))
    )

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    })

    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(new Blob(['png'], { type: 'image/png' }))
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders share and save controls when open', () => {
    render(
      <ShareCard
        waypoint={waypoint}
        modernSrc="/modern.jpg"
        ancientSrc="/ancient.jpg"
        open
        onClose={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: /share this reveal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^share$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save image/i })).toBeInTheDocument()
    expect(screen.getByText('The Colosseum')).toBeInTheDocument()
  })
})
