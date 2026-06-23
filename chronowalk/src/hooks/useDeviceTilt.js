import { useState, useEffect, useRef, useCallback } from 'react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

/**
 * Returns tilt as degrees relative to the first reading after `enabled` turns on.
 * Small deltas only — suitable for subtle parallax, not full-device rotation.
 */
export const useDeviceTilt = (enabled = true) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const baselineRef = useRef(null);

  const recalibrate = useCallback(() => {
    baselineRef.current = null;
    setTilt({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!enabled) {
      baselineRef.current = null;
      setTilt({ x: 0, y: 0 });
      setIsActive(false);
      return undefined;
    }

    const handleOrientation = (event) => {
      if (event.gamma == null && event.beta == null) return;

      const gamma = event.gamma ?? 0;
      const beta = event.beta ?? 0;

      if (!baselineRef.current) {
        baselineRef.current = { gamma, beta };
      }

      const deltaX = clamp(gamma - baselineRef.current.gamma, -10, 10);
      const deltaY = clamp(beta - baselineRef.current.beta, -10, 10);

      setTilt({ x: deltaX, y: deltaY });
      setIsActive(true);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [enabled]);

  return { x: tilt.x, y: tilt.y, isActive, recalibrate };
};
