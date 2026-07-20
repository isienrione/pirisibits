import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { bindAutoplayHtmlAudio } from './autoplayHtmlAudio.js'

function createMockAudio({ readyState = 0, playResult = Promise.resolve() } = {}) {
  const listeners = new Map()
  return {
    readyState,
    play: vi.fn(() => playResult),
    addEventListener: vi.fn((event, handler, options) => {
      listeners.set(event, handler)
      if (options?.once) {
        listeners.set(`${event}:once`, true)
      }
    }),
    removeEventListener: vi.fn((event) => {
      listeners.delete(event)
    }),
    emit(event) {
      listeners.get(event)?.()
    },
  }
}

describe('bindAutoplayHtmlAudio', () => {
  beforeEach(() => {
    vi.spyOn(document, 'addEventListener')
    vi.spyOn(document, 'removeEventListener')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('plays immediately when media is already buffered', async () => {
    const audio = createMockAudio({ readyState: 3 })
    const onPlaying = vi.fn()

    bindAutoplayHtmlAudio(audio, { onPlaying })
    await Promise.resolve()

    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(onPlaying).toHaveBeenCalledWith(true)
  })

  it('waits for canplay before starting', () => {
    const audio = createMockAudio({ readyState: 0 })
    bindAutoplayHtmlAudio(audio)

    expect(audio.play).not.toHaveBeenCalled()
    audio.emit('canplay')
    expect(audio.play).toHaveBeenCalledTimes(1)
  })

  it('registers a gesture fallback when autoplay is blocked', async () => {
    const audio = createMockAudio({
      readyState: 3,
      playResult: Promise.reject(new Error('blocked')),
    })
    const onPlayFailed = vi.fn()

    bindAutoplayHtmlAudio(audio, { onPlayFailed })
    await Promise.resolve()
    await Promise.resolve()

    expect(onPlayFailed).toHaveBeenCalledTimes(1)
    expect(document.addEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function), true)
  })
})
