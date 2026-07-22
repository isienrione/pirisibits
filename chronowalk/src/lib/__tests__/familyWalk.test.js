import { beforeEach, describe, expect, it } from 'vitest'
import { localFamilyStore } from '../familyLocalStore.js'
import {
  buildInviteShareUrl,
  canResumeForAll,
  createFamilyBundle,
  isLeader,
  normalizeBundleInviteCode,
} from '../familyWalk.js'

describe('familyLocalStore', () => {
  beforeEach(() => {
    localStorage.clear()
    localFamilyStore._reset()
  })

  it('creates a couple bundle with one claimed seat and one open invite', () => {
    const bundle = localFamilyStore.createBundle({
      tier: 'couple',
      deviceId: 'device-a',
      ownerName: 'Alex',
    })
    expect(bundle.tier).toBe('couple')
    expect(bundle.seatLimit).toBe(2)
    expect(bundle.isOwner).toBe(true)
    expect(bundle.seats).toHaveLength(2)
    expect(bundle.seats.filter((s) => s.status === 'open')).toHaveLength(1)
  })

  it('claims an invite on a second device and unlocks membership', () => {
    const owner = localFamilyStore.createBundle({ tier: 'family', deviceId: 'leader' })
    const open = owner.seats.find((s) => s.status === 'open')
    const joined = localFamilyStore.claimSeat({
      inviteCode: open.inviteCode,
      deviceId: 'partner',
      displayName: 'Sam',
    })
    expect(joined.isOwner).toBe(false)
    expect(joined.mySeat.status).toBe('claimed')
    expect(joined.seats.filter((s) => s.status === 'claimed')).toHaveLength(2)
  })

  it('lets anyone pause while sync is on, and blocks follower resume when policy is leader', () => {
    const bundle = localFamilyStore.createBundle({ tier: 'couple', deviceId: 'leader' })
    const open = bundle.seats.find((s) => s.status === 'open')
    localFamilyStore.claimSeat({ inviteCode: open.inviteCode, deviceId: 'partner', displayName: 'Sam' })

    const session = localFamilyStore.createWalkSession({
      bundleId: bundle.id,
      deviceId: 'leader',
      resumePolicy: 'leader',
    })
    expect(session.syncEnabled).toBe(true)
    expect(isLeader(session, 'leader')).toBe(true)
    expect(canResumeForAll(session, 'partner')).toBe(false)

    const paused = localFamilyStore.updateWalkSessionState({
      sessionId: session.id,
      deviceId: 'partner',
      patch: { event: 'pause', positionSeconds: 12 },
    })
    expect(paused.paused).toBe(true)
    expect(paused.pauseSourceDeviceId).toBe('partner')

    expect(() =>
      localFamilyStore.updateWalkSessionState({
        sessionId: session.id,
        deviceId: 'partner',
        patch: { event: 'resume', positionSeconds: 12 },
      }),
    ).toThrow(/resume_leader_only/)

    const resumed = localFamilyStore.updateWalkSessionState({
      sessionId: session.id,
      deviceId: 'leader',
      patch: { event: 'resume', positionSeconds: 12 },
    })
    expect(resumed.playing).toBe(true)
    expect(resumed.paused).toBe(false)
  })

  it('allows anyone to resume when resumePolicy is anyone', () => {
    const bundle = localFamilyStore.createBundle({ tier: 'couple', deviceId: 'leader' })
    const open = bundle.seats.find((s) => s.status === 'open')
    localFamilyStore.claimSeat({ inviteCode: open.inviteCode, deviceId: 'partner', displayName: 'Sam' })
    const session = localFamilyStore.createWalkSession({
      bundleId: bundle.id,
      deviceId: 'leader',
      resumePolicy: 'anyone',
    })
    expect(canResumeForAll(session, 'partner')).toBe(true)

    localFamilyStore.updateWalkSessionState({
      sessionId: session.id,
      deviceId: 'partner',
      patch: { event: 'pause', positionSeconds: 4 },
    })
    const resumed = localFamilyStore.updateWalkSessionState({
      sessionId: session.id,
      deviceId: 'partner',
      patch: { event: 'resume', positionSeconds: 4 },
    })
    expect(resumed.playing).toBe(true)
  })

  it('ignores transport events when sync is toggled off (autonomous mode)', () => {
    const bundle = localFamilyStore.createBundle({ tier: 'couple', deviceId: 'leader' })
    const open = bundle.seats.find((s) => s.status === 'open')
    localFamilyStore.claimSeat({ inviteCode: open.inviteCode, deviceId: 'partner', displayName: 'Sam' })
    const session = localFamilyStore.createWalkSession({
      bundleId: bundle.id,
      deviceId: 'leader',
      resumePolicy: 'leader',
    })

    localFamilyStore.updateWalkSessionState({
      sessionId: session.id,
      deviceId: 'leader',
      patch: { event: 'resume', positionSeconds: 3 },
    })

    localFamilyStore.updateWalkSessionState({
      sessionId: session.id,
      deviceId: 'leader',
      patch: { syncEnabled: false },
    })

    const ignored = localFamilyStore.updateWalkSessionState({
      sessionId: session.id,
      deviceId: 'partner',
      patch: { event: 'pause', positionSeconds: 9 },
    })
    // Sync off → remote pause does not change group transport
    expect(ignored.syncEnabled).toBe(false)
    expect(ignored.playing).toBe(true)
    expect(ignored.paused).toBe(false)
  })
})

describe('familyWalk production guards', () => {
  it('refuses client-side bundle minting', async () => {
    await expect(createFamilyBundle()).rejects.toMatchObject({ code: 'retired' })
  })

  it('builds invite share links without inventing a host', () => {
    const url = buildInviteShareUrl('rawsecret')
    expect(url).toMatch(/\/invite\?code=rawsecret$/)
  })

  it('canonicalizes bundle invites as trim + lowercase', () => {
    const lower = 'a1b2c3d4e5f6789012345678abcdef01'
    expect(normalizeBundleInviteCode(`  ${lower.toUpperCase()}  `)).toBe(lower)
    expect(normalizeBundleInviteCode(lower)).toBe(lower)
    expect(buildInviteShareUrl(`  ${lower.toUpperCase()}  `)).toMatch(
      new RegExp(`/invite\\?code=${lower}$`),
    )
    expect(buildInviteShareUrl(lower.toUpperCase())).not.toContain(lower.toUpperCase())
  })
})
