import type { LocationSignal } from '@chronowalk/domain'
import type { SystemSim } from '../state/types'

export const WEAK_ACCURACY_M = 40

export type LocationInput = {
  permission: 'checking' | 'denied' | 'granted' | 'planning'
  fix: { lat: number; lng: number; accuracyM: number } | null
  errorMessage?: string
  sim: SystemSim
}

export function reduceLocationSignal(input: LocationInput): LocationSignal {
  if (input.sim === 'planning' || input.permission === 'planning') return { status: 'planning' }
  if (input.sim === 'permission-denied' || input.permission === 'denied') return { status: 'denied' }
  if (input.sim === 'gps-weak') {
    return {
      status: 'weak',
      lat: input.fix?.lat ?? null,
      lng: input.fix?.lng ?? null,
      accuracyM: input.fix?.accuracyM ?? 80,
    }
  }
  if (input.permission === 'checking') return { status: 'checking' }
  if (input.errorMessage) return { status: 'error', message: input.errorMessage }
  if (input.permission === 'granted' && !input.fix) return { status: 'granted-awaiting-fix' }
  if (input.permission === 'granted' && input.fix) {
    if (input.fix.accuracyM > WEAK_ACCURACY_M) {
      return { status: 'weak', lat: input.fix.lat, lng: input.fix.lng, accuracyM: input.fix.accuracyM }
    }
    return { status: 'ok', lat: input.fix.lat, lng: input.fix.lng, accuracyM: input.fix.accuracyM }
  }
  return { status: 'planning' }
}

export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (n: number) => (n * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}

export function shouldOfferArrival(
  location: LocationSignal,
  target: { lat: number; lng: number; radiusM: number } | null,
): boolean {
  if (!target || location.status !== 'ok') return false
  return distanceMeters(location, target) <= target.radiusM
}
