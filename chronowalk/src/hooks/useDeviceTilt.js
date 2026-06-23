import { useState, useEffect } from 'react';

export const requestDeviceTiltPermission = async () => {
  if (typeof window === 'undefined') return false;

  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.warn('Device orientation permission denied:', err);
      return false;
    }
  }

  return 'DeviceOrientationEvent' in window;
};

export const useDeviceTilt = (enabled = true) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsActive(false);
      return undefined;
    }

    const handleOrientation = (event) => {
      if (event.gamma == null && event.beta == null) return;

      setTilt({
        x: event.gamma ?? 0,
        y: (event.beta ?? 0) - 45,
      });
      setIsActive(true);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [enabled]);

  return { x: tilt.x, y: tilt.y, isActive };
};
