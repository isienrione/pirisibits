import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpcMock = vi.fn()

vi.mock('../supabase.js', () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    rpc: (...args) => rpcMock(...args),
  },
}))

vi.mock('../deviceId.js', () => ({
  getDeviceId: () => 'test-device-binding',
}))

describe('journeyCloud', () => {
  beforeEach(() => {
    localStorage.clear()
    rpcMock.mockReset()
    vi.resetModules()
  })

  it('pulls a remote snapshot for a token', async () => {
    rpcMock.mockResolvedValue({
      data: {
        snapshot: {
          state: 'walking',
          context: { currentSequenceIndex: 4, completedWaypointIds: ['w01'] },
        },
      },
      error: null,
    })

    const { pullJourneyProgress } = await import('../journeyCloud.js')
    const snapshot = await pullJourneyProgress('550e8400-e29b-41d4-a716-446655440000')

    expect(rpcMock).toHaveBeenCalledWith('get_journey_progress', {
      p_token: '550e8400-e29b-41d4-a716-446655440000',
      p_device_binding: 'test-device-binding',
    })
    expect(snapshot.state).toBe('walking')
    expect(snapshot.context.currentSequenceIndex).toBe(4)
  })

  it('pushes a snapshot via upsert RPC', async () => {
    rpcMock.mockResolvedValue({ data: { ok: true }, error: null })
    const { pushJourneyProgress } = await import('../journeyCloud.js')

    const result = await pushJourneyProgress(
      { state: 'walking', context: { currentSequenceIndex: 2 } },
      '550e8400-e29b-41d4-a716-446655440000',
    )

    expect(result.ok).toBe(true)
    expect(rpcMock).toHaveBeenCalledWith('upsert_journey_progress', {
      p_token: '550e8400-e29b-41d4-a716-446655440000',
      p_snapshot: { state: 'walking', context: { currentSequenceIndex: 2 } },
      p_device_binding: 'test-device-binding',
    })
  })
})
