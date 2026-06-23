import { useState, useEffect } from 'react';

const COLOSSEUM = { lat: 41.8902, lng: 12.4922 };

export const useGeoLocation = (debugMode = false) => {
  const [position, setPosition] = useState(
    debugMode ? COLOSSEUM : { lat: null, lng: null }
  );

  useEffect(() => {
    if (debugMode) {
      setPosition(COLOSSEUM);
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
