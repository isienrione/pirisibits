import React from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const BeforeAfterSlider = ({ modernImg, historicImg, depthMap }) => {
  const { x, y } = useDeviceTilt();

  // The 'depthMap' will eventually modulate this shift
  // For now, we apply the base parallax transform
  const parallaxStyle = {
    transform: `translate(${x * 0.2}px, ${y * 0.2}px)`,
    transition: 'transform 0.05s ease-out',
  };

  return (
    <div className="w-full h-80 overflow-hidden rounded-xl border-4 border-white shadow-lg">
      <ReactCompareSlider
        itemOne={<ReactCompareSliderImage src={modernImg} alt="Modern View" />}
        itemTwo={
          <div style={parallaxStyle}>
            <ReactCompareSliderImage src={historicImg} alt="Ancient Reconstruction" />
          </div>
        }
      />
    </div>
  );
};

export default BeforeAfterSlider;
