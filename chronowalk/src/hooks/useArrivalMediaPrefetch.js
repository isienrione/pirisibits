import { useEffect } from 'react'
import { shouldPrefetchArrival } from '../audio/audioMedia'
import { prefetchArrivalSliderMedia } from '../utils/sliderMedia'

/**
 * Warm slider posters and video metadata while the visitor is still approaching the geofence.
 */
export const useArrivalMediaPrefetch = ({
  enabled,
  distance,
  waypoint,
  prefetchRadiusM,
}) => {
  useEffect(() => {
    if (
      !shouldPrefetchArrival({
        enabled: enabled && Boolean(waypoint),
        distance,
        prefetchRadiusM,
      })
    ) {
      return
    }

    prefetchArrivalSliderMedia(waypoint)
  }, [enabled, distance, waypoint, prefetchRadiusM])
}
