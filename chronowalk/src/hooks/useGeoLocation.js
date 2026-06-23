import { useState, useEffect } from 'react';
import { getDistance } from '../utils/distance';
import { COLOSSEUM, DEBUG_USER_POS } from '../data/colosseum';

export const JOURNEY_STATE = {
  TRANSIT: 'TRANSIT',
  ARRIVAL: 'ARRIVAL',
};

const emptyJourney = { lat: null, lng: null, distance: null, status: null };

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
  debugMode = false,
  target = COLOSSEUM,
  geofenceThresholdM = 30,
} = {}) => {
  const [journey, setJourney] = useState(() =>
    debugMode
      ? resolveJourneyState(
          DEBUG_USER_POS.lat,
          DEBUG_USER_POS.lng,
          target,
          geofenceThresholdM
        )
      : emptyJourney
  );

  useEffect(() => {
    if (debugMode) {
      setJourney(
        resolveJourneyState(
          DEBUG_USER_POS.lat,
          DEBUG_USER_POS.lng,
          target,
          geofenceThresholdM
        )
      );
      return;
    }

    if (!navigator.geolocation) return;

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        setJourney(
          resolveJourneyState(
            pos.coords.latitude,
            pos.coords.longitude,
            target,
            geofenceThresholdM
          )
        );
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [debugMode, target, geofenceThresholdM]);

  return journey;
};
