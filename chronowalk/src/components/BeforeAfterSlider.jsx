import React, { useEffect } from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MAX_SHIFT_PX = 30;

const BeforeAfterSlider = ({ modernImg, historicImg, depthMap, tiltEnabled = false }) => {
  const { x, y, isActive, recalibrate } = useDeviceTilt(tiltEnabled);

  useEffect(() => {
    if (tiltEnabled) recalibrate();
  }, [tiltEnabled, historicImg, recalibrate]);

  const depthBoost = depthMap ? 1.15 : 1;
  const offsetX = clamp(x * 2.1 * depthBoost, -MAX_SHIFT_PX, MAX_SHIFT_PX);
  const offsetY = clamp(y * 2.1 * depthBoost, -MAX_SHIFT_PX, MAX_SHIFT_PX);
  const rotateY = clamp(x * 0.75 * depthBoost, -9, 9);
  const rotateX = clamp(-y * 0.55 * depthBoost, -7, 7);

  const imageProps = {
    style: { width: '100%', height: '100%', objectFit: 'cover' },
    referrerPolicy: 'no-referrer',
  };

  const parallaxTransform = tiltEnabled
    ? `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${offsetX}px, ${offsetY}px, 0) scale(1.06)`
    : 'none';

  return (
    <div className="w-full overflow-hidden rounded-xl border-4 border-white shadow-lg">
      <div className="h-80 w-full">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage src={modernImg} alt="Modern Colosseum" {...imageProps} />
          }
          itemTwo={
            <div
              className="relative h-full w-full overflow-hidden bg-stone-900"
              style={{ perspective: '900px' }}
            >
              <div
                className="absolute h-[132%] w-[132%] -left-[16%] -top-[16%]"
                style={{
                  transform: parallaxTransform,
                  transition: 'transform 0.1s ease-out',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                }}
              >
                <ReactCompareSliderImage
                  src={historicImg}
                  alt="Ancient Colosseum reconstruction"
                  {...imageProps}
                />
              </div>
            </div>
          }
        />
      </div>
      <p className="bg-stone-900 px-3 py-2 text-center text-xs leading-relaxed text-stone-400">
        {tiltEnabled && isActive ? (
          <>
            Tilt to peer around the ancient scene — hold the phone naturally, then move gently.
            <button
              type="button"
              onClick={recalibrate}
              className="ml-1 text-amber-400 underline underline-offset-2"
            >
              Reset center
            </button>
          </>
        ) : (
          'Drag the handle to compare today’s Colosseum with ancient Rome.'
        )}
      </p>
    </div>
  );
};

export default BeforeAfterSlider;
