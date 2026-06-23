import { useState, useEffect } from 'react';
import { DEBUG_USER_POS } from '../data/colosseum';

export const useGeoLocation = (debugMode = false) => {
  const [position, setPosition] = useState(
    debugMode ? DEBUG_USER_POS : { lat: null, lng: null }
  );

  useEffect(() => {
    if (debugMode) {
      setPosition(DEBUG_USER_POS);
      return;
    }

    if (!navigator.geolocation) return;

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [debugMode]);

  return position;
};
