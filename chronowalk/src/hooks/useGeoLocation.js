import { useState, useEffect, useCallback } from 'react';
import { getDistance } from '../utils/distance';
import { COLOSSEUM } from '../data/colosseum';
import { isDebugGeo } from '../config/env';
import {
  getLocationSession,
  subscribeLocationSession,
  LOCATION_PERMISSION,
  LOCATION_FIX_STATUS,
} from '../platform/location/index.js';

export const JOURNEY_STATE = {
  TRANSIT: 'TRANSIT',
  ARRIVAL: 'ARRIVAL',
};

export const LOCATION_STATUS = {
  WAITING: 'waiting',
  SEARCHING: 'searching',
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
      return LOCATION_STATUS.SEARCHING;
    default:
      return LOCATION_STATUS.UNAVAILABLE;
  }
};

function statusFromSession(session) {
  if (!session) return null;
  if (session.permission === LOCATION_PERMISSION.DENIED) {
    return LOCATION_STATUS.DENIED;
  }
  if (session.permission === LOCATION_PERMISSION.GRANTED) {
    if (session.fixStatus === LOCATION_FIX_STATUS.AVAILABLE && session.position) {
      return LOCATION_STATUS.GRANTED;
    }
    if (session.fixStatus === LOCATION_FIX_STATUS.UNAVAILABLE) {
      return LOCATION_STATUS.UNAVAILABLE;
    }
    return LOCATION_STATUS.SEARCHING;
  }
  return null;
}

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
    setLocationStatus(LOCATION_STATUS.SEARCHING);
    setWatchKey((current) => current + 1);
  }, []);

  // Apply session permission/fix updates (including late GPS after enable).
  useEffect(() => {
    if (debugMode || simulateAtTarget) return undefined;

    const applySession = (session) => {
      const nextStatus = statusFromSession(session);
      if (nextStatus) setLocationStatus(nextStatus);
      if (
        session?.permission === LOCATION_PERMISSION.GRANTED &&
        session.position?.lat != null &&
        session.position?.lng != null
      ) {
        setAccuracy(
          typeof session.position.accuracyM === 'number'
            ? session.position.accuracyM
            : null
        );
        setJourney(
          resolveJourneyState(
            session.position.lat,
            session.position.lng,
            target,
            geofenceThresholdM
          )
        );
      }
    };

    applySession(getLocationSession());
    return subscribeLocationSession(applySession);
  }, [debugMode, simulateAtTarget, target, geofenceThresholdM]);

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
      const session = getLocationSession();
      if (session.permission === LOCATION_PERMISSION.GRANTED) {
        setLocationStatus(LOCATION_STATUS.SEARCHING);
      } else {
        setLocationStatus(LOCATION_STATUS.UNAVAILABLE);
      }
      return;
    }

    const session = getLocationSession();
    if (session.permission === LOCATION_PERMISSION.GRANTED && !session.position) {
      setLocationStatus(LOCATION_STATUS.SEARCHING);
    }

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLocationStatus(LOCATION_STATUS.GRANTED);
        setAccuracy(
          typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null
        );
        setJourney(resolveJourneyState(lat, lng, target, geofenceThresholdM));

        const dist = getDistance(lat, lng, target.lat, target.lng);
        const newState =
          dist <= geofenceThresholdM
            ? JOURNEY_STATE.ARRIVAL
            : JOURNEY_STATE.TRANSIT;

        setState(newState);
      },
      (err) => {
        // Permission denied is terminal; timeout/unavailable while granted stays searchable.
        const sessionNow = getLocationSession();
        if (err?.code === 1) {
          setLocationStatus(LOCATION_STATUS.DENIED);
          return;
        }
        if (sessionNow.permission === LOCATION_PERMISSION.GRANTED) {
          setLocationStatus(
            err?.code === 3 ? LOCATION_STATUS.SEARCHING : LOCATION_STATUS.UNAVAILABLE
          );
          return;
        }
        setLocationStatus(mapGeoError(err));
      },
      // Continuous watch for the active walk — initial enable used a bounded one-shot.
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
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
