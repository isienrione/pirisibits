/**
 * Gate 2E — Route Lab URL / dev state encoding.
 */

import type { RouteRequestInput } from '@/src/engine/routes/route-request'

export type RouteLabUrlState = {
  fixture: string | null
  candidateRouteId: string | null
  selectedStopStgoId: string | null
  customRequest: Partial<RouteRequestInput> | null
}

export function parseRouteLabUrlState(search: string): RouteLabUrlState {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  return {
    fixture: q.get('fixture'),
    candidateRouteId: q.get('candidate'),
    selectedStopStgoId: q.get('stop'),
    customRequest: null,
  }
}

export function serializeRouteLabUrlState(state: RouteLabUrlState): string {
  const q = new URLSearchParams()
  if (state.fixture) q.set('fixture', state.fixture)
  if (state.candidateRouteId) q.set('candidate', state.candidateRouteId)
  if (state.selectedStopStgoId) q.set('stop', state.selectedStopStgoId)
  const s = q.toString()
  return s ? `?${s}` : ''
}

export function curatorDeepLink(stgoId: string, cockpitPath = '/docs/engine/gate-2a1-founder-calibration-cockpit.html'): string {
  return `${cockpitPath}?stgoId=${encodeURIComponent(stgoId)}`
}
