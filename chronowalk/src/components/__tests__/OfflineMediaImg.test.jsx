import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { OfflineMediaImg } from '../OfflineMediaImg.jsx'
import { clearCachedMedia, registerCachedMedia } from '../../lib/mediaUrl.js'

describe('OfflineMediaImg', () => {
  beforeEach(() => {
    clearCachedMedia()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('prefers the network URL while online even when a blob is registered', () => {
    registerCachedMedia('/waypoints/pantheon/interior/interior-oculus.jpg', 'blob:poison')
    vi.stubGlobal('navigator', { ...navigator, onLine: true })

    render(
      <OfflineMediaImg
        src="/waypoints/pantheon/interior/interior-oculus.jpg"
        alt="Pantheon dome"
        data-testid="pantheon-hero"
      />,
    )

    expect(screen.getByTestId('pantheon-hero')).toHaveAttribute(
      'src',
      '/waypoints/pantheon/interior/interior-oculus.jpg',
    )
  })

  it('uses the cached blob while offline and falls back to network on paint failure', async () => {
    registerCachedMedia('/waypoints/pantheon/interior/interior-oculus.jpg', 'blob:poison')
    vi.stubGlobal('navigator', { ...navigator, onLine: false })

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
