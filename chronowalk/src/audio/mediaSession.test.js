import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bindMediaSessionHandlers,
  clearMediaSession,
  updateMediaSession,
} from './mediaSession.js'

describe('mediaSession', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('binds and clears action handlers', () => {
    const setActionHandler = vi.fn()
    vi.stubGlobal('navigator', {
      mediaSession: {
        metadata: null,
        playbackState: 'none',
        setActionHandler,
      },
    })

    const play = vi.fn()
    const pause = vi.fn()
    const unbind = bindMediaSessionHandlers({ play, pause })

    expect(setActionHandler).toHaveBeenCalledWith('play', play)
    expect(setActionHandler).toHaveBeenCalledWith('pause', pause)

    unbind()
    expect(setActionHandler).toHaveBeenCalledWith('play', null)
    expect(setActionHandler).toHaveBeenCalledWith('pause', null)
  })

  it('updates metadata and playback state', () => {
    const mediaSession = {
      metadata: null,
      playbackState: 'none',
      setActionHandler: vi.fn(),
    }
    vi.stubGlobal('navigator', { mediaSession })
    vi.stubGlobal(
      'MediaMetadata',
      class MediaMetadata {
        constructor(init) {
          Object.assign(this, init)
        }
      }
    )

    updateMediaSession({
      title: 'The Colosseum',
      artist: 'ChronoWalk',
      album: 'Rome',
      playing: true,
    })

    expect(mediaSession.metadata).toMatchObject({
      title: 'The Colosseum',
      artist: 'ChronoWalk',
      album: 'Rome',
    })
    expect(mediaSession.playbackState).toBe('playing')

    clearMediaSession()
    expect(mediaSession.metadata).toBeNull()
    expect(mediaSession.playbackState).toBe('none')
  })
})
