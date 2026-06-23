import React from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const BeforeAfterSlider = ({ modernImg, historicImg, depthMap, tiltEnabled = false }) => {
  const { x, y, isActive } = useDeviceTilt(tiltEnabled);

  const intensity = depthMap ? 2.5 : 2;
  const parallaxStyle = {
    transform: `translate(${(x ?? 0) * intensity}px, ${(y ?? 0) * intensity}px)`,
    transition: 'transform 0.05s ease-out',
    width: '110%',
    height: '110%',
    marginLeft: '-5%',
    marginTop: '-5%',
  };

  const imageProps = {
    style: { objectFit: 'cover' },
    referrerPolicy: 'no-referrer',
  };

  return (
    <div className="h-80 w-full overflow-hidden rounded-xl border-4 border-white shadow-lg">
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage src={modernImg} alt="Modern Colosseum" {...imageProps} />
        }
        itemTwo={
          <div style={parallaxStyle}>
            <ReactCompareSliderImage
              src={historicImg}
              alt="Historic Colosseum illustration"
              {...imageProps}
            />
          </div>
        }
      />
      <p className="mt-2 text-center text-xs text-stone-400">
        {tiltEnabled && isActive
          ? 'Tilt your phone — the historic illustration shifts for a 3D feel (not live camera).'
          : 'Drag the handle to compare today’s Colosseum with a historic view.'}
      </p>
    </div>
  );
};

export default BeforeAfterSlider;
