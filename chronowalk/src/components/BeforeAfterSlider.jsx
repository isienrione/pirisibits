import React, { useEffect, useState } from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MAX_SHIFT_PX = 30;

const AncientPlaceholder = () => (
  <div className="flex h-full min-h-[12rem] flex-col items-center justify-center bg-gradient-to-b from-stone-800 to-stone-900 p-5 text-center">
    <p className="text-sm font-semibold text-amber-300">Ancient reconstruction — coming next</p>
    <p className="mt-2 max-w-xs text-xs leading-relaxed text-stone-400">
      Screenshot the visitor view (Street View / panorama), then generate a historically
      accurate reconstruction from the{' '}
      <strong className="text-stone-300">same camera angle</strong> with Midjourney or similar.
    </p>
    <p className="mt-3 font-mono text-[10px] text-amber-200/80">
      public/waypoints/colosseum/ancient-reconstruction.jpg
    </p>
  </div>
);

const BeforeAfterSlider = ({ modernImg, historicImg, depthMap, tiltEnabled = false }) => {
  const { x, y, isActive, recalibrate } = useDeviceTilt(tiltEnabled);
  const [ancientReady, setAncientReady] = useState(false);

  useEffect(() => {
    if (tiltEnabled) recalibrate();
  }, [tiltEnabled, historicImg, recalibrate]);

  useEffect(() => {
    if (!historicImg) {
      setAncientReady(false);
      return undefined;
    }

    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setAncientReady(true);
    };
    probe.onerror = () => {
      if (!cancelled) setAncientReady(false);
    };
    probe.referrerPolicy = 'no-referrer';
    probe.src = historicImg;

    return () => {
      cancelled = true;
    };
  }, [historicImg]);

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

  const ancientLayer = ancientReady ? (
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
  ) : (
    <AncientPlaceholder />
  );

  return (
    <div className="w-full overflow-hidden rounded-xl border-4 border-white shadow-lg">
      <div className="h-80 w-full">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage src={modernImg} alt="Modern Colosseum" {...imageProps} />
          }
          itemTwo={ancientLayer}
        />
      </div>
      <p className="bg-stone-900 px-3 py-2 text-center text-xs leading-relaxed text-stone-400">
        {!ancientReady ? (
          'Today’s view is ready — add the matched ancient image to complete the time portal.'
        ) : tiltEnabled && isActive ? (
          <>
            Same viewpoint, two eras — tilt gently for depth.
            <button
              type="button"
              onClick={recalibrate}
              className="ml-1 text-amber-400 underline underline-offset-2"
            >
              Reset center
            </button>
          </>
        ) : (
          'Drag to compare the same view across time.'
        )}
      </p>
    </div>
  );
};

export default BeforeAfterSlider;
