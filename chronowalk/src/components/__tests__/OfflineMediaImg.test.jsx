import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { OfflineMediaImg } from '../OfflineMediaImg.jsx'
import { clearCachedMedia, registerCachedMedia } from '../../lib/mediaUrl.js'

describe('OfflineMediaImg', () => {
  beforeEach(() => {
    clearCachedMedia()
  })

  it('falls back to the network URL when a cached blob fails to paint', async () => {
    registerCachedMedia('/waypoints/pantheon/interior/interior-oculus.jpg', 'blob:poison')

    render(
      <OfflineMediaImg
        src="/waypoints/pantheon/interior/interior-oculus.jpg"
        alt="Pantheon dome"
        data-testid="pantheon-hero"
      />,
    )

    const img = screen.getByTestId('pantheon-hero')
    expect(img).toHaveAttribute('src', 'blob:poison')

    fireEvent.error(img)

    await waitFor(() => {
      expect(screen.getByTestId('pantheon-hero')).toHaveAttribute(
        'src',
        '/waypoints/pantheon/interior/interior-oculus.jpg',
      )
    })
  })

  it('does not keep a black void when src is empty', () => {
    render(<OfflineMediaImg src="" alt="" />)
    expect(screen.getByTestId('offline-media-img-fallback')).toBeInTheDocument()
  })
})
