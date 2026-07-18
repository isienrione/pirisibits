import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  disposeSharedAudioEngine,
  getSharedAudioEngine,
  peekSharedAudioEngine,
} from './sharedAudioEngine.js'

vi.mock('./AudioEngine.js', () => {
  const engines = []
  return {
    createAudioEngine: vi.fn((manifest, options = {}) => {
      const engine = {
        manifest,
        path: options.path,
        attachVisibilityListener: vi.fn(),
        detachVisibilityListener: vi.fn(),
        init: vi.fn(async () => ({})),
        teardown: vi.fn(),
        setManifest: vi.fn(function setManifest(next) {
          this.manifest = next
        }),
        setPath: vi.fn(function setPath(next) {
          this.path = next
        }),
      }
      engines.push(engine)
      return engine
    }),
    __engines: engines,
  }
})

describe('sharedAudioEngine', () => {
  afterEach(() => {
    disposeSharedAudioEngine()
  })

  it('reuses one engine across acquire calls for the same tour', async () => {
    const { createAudioEngine } = await import('./AudioEngine.js')
    const manifest = { id: 'rome', journey: { id: 'rome' } }

    const first = getSharedAudioEngine(manifest, { path: 'a' })
    const second = getSharedAudioEngine({ ...manifest, waypoints: {} }, { path: 'b' })

    expect(first).toBe(second)
    expect(createAudioEngine).toHaveBeenCalledTimes(1)
    expect(second.setPath).toHaveBeenCalledWith('b')
    expect(peekSharedAudioEngine()).toBe(first)
  })

  it('does not teardown when dispose has not been called', async () => {
    const manifest = { id: 'rome' }
    const engine = getSharedAudioEngine(manifest)
    expect(engine.teardown).not.toHaveBeenCalled()
  })

  it('teardown only happens on dispose', () => {
    const engine = getSharedAudioEngine({ id: 'rome' })
    disposeSharedAudioEngine()
    expect(engine.detachVisibilityListener).toHaveBeenCalled()
    expect(engine.teardown).toHaveBeenCalled()
    expect(peekSharedAudioEngine()).toBeNull()
  })
})
