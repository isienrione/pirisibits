import { useEffect } from 'react';
import { audioOrchestrator } from '../audio/AudioOrchestrator';
import { shouldPrefetchArrival } from '../audio/audioMedia';

/**
 * Warm the arrival track while the visitor is still approaching the geofence.
 */
export const useArrivalAudioPrefetch = ({
  enabled,
  distance,
  arrivalUrl,
  prefetchRadiusM,
}) => {
  useEffect(() => {
    if (
      !shouldPrefetchArrival({
        enabled: enabled && Boolean(arrivalUrl),
        distance,
        prefetchRadiusM,
      })
    ) {
      return;
    }

    audioOrchestrator.prefetchArrival(arrivalUrl);
  }, [enabled, distance, arrivalUrl, prefetchRadiusM]);
};
