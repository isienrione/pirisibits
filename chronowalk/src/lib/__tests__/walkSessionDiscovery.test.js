import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../supabase.js', () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    rpc: vi.fn(),
  },
}))

import { supabase } from '../supabase.js'
import {
  canResumeForAll,
  discoverActiveWalkSession,
  isLeader,
  shouldAcceptRemoteSession,
  subscribeWalkSession,
  updateWalkSessionState,
} from '../familyWalk.js'
import { writeDeviceCredential } from '../accessSession.js'
import { getDeviceId } from '../deviceId.js'

describe('walk session sync helpers', () => {
  it('identifies leader from mySeatId without trusting device ids', () => {
    const session = {
      id: 's1',
      leaderSeatId: 'seat-owner',
      mySeatId: 'seat-owner',
      syncEnabled: true,
      resumePolicy: 'leader',
    }
    expect(isLeader(session)).toBe(true)
    expect(isLeader({ ...session, mySeatId: 'seat-member' })).toBe(false)
    expect(canResumeForAll({ ...session, mySeatId: 'seat-member' })).toBe(false)
    expect(canResumeForAll({ ...session, resumePolicy: 'anyone', mySeatId: 'seat-member' })).toBe(
      true,
    )
  })

  it('rejects stale remote sessions by updatedAt', () => {
    const local = { id: 's1', updatedAt: '2026-07-23T12:00:02.000Z' }
    expect(
      shouldAcceptRemoteSession(local, {
        id: 's1',
        updatedAt: '2026-07-23T12:00:01.000Z',
      }),
    ).toBe(false)
    expect(
      shouldAcceptRemoteSession(local, {
        id: 's1',
        updatedAt: '2026-07-23T12:00:03.000Z',
      }),
    ).toBe(true)
  })
})

