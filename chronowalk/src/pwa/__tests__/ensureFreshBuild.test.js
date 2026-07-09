import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureFreshBuild } from '../ensureFreshBuild'

describe('ensureFreshBuild', () => {
  beforeEach(() => {
    vi.stubGlobal('__APP_BUILD_ID__', 'abc123')
    localStorage.clear()
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('skips migration outside production', async () => {
    vi.stubEnv('PROD', false)
    const result = await ensureFreshBuild({ buildId: 'abc123' })
    expect(result).toEqual({ migrating: false })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('migrates when the stored build id does not match', async () => {
    vi.stubEnv('PROD', true)
    localStorage.setItem('cw-app-build', 'old-build')

    const replace = vi.fn()
    vi.stubGlobal('location', { ...window.location, replace })
    vi.stubGlobal('navigator', {})

    const result = await ensureFreshBuild({ buildId: 'abc123' })

    expect(result).toEqual({ migrating: true })
    expect(sessionStorage.getItem('cw-build-migration')).toBe('abc123')
    expect(replace).toHaveBeenCalled()
  })

  it('does not migrate when build id and service worker marker match', async () => {
    vi.stubEnv('PROD', true)
    localStorage.setItem('cw-app-build', 'abc123')

    fetch.mockResolvedValue({
      ok: true,
      text: async () => 'self.__WB_MANIFEST; chronowalk-abc123',
    })

    vi.stubGlobal('navigator', {
      serviceWorker: {
        ready: Promise.resolve(),
        getRegistration: vi.fn().mockResolvedValue({
          active: { scriptURL: 'https://chronowalk.com/sw.js' },
          update: vi.fn(),
        }),
      },
    })

    const result = await ensureFreshBuild({ buildId: 'abc123' })

    expect(result).toEqual({ migrating: false })
    expect(localStorage.getItem('cw-sw-script-url')).toBe('https://chronowalk.com/sw.js')
  })
})
