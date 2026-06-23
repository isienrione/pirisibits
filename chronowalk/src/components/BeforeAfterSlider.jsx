import React from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const BeforeAfterSlider = ({ modernImg, historicImg, depthMap }) => {
  const { x, y } = useDeviceTilt();

  // Parallax shift calculation:
  // The depthMap could eventually be used as a multiplier for intensity
  const intensity = depthMap ? 0.3 : 0.2;
  const parallaxStyle = {
    transform: `translate(${(x ?? 0) * intensity}px, ${(y ?? 0) * intensity}px)`,
    transition: 'transform 0.05s ease-out',
  };

  return (
    <div className="w-full h-80 overflow-hidden rounded-xl border-4 border-white shadow-lg">
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
