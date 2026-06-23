import { useState, useEffect } from 'react';

export const useDeviceTilt = () => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleOrientation = (event) => {
      // Gamma is left-to-right tilt, Beta is front-to-back
      setTilt({ x: event.gamma, y: event.beta });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  return tilt;
};
