import React from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const BeforeAfterSlider = ({ modernImg, historicImg }) => {
  const { x, y } = useDeviceTilt();

  // Apply a subtle parallax shift based on tilt
  const parallaxStyle = {
    transform: `translate(${(x ?? 0) * 0.5}px, ${(y ?? 0) * 0.5}px)`,
    transition: 'transform 0.1s ease-out',
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
        className="h-full"
      />
    </div>
  );
};

export default BeforeAfterSlider;
