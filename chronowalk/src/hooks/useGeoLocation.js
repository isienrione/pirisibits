import { useState, useEffect, useCallback } from 'react';
import { getDistance } from '../utils/distance';
import { COLOSSEUM } from '../data/colosseum';
import { isDebugGeo } from '../config/env';

export const JOURNEY_STATE = {
  TRANSIT: 'TRANSIT',
  ARRIVAL: 'ARRIVAL',
};

export const LOCATION_STATUS = {
  WAITING: 'waiting',
  GRANTED: 'granted',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
};

const emptyJourney = { lat: null, lng: null, distance: null, status: null };

const mapGeoError = (err) => {
  if (!err) return LOCATION_STATUS.UNAVAILABLE;
  switch (err.code) {
    case 1:
      return LOCATION_STATUS.DENIED;
    case 2:
      return LOCATION_STATUS.UNAVAILABLE;
    case 3:
      return LOCATION_STATUS.WAITING;
    default:
      return LOCATION_STATUS.UNAVAILABLE;
  }
};

const resolveJourneyState = (lat, lng, target, geofenceThresholdM) => {
  if (lat == null || lng == null || !target) {
    return emptyJourney;
  }

  const distance = getDistance(lat, lng, target.lat, target.lng);
  const status =
    distance > geofenceThresholdM
      ? JOURNEY_STATE.TRANSIT
      : JOURNEY_STATE.ARRIVAL;

  return { lat, lng, distance, status };
};

export const useGeoLocation = ({
  debugMode = isDebugGeo(),
  target = COLOSSEUM,
  debugPosition = null,
  simulateAtTarget = false,
  geofenceThresholdM = 30,
} = {}) => {
  const debugPos =
    debugPosition ??
    (simulateAtTarget && target ? { lat: target.lat, lng: target.lng } : null);

  const [state, setState] = useState(JOURNEY_STATE.TRANSIT);
  const [locationStatus, setLocationStatus] = useState(() =>
    debugMode ? LOCATION_STATUS.GRANTED : LOCATION_STATUS.WAITING
  );
  // Radius of uncertainty in metres (null when unknown / simulated).
  const [accuracy, setAccuracy] = useState(null);
  const [watchKey, setWatchKey] = useState(0);
  const [journey, setJourney] = useState(() =>
    debugMode && debugPos
      ? resolveJourneyState(
          debugPos.lat,
          debugPos.lng,
          target,
          geofenceThresholdM
        )
      : emptyJourney
  );

  const retryLocation = useCallback(() => {
    setLocationStatus(LOCATION_STATUS.WAITING);
    setWatchKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (simulateAtTarget && target) {
      setLocationStatus(LOCATION_STATUS.GRANTED);
      setJourney(
        resolveJourneyState(target.lat, target.lng, target, geofenceThresholdM)
      );
      return;
    }

    if (debugMode) {
      setLocationStatus(LOCATION_STATUS.GRANTED);
      if (debugPos?.lat != null && debugPos?.lng != null) {
        setJourney(
          resolveJourneyState(
            debugPos.lat,
            debugPos.lng,
            target,
            geofenceThresholdM
          )
        );
      }
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus(LOCATION_STATUS.UNAVAILABLE);
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLocationStatus(LOCATION_STATUS.GRANTED);
        setAccuracy(
          typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null
        );
        // resolveJourneyState guards a null target (transit legs with no
        // waypoint geofence) and already carries the arrival status, which the
        // journey.status effect below applies. Reading target.lat here instead
        // would throw on the first fix when the target is null.
        setJourney(resolveJourneyState(lat, lng, target, geofenceThresholdM));
      },
      (err) => {
        console.error(err);
        setLocationStatus(mapGeoError(err));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [debugMode, debugPos?.lat, debugPos?.lng, simulateAtTarget, target, geofenceThresholdM, watchKey]);

  useEffect(() => {
    if (!journey.status) return;
    setState(journey.status);
  }, [journey.status]);

  return {
    position: { lat: journey.lat, lng: journey.lng },
    state,
    distance: journey.distance,
    accuracy,
    locationStatus,
    retryLocation,
  };
};
