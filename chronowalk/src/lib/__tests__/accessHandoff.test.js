import { beforeEach, describe, expect, it } from 'vitest'
import {
  buildAccessHandoffPayload,
  consumeAccessHandoff,
  decodeAccessHandoff,
  encodeAccessHandoff,
  HANDOFF_COOKIE,
  HANDOFF_QUERY_KEY,
  syncAccessHandoff,
} from '../accessHandoff.js'
import {
  clearLocalAccessState,
  hasValidLocalAccess,
  writeAccessEntitlement,
  writeDeviceCredential,
} from '../accessSession.js'

describe('accessHandoff', () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie.split(';').forEach((part) => {
      const name = part.split('=')[0]?.trim()
      if (name) document.cookie = `${name}=; Path=/; Max-Age=0`
    })
    window.history.replaceState(null, '', '/begin')
  })

  it('encodes and decodes a handoff payload', () => {
    writeDeviceCredential('cred-abc')
    writeAccessEntitlement({
      purchasedProductId: 'rome-complete',
      contentProductId: 'rome-complete',
      seatLimit: 1,
      role: 'solo',
    })
    const token = encodeAccessHandoff(buildAccessHandoffPayload())
    expect(token).toBeTruthy()
    const parsed = decodeAccessHandoff(token)
    expect(parsed.c).toBe('cred-abc')
    expect(parsed.e.contentProductId).toBe('rome-complete')
  })

  it('restores access from the query param into an empty partition', () => {
    writeDeviceCredential('cred-hs')
    writeAccessEntitlement({
      purchasedProductId: 'rome-complete',
      contentProductId: 'rome-complete',
      seatLimit: 1,
      role: 'solo',
    })
    const token = encodeAccessHandoff()
    clearLocalAccessState()
    expect(hasValidLocalAccess()).toBe(false)

    window.history.replaceState(null, '', `/begin?${HANDOFF_QUERY_KEY}=${token}`)
    expect(consumeAccessHandoff()).toBe(true)
    expect(hasValidLocalAccess()).toBe(true)
    expect(window.location.search).not.toContain(HANDOFF_QUERY_KEY)
  })

  it('writes a handoff cookie when syncing', () => {
    writeDeviceCredential('cred-cookie')
    writeAccessEntitlement({
      purchasedProductId: 'rome-complete',
      contentProductId: 'rome-complete',
      seatLimit: 1,
      role: 'solo',
    })
    syncAccessHandoff({ updateUrl: true })
    expect(document.cookie).toContain(HANDOFF_COOKIE)
    expect(window.location.search).toContain(HANDOFF_QUERY_KEY)
  })
})
