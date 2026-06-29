import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { FREE_PREVIEW_STOP_ID } from '../../data/freePreview'
import { ROME_CORE_TOUR } from '../../data/rome-core-tour'
import { useTourSession } from '../useTourSession'

describe('useTourSession free preview', () => {
  it('marks only the preview stop as current and others as locked', () => {
    const { result } = renderHook(() =>
      useTourSession({
        tour: ROME_CORE_TOUR,
        singleWaypointId: null,
        previewUnlockedStopIds: [FREE_PREVIEW_STOP_ID],
        hasInteracted: false,
      })
    )

    expect(result.current.isPreviewMode).toBe(true)
    expect(result.current.mapStops).toHaveLength(ROME_CORE_TOUR.stopIds.length)

    const colosseum = result.current.mapStops.find((stop) => stop.id === FREE_PREVIEW_STOP_ID)
    const locked = result.current.mapStops.filter((stop) => stop.status === 'locked')

    expect(colosseum?.status).toBe('current')
    expect(locked).toHaveLength(ROME_CORE_TOUR.stopIds.length - 1)
  })
})
