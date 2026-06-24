import { useState, useEffect } from 'react';
import { getDistance } from '../utils/distance';
import { COLOSSEUM } from '../data/colosseum';
import { isDebugGeo } from '../config/env';

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
  debugMode = isDebugGeo(),
  target = COLOSSEUM,
  debugPosition = null,
  geofenceThresholdM = 30,
} = {}) => {
  const debugPos = debugPosition ?? { lat: target.lat, lng: target.lng };

  const [state, setState] = useState(JOURNEY_STATE.TRANSIT);
  const [journey, setJourney] = useState(() =>
    debugMode
      ? resolveJourneyState(
          debugPos.lat,
          debugPos.lng,
          target,
          geofenceThresholdM
        )
      : emptyJourney
  );

  useEffect(() => {
    if (debugMode) {
      setJourney(
        resolveJourneyState(
          debugPos.lat,
          debugPos.lng,
          target,
          geofenceThresholdM
        )
      );
      return;
    }

    if (!navigator.geolocation) return;

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setJourney(resolveJourneyState(lat, lng, target, geofenceThresholdM));

        const dist = getDistance(lat, lng, target.lat, target.lng);
        const newState =
          dist <= geofenceThresholdM
            ? JOURNEY_STATE.ARRIVAL
            : JOURNEY_STATE.TRANSIT;

        setState(newState);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [debugMode, debugPos.lat, debugPos.lng, target, geofenceThresholdM]);

  useEffect(() => {
    if (!journey.status) return;
    setState(journey.status);
  }, [journey.status]);

  return {
    position: { lat: journey.lat, lng: journey.lng },
    state,
    distance: journey.distance,
  };
};
