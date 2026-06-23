import React, { useEffect } from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MAX_SHIFT_PX = 12;

const BeforeAfterSlider = ({ modernImg, historicImg, depthMap, tiltEnabled = false }) => {
  const { x, y, isActive, recalibrate } = useDeviceTilt(tiltEnabled);

  useEffect(() => {
    if (tiltEnabled) recalibrate();
  }, [tiltEnabled, historicImg, recalibrate]);

  const pxPerDegree = depthMap ? 1.15 : 0.95;
  const offsetX = clamp(x * pxPerDegree, -MAX_SHIFT_PX, MAX_SHIFT_PX);
  const offsetY = clamp(y * pxPerDegree, -MAX_SHIFT_PX, MAX_SHIFT_PX);

  const imageProps = {
    style: { width: '100%', height: '100%', objectFit: 'cover' },
    referrerPolicy: 'no-referrer',
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border-4 border-white shadow-lg">
      <div className="h-80 w-full">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage src={modernImg} alt="Modern Colosseum" {...imageProps} />
          }
          itemTwo={
            <div className="relative h-full w-full overflow-hidden bg-stone-900">
              <div
                className="absolute h-[118%] w-[118%] -left-[9%] -top-[9%]"
                style={{
                  transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
                  transition: 'transform 0.08s ease-out',
                  willChange: 'transform',
                }}
              >
                <ReactCompareSliderImage
                  src={historicImg}
                  alt="Historic Colosseum illustration"
                  {...imageProps}
                />
              </div>
            </div>
          }
        />
      </div>
      <p className="bg-stone-900 px-3 py-2 text-center text-xs text-stone-400">
        {tiltEnabled && isActive ? (
          <>
            Hold the phone as you view the screen, then tilt gently for depth.
            <button
              type="button"
              onClick={recalibrate}
              className="ml-1 text-amber-400 underline underline-offset-2"
            >
              Reset center
            </button>
          </>
        ) : (
          'Drag the handle to compare today’s Colosseum with a historic view.'
        )}
      </p>
    </div>
  );
};

export default BeforeAfterSlider;