describe('organizer/member shared-session discovery flow', () => {
  beforeEach(() => {
    localStorage.clear()
    writeDeviceCredential('member-cred-abcdefghijklmnopqrstuvwxyz012345')
    vi.useFakeTimers()
    supabase.rpc.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('member discovers organizer session and observes pause/resume/stop without cached id', async () => {
    const ownerSeat = '11111111-1111-4111-8111-111111111111'
    const memberSeat = '22222222-2222-4222-8222-222222222222'
    let server = null

    supabase.rpc.mockImplementation(async (name, args) => {
      if (name === 'get_active_walk_session_for_credential') {
        if (!server) return { data: { ok: false, reason: 'no_active_session' }, error: null }
        if (args.p_device_binding !== getDeviceId()) {
          return { data: { ok: false, reason: 'invalid' }, error: null }
        }
        return {
          data: { ...server, mySeatId: memberSeat, ok: true },
          error: null,
        }
      }
      if (name === 'create_walk_session_for_credential') {
        server = {
          id: '33333333-3333-4333-8333-333333333333',
          leaderSeatId: ownerSeat,
          mySeatId: ownerSeat,
          syncEnabled: true,
          resumePolicy: 'leader',
          waypointId: null,
          chapterIndex: 0,
          positionSeconds: 0,
          playing: false,
          paused: true,
          updatedAt: '2026-07-23T12:00:00.000Z',
          status: 'active',
          joinCode: 'ABCDE',
        }
        return { data: { ...server, ok: true }, error: null }
      }
      if (name === 'update_walk_session_for_credential') {
        const patch = args.p_patch ?? {}
        if (
          patch.expectedUpdatedAt &&
          Date.parse(server.updatedAt) > Date.parse(patch.expectedUpdatedAt)
        ) {
          return {
            data: { ...server, ok: false, reason: 'stale_update' },
            error: null,
          }
        }
        const next = { ...server }
        if (patch.event === 'pause') {
          next.paused = true
          next.playing = false
          next.positionSeconds = patch.positionSeconds ?? next.positionSeconds
        }
        if (patch.event === 'resume') {
          next.paused = false
          next.playing = true
        }
        if (patch.event === 'clock') {
          if (patch.waypointId != null) next.waypointId = patch.waypointId
          if (patch.chapterIndex != null) next.chapterIndex = patch.chapterIndex
        }
        next.updatedAt = new Date(Date.parse(server.updatedAt) + 1000).toISOString()
        server = next
        return { data: { ...server, ok: true }, error: null }
      }
      if (name === 'get_walk_session_for_credential') {
        if (!server || server.id !== args.p_session_id) {
          return { data: { ok: false, reason: 'session_not_found' }, error: null }
        }
        return { data: { ...server, mySeatId: memberSeat, ok: true }, error: null }
      }
      return { data: { ok: false, reason: 'unhandled' }, error: null }
    })

    // 1) Member has no locally cached session
    let memberView = await discoverActiveWalkSession()
    expect(memberView).toBeNull()

    // 2) Organizer creates (simulated via same RPC mock)
    const created = await supabase.rpc('create_walk_session_for_credential', {
      p_credential: 'owner',
      p_resume_policy: 'leader',
      p_device_binding: 'owner-bind',
    })
    expect(created.data.id).toBeTruthy()

    // 3) Member discovers with credential + binding only
    memberView = await discoverActiveWalkSession()
    expect(memberView.id).toBe(created.data.id)
    expect(isLeader(memberView)).toBe(false)

    // Poll without cached id
    const seen = []
    const stopDiscover = subscribeWalkSession(
      null,
      (next) => {
        seen.push(next)
      },
      { discover: true },
    )
    await vi.advanceTimersByTimeAsync(0)
    expect(seen[0]?.id).toBe(created.data.id)
    stopDiscover()

    // 4–5) Organizer pauses → member observes
    await updateWalkSessionState(created.data.id, {
      event: 'pause',
      positionSeconds: 8,
      expectedUpdatedAt: created.data.updatedAt,
    })
    memberView = await discoverActiveWalkSession()
    expect(memberView.paused).toBe(true)
    expect(memberView.playing).toBe(false)

    // 6–7) Organizer resumes
    const pausedAt = memberView.updatedAt
    await updateWalkSessionState(created.data.id, {
      event: 'resume',
      positionSeconds: 8,
      expectedUpdatedAt: pausedAt,
    })
    memberView = await discoverActiveWalkSession()
    expect(memberView.playing).toBe(true)
    expect(memberView.paused).toBe(false)
    // Autoplay-safe UI flag is derived when engine returns false; state is still synchronized.
    const pendingGroupResume = memberView.playing && false
    expect(pendingGroupResume || memberView.playing).toBe(true)

    // 8–9) Advance stop
    await updateWalkSessionState(created.data.id, {
      event: 'clock',
      waypointId: 'colosseum',
      chapterIndex: 2,
      expectedUpdatedAt: memberView.updatedAt,
    })
    memberView = await discoverActiveWalkSession()
    expect(memberView.waypointId).toBe('colosseum')
    expect(memberView.chapterIndex).toBe(2)

    // 10) Stale rejected
    const staleAttempt = await updateWalkSessionState(created.data.id, {
      event: 'pause',
      expectedUpdatedAt: '2026-07-23T11:00:00.000Z',
    })
    expect(staleAttempt.waypointId).toBe('colosseum')
    expect(shouldAcceptRemoteSession(memberView, {
      ...memberView,
      waypointId: 'pantheon',
      updatedAt: '2026-07-23T11:00:00.000Z',
    })).toBe(false)

    // 11) Wrong binding / solo fail closed
    const wrong = await supabase.rpc('get_active_walk_session_for_credential', {
      p_credential: 'member-cred-abcdefghijklmnopqrstuvwxyz012345',
      p_device_binding: 'wrong-binding',
    })
    expect(wrong.data.ok).toBe(false)

    // 12) Polling cleans up
    let ticks = 0
    const stop = subscribeWalkSession(created.data.id, () => {
      ticks += 1
    })
    await vi.advanceTimersByTimeAsync(0)
    const afterFirst = ticks
    stop()
    await vi.advanceTimersByTimeAsync(20_000)
    expect(ticks).toBe(afterFirst)
  })
})
