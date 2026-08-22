import { describe, expect, it } from 'vitest'
import { DemoTravelerAppService } from '../demo/DemoTravelerAppService'
import type { SessionContext, TravelerProfile } from '@chronowalk/domain'

const session: SessionContext = {
  cityId: 'rome',
  locationMode: 'planning',
  permission: 'skipped',
  startedAtIso: '2026-08-22T00:00:00.000Z',
}

function profile(timeBudgetMin: 60 | 120 | 180): TravelerProfile {
  return {
    interests: ['antiquity'],
    explorationStyle: 'mixed',
    mobility: 'walking',
    timeBudgetMin,
  }
}

describe('demo fixture mapping', () => {
  const service = new DemoTravelerAppService()

  it('exposes the required time report fields', () => {
    for (const budget of [60, 120, 180] as const) {
      const route = service.composeProposal(profile(budget), session)
      expect(route.time).toEqual(
        expect.objectContaining({
          targetBudgetMin: expect.any(Number),
          experienceMin: expect.any(Number),
          walkingMin: expect.any(Number),
          bufferMin: expect.any(Number),
          totalEstimatedMin: expect.any(Number),
          budgetDeltaMin: expect.any(Number),
          timeFit: expect.stringMatching(/under|fit|over|unknown/),
        }),
      )
      expect(route.demoOnly).toBe(true)
    }
  })

  it('returns distinct drafts for 60/120/180 or an honest single alternative', () => {
    const a = service.composeProposal(profile(60), session)
    const b = service.composeProposal(profile(120), session)
    const c = service.composeProposal(profile(180), session)
    const ids = new Set([a.id, b.id, c.id])
    expect(ids.size).toBe(3)
  })
})

describe('adaptRoute', () => {
  const service = new DemoTravelerAppService()

  it('skip removes a stop without inventing times', () => {
    const route = service.composeProposal(profile(120), session)
    const target = route.items.find((item) => item.kind === 'experience')
    expect(target).toBeTruthy()
    const { route: next, delta } = service.adaptRoute(route, { type: 'skip', itemId: target!.id }, 0)
    expect(next.items.find((item) => item.id === target!.id)).toBeUndefined()
    expect(delta.removedIds).toContain(target!.id)
    expect(delta.notes.join(' ')).toMatch(/penalty|Skipped/i)
  })

  it('time change swaps to another published draft', () => {
    const route = service.composeProposal(profile(120), session)
    const { route: next, delta } = service.adaptRoute(route, { type: 'time', budget: 60 }, 0)
    expect(next.id).not.toBe(route.id)
    expect(delta.notes.length).toBeGreaterThan(0)
  })
})
