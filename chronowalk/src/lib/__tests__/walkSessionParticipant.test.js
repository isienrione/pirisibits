import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localFamilyStore } from '../familyLocalStore.js'
import {
  isActivelySynced,
  isLeader,
  isWalkingIndependently,
} from '../familyWalk.js'

describe('walk session participant detach/rejoin (local store)', () => {
  beforeEach(() => {
    localStorage.clear()
    localFamilyStore._reset()
  })

  function setupCoupleWithSession() {
    const bundle = localFamilyStore.createBundle({ tier: 'couple', deviceId: 'leader' })
    const open = bundle.seats.find((s) => s.status === 'open')
    localFamilyStore.claimSeat({
      inviteCode: open.inviteCode,
      deviceId: 'partner',
      displayName: 'Sam',
    })
    const session = localFamilyStore.createWalkSession({
      bundleId: bundle.id,
      deviceId: 'leader',
      resumePolicy: 'leader',
    })
    localFamilyStore.updateWalkSessionState({
      sessionId: session.id,
      deviceId: 'leader',
      patch: { event: 'clock', waypointId: 'w01', chapterIndex: 0, positionSeconds: 0 },
    })
    return { bundle, sessionId: session.id }
  }

  it('detaches only the follower while leader and session stay active', () => {
    const { sessionId } = setupCoupleWithSession()

    expect(() =>
      localFamilyStore.detachWalkSession({ deviceId: 'leader' }),
    ).toThrow(/leader_cannot_detach/)

    const detached = localFamilyStore.detachWalkSession({ deviceId: 'partner' })
    expect(detached.id).toBe(sessionId)
    expect(detached.syncParticipation).toBe('independent')
    expect(isWalkingIndependently(detached)).toBe(true)
    expect(isActivelySynced(detached)).toBe(false)

    const leaderView = localFamilyStore.getWalkSession(sessionId, 'leader')
    expect(leaderView.status).toBe('active')
    expect(leaderView.syncParticipation).toBe('synced')
    expect(leaderView.syncEnabled).toBe(true)
    expect(isLeader(leaderView, 'leader')).toBe(true)

    const liveBundle = JSON.parse(localStorage.getItem('cw_family_bundle_v1') || 'null')
    const claimed = (liveBundle?.seats ?? []).filter((s) => s.status === 'claimed')
    expect(claimed).toHaveLength(2)

    // Idempotent detach
    const again = localFamilyStore.detachWalkSession({ deviceId: 'partner' })
    expect(again.syncParticipation).toBe('independent')
  })

  it('keeps detached follower ignoring group pause while leader still syncs', () => {
    const { sessionId } = setupCoupleWithSession()
    localFamilyStore.detachWalkSession({ deviceId: 'partner' })

    const paused = localFamilyStore.updateWalkSessionState({
      sessionId,
      deviceId: 'leader',
      patch: { event: 'pause', positionSeconds: 8 },
    })
    expect(paused.paused).toBe(true)

    const partner = localFamilyStore.getWalkSession(sessionId, 'partner')
    expect(partner.paused).toBe(true) // session transport still updates
    expect(partner.syncParticipation).toBe('independent')
    expect(isActivelySynced(partner)).toBe(false)

    const otherFollowerPause = localFamilyStore.updateWalkSessionState({
      sessionId,
      deviceId: 'partner',
      patch: { event: 'pause', positionSeconds: 99 },
    })
    // Sync still on for the group · transport events apply to the shared session,
    // but client UI ignores them when walking independently.
    expect(otherFollowerPause.positionSeconds).toBe(99)
    expect(otherFollowerPause.syncParticipation).toBe('independent')
  })

  it('rejoins the same session without creating a second one', () => {
    const { sessionId } = setupCoupleWithSession()
    localFamilyStore.detachWalkSession({ deviceId: 'partner' })

    const rejoined = localFamilyStore.rejoinWalkSession({ deviceId: 'partner' })
    expect(rejoined.id).toBe(sessionId)
    expect(rejoined.syncParticipation).toBe('synced')
    expect(isActivelySynced(rejoined)).toBe(true)

    const active = localFamilyStore.getActiveWalkSessionForBundle(
      rejoined.bundleId,
      'partner',
    )
    expect(active?.id).toBe(sessionId)
  })

  it('fails closed for non-members on detach/rejoin', () => {
    setupCoupleWithSession()
    expect(() => localFamilyStore.detachWalkSession({ deviceId: 'stranger' })).toThrow(
      /not_a_member/,
    )
    expect(() => localFamilyStore.rejoinWalkSession({ deviceId: 'stranger' })).toThrow(
      /not_a_member/,
    )
  })

  it('reload-shaped discovery keeps independent participation', () => {
    const { bundle, sessionId } = setupCoupleWithSession()
    localFamilyStore.detachWalkSession({ deviceId: 'partner' })

    const rediscovered = localFamilyStore.getActiveWalkSessionForBundle(bundle.id, 'partner')
    expect(rediscovered.id).toBe(sessionId)
    expect(rediscovered.syncParticipation).toBe('independent')
    expect(isWalkingIndependently(rediscovered)).toBe(true)
    expect(isActivelySynced(rediscovered)).toBe(false)
  })
})

describe('isWalkingIndependently / isActivelySynced', () => {
  it('treats missing participation as synced', () => {
    const session = { id: 's1', syncEnabled: true }
    expect(isWalkingIndependently(session)).toBe(false)
    expect(isActivelySynced(session)).toBe(true)
  })

  it('independent is not actively synced even when session syncEnabled', () => {
    const session = {
      id: 's1',
      syncEnabled: true,
      syncParticipation: 'independent',
    }
    expect(isWalkingIndependently(session)).toBe(true)
    expect(isActivelySynced(session)).toBe(false)
  })
})

vi.mock('../supabase.js', () => ({
  isSupabaseConfigured: () => false,
  supabase: { rpc: vi.fn() },
}))
