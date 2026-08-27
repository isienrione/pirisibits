import type {
  ComposedRoute,
  RouteDelta,
  SessionContext,
  TimeBudgetMin,
  TravelerProfile,
} from '@chronowalk/domain'

export type AdaptAction =
  | { type: 'time'; budget: TimeBudgetMin }
  | { type: 'skip'; itemId: string }
  | { type: 'choose'; optionId: string }
  | { type: 'stay' }

export type TravelerAppService = {
  composeProposal(profile: TravelerProfile, session: SessionContext): ComposedRoute
  adaptRoute(
    route: ComposedRoute,
    action: AdaptAction,
    cursor: number,
  ): { route: ComposedRoute; delta: RouteDelta }
}

export const DEMO_ONLY = 'DEMO_ONLY' as const
