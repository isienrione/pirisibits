import type {
  ComposedRoute,
  RouteDelta,
  RouteItemView,
  SessionContext,
  TravelerProfile,
  WhyReason,
} from '@chronowalk/domain'
import type { AdaptAction, TravelerAppService } from './TravelerAppService'
import fixture from './generated/mobileFixture.json'

type Fixture = typeof fixture

export class DemoTravelerAppService implements TravelerAppService {
  readonly demoOnly = true as const

  constructor(private readonly data: Fixture = fixture) {}

  composeProposal(profile: TravelerProfile, _session: SessionContext): ComposedRoute {
    const route = this.data.routes[String(profile.timeBudgetMin) as '60' | '120' | '180']
    if (!route) {
      return this.data.routes['120'] as unknown as ComposedRoute
    }
    const interests = new Set(profile.interests)
    const why: WhyReason[] = [...((route.why ?? []) as WhyReason[])]
    if (interests.has('antiquity')) {
      why.unshift({
        id: 'interest-antiquity',
        kind: 'interest',
        statement: 'Your antiquity interest matches the Forum / Colosseum sequence already in the Rome manifest.',
        sourceId: 'manifest.waypoints.*.zone',
      })
    }
    if (interests.has('living-city')) {
      why.unshift({
        id: 'interest-city',
        kind: 'interest',
        statement: 'Living-city interest is recorded. This demo draft still opens on the documented antiquity sequence; it does not pretend to re-score the city.',
        sourceId: 'DEMO_ONLY',
      })
    }
    return { ...(route as unknown as ComposedRoute), why }
  }

  adaptRoute(route: ComposedRoute, action: AdaptAction, cursor: number): { route: ComposedRoute; delta: RouteDelta } {
    if (action.type === 'time') {
      const next = this.data.routes[String(action.budget) as '60' | '120' | '180'] as unknown as ComposedRoute
      return {
        route: next,
        delta: diffRoutes(route, next, 'Time changed. Demo swapped to the other published draft for that budget.'),
      }
    }
    if (action.type === 'stay') {
      return {
        route,
        delta: {
          timeDeltaMin: 0,
          walkingDeltaMin: 0,
          removedIds: [],
          addedIds: [],
          remainingIds: route.items.map((item) => item.id),
          notes: ['You kept the current draft.'],
        },
      }
    }
    if (action.type === 'skip') {
      const items = route.items.filter((item) => item.id !== action.itemId)
      const next = withItems(route, items, 'Stop removed. Remainder kept in published order.')
      return { route: next, delta: diffRoutes(route, next, 'Skipped without penalty.') }
    }
    if (action.type === 'choose' && action.optionId === 'skip-to-largo') {
      const head = route.items.slice(0, cursor + 1)
      const mystery = route.items.find((item) => item.treatment === 'mystery')
      const items = mystery ? [...head.filter((item) => item.id !== mystery.id), mystery] : head
      const next = withItems(route, items, 'Remainder collapsed onto the sealed later room.')
      return { route: next, delta: diffRoutes(route, next, 'Bifurcation: later room becomes next.') }
    }
    if (action.type === 'choose' && action.optionId === 'close-day') {
      const items = route.items.slice(0, cursor + 1)
      const next = withItems(route, items, 'Day closed after the current stop.')
      return { route: next, delta: diffRoutes(route, next, 'Closed the remainder.') }
    }
    return {
      route,
      delta: {
        timeDeltaMin: 0,
        walkingDeltaMin: 0,
        removedIds: [],
        addedIds: [],
        remainingIds: route.items.map((item) => item.id),
        notes: ['Follow the plan — no delta.'],
      },
    }
  }
}

function withItems(route: ComposedRoute, items: RouteItemView[], honesty: string): ComposedRoute {
  const experienceMin = items.reduce((sum, item) => sum + (item.experienceMin ?? 0), 0)
  const walkingMin = items.reduce((sum, item) => sum + (item.walkingMin ?? 0), 0)
  const walkingMinComplete = items.filter((item) => item.kind === 'walk').every((item) => item.walkingMin != null)
  const bufferMin = route.time.bufferMin
  const totalEstimatedMin = experienceMin + walkingMin + bufferMin
  const budgetDeltaMin = totalEstimatedMin - route.time.targetBudgetMin
  return {
    ...route,
    items,
    honestyLine: `${route.honestyLine} ${honesty}`,
    time: {
      ...route.time,
      experienceMin,
      walkingMin,
      totalEstimatedMin,
      budgetDeltaMin,
      walkingMinComplete,
      timeFit: walkingMinComplete
        ? Math.abs(budgetDeltaMin) <= 10
          ? 'fit'
          : budgetDeltaMin < 0
            ? 'under'
            : 'over'
        : 'unknown',
    },
  }
}

function diffRoutes(before: ComposedRoute, after: ComposedRoute, note: string): RouteDelta {
  const beforeIds = before.items.map((item) => item.id)
  const afterIds = after.items.map((item) => item.id)
  return {
    timeDeltaMin:
      before.time.walkingMinComplete && after.time.walkingMinComplete
        ? after.time.totalEstimatedMin - before.time.totalEstimatedMin
        : null,
    walkingDeltaMin:
      before.time.walkingMinComplete && after.time.walkingMinComplete
        ? after.time.walkingMin - before.time.walkingMin
        : null,
    removedIds: beforeIds.filter((id) => !afterIds.includes(id)),
    addedIds: afterIds.filter((id) => !beforeIds.includes(id)),
    remainingIds: afterIds,
    notes: [note],
  }
}

export const demoService = new DemoTravelerAppService()
