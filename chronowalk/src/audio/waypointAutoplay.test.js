import { describe, expect, it, vi } from 'vitest'
import { createWaypointAutoplayCoordinator } from './waypointAutoplay.js'

describe('createWaypointAutoplayCoordinator', () => {
  it('returns the same promise for concurrent starts on one waypoint', async () => {
    const coordinator = createWaypointAutoplayCoordinator()
    let resolveStart
    const start = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveStart = () => resolve(true)
        }),
    )

    const first = coordinator.ensureStarted('w01', {}, start)
    const second = coordinator.ensureStarted('w01', {}, start)

    expect(first).toBe(second)
    expect(start).toHaveBeenCalledTimes(1)

    resolveStart()
    await expect(first).resolves.toBe(true)
    expect(coordinator.getStartedWaypointId()).toBe('w01')
  })

  it('allows retry when a stale started guard is not actually playing', async () => {
    const coordinator = createWaypointAutoplayCoordinator()
    coordinator.markStarted('w01')

    const start = vi.fn(async () => true)
    const started = await coordinator.ensureStarted(
      'w01',
      { isPlaying: () => false },
      start,
    )

    expect(started).toBe(true)
    expect(start).toHaveBeenCalledTimes(1)
  })

  it('skips duplicate work when narration is already live', async () => {
    const coordinator = createWaypointAutoplayCoordinator()
    coordinator.markStarted('w01')

    const start = vi.fn(async () => true)
    const started = await coordinator.ensureStarted(
      'w01',
      { isPlaying: () => true },
      start,
    )

    expect(started).toBe(true)
    expect(start).toHaveBeenCalledTimes(0)
  })
})
