import React from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const BeforeAfterSlider = ({ modernImg, historicImg, depthMap, tiltEnabled = false }) => {
  const { x, y } = useDeviceTilt(tiltEnabled);

  const intensity = depthMap ? 2.5 : 2;
  const parallaxStyle = {
    transform: `translate(${(x ?? 0) * intensity}px, ${(y ?? 0) * intensity}px)`,
    transition: 'transform 0.05s ease-out',
    width: '108%',
    height: '108%',
    marginLeft: '-4%',
    marginTop: '-4%',
  };

  return (
    <div className="h-80 w-full overflow-hidden rounded-xl border-4 border-white shadow-lg">
      <ReactCompareSlider
        itemOne={<ReactCompareSliderImage src={modernImg} alt="Modern" />}
        itemTwo={
          <div style={parallaxStyle}>
            <ReactCompareSliderImage src={historicImg} alt="Ancient" />
          </div>
        }
      />
    </div>
  );
};

export default BeforeAfterSlider;
