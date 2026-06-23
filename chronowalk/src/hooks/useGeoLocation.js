import { useState, useEffect, useRef } from 'react';
import { getDistance } from '../utils/distance';
import { COLOSSEUM, DEBUG_USER_POS } from '../data/colosseum';
import { audioOrchestrator, AUDIO_MODES } from '../audio/AudioOrchestrator';
import { fetchWaypointById } from '../services/waypointService';

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

const toAudioMode = (journeyState) => {
  if (journeyState === JOURNEY_STATE.ARRIVAL) return AUDIO_MODES.ARRIVAL;
  if (journeyState === JOURNEY_STATE.TRANSIT) return AUDIO_MODES.TRANSIT;
  return AUDIO_MODES.AMBIENT;
};

export const useGeoLocation = ({
  debugMode = false,
  target = COLOSSEUM,
  waypointId = 'colosseum',
  geofenceThresholdM = 30,
} = {}) => {
  const [state, setState] = useState(JOURNEY_STATE.TRANSIT);
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
  const audioFilesRef = useRef(null);
  const audioReadyRef = useRef(false);
  const lastAudioStateRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    fetchWaypointById(waypointId)
      .then((waypoint) => {
        if (cancelled) return;

        audioFilesRef.current = {
          ambient_url: waypoint.ambient_url,
          transit_narrative_url: waypoint.transit_narrative_url,
          arrival_immersive_url: waypoint.arrival_immersive_url,
        };
        audioReadyRef.current = true;
        audioOrchestrator.transitionTo(AUDIO_MODES.AMBIENT, audioFilesRef.current);
      })
      .catch((err) => console.error('Failed to load waypoint audio:', err));

    return () => {
      cancelled = true;
      audioOrchestrator.stop();
    };
  }, [waypointId]);

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
  }, [debugMode, target, geofenceThresholdM]);

  useEffect(() => {
    if (!state || !audioReadyRef.current) return;
    if (state === lastAudioStateRef.current) return;

    lastAudioStateRef.current = state;
    audioOrchestrator.transitionTo(toAudioMode(state), audioFilesRef.current);
  }, [state]);

  useEffect(() => {
    if (!journey.status) return;
    setState(journey.status);
  }, [journey.status]);

  return { ...journey, state };
};
