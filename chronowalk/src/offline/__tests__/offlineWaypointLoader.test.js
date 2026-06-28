import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROME_CORE_TOUR } from '../../data/rome-core-tour'

vi.mock('../tourPackage.js', () => ({
  isTourDownloaded: vi.fn(async () => true),
  resolveOfflineMediaUrl: vi.fn(async (_tourId, _stopId, field) =>
    field === 'ambient_url' ? 'blob:offline-ambient' : null
  ),
}))

vi.mock('../offlineStorage.js', () => ({
  getOfflineWaypointRecord: vi.fn(),
}))

vi.mock('../../services/waypointService.js', () => ({
  fetchWaypointById: vi.fn(),
  normalizeWaypoint: (waypoint) => waypoint,
  resolveAssetUrl: (url) => url,
}))

import { fetchWaypointForTour } from '../offlineWaypointLoader'
import { getOfflineWaypointRecord } from '../offlineStorage'
import { fetchWaypointById } from '../../services/waypointService'
import { isTourDownloaded } from '../tourPackage'

describe('offlineWaypointLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    })
  })

  it('hydrates downloaded media URLs after an online fetch', async () => {
    vi.mocked(fetchWaypointById).mockResolvedValue({
      id: 'colosseum',
      title: 'Colosseum',
      ambient_url: 'https://example.com/ambient.mp3',
    })

    const waypoint = await fetchWaypointForTour(ROME_CORE_TOUR.id, 'colosseum')

    expect(isTourDownloaded).toHaveBeenCalledWith(ROME_CORE_TOUR.id)
    expect(waypoint.ambient_url).toBe('blob:offline-ambient')
  })

  it('loads offline records when the browser is offline', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    })

    vi.mocked(getOfflineWaypointRecord).mockResolvedValue({
      stopId: 'colosseum',
      title: 'Colosseum',
      metadata: {
        ambient_url: 'https://example.com/ambient.mp3',
      },
    })

    const waypoint = await fetchWaypointForTour(ROME_CORE_TOUR.id, 'colosseum')

    expect(fetchWaypointById).not.toHaveBeenCalled()
    expect(waypoint.id).toBe('colosseum')
    expect(waypoint.ambient_url).toBe('blob:offline-ambient')
  })
})
