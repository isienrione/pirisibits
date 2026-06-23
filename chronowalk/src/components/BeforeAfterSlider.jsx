import React from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const BeforeAfterSlider = ({ modernImg, historicImg }) => {
  return (
    <div className="w-full h-80 overflow-hidden rounded-xl border-4 border-white shadow-lg">
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage 
            src={modernImg} 
            alt="Modern Ruins" 
          />
        }
        itemTwo={
          <ReactCompareSliderImage 
            src={historicImg} 
            alt="Ancient Reconstruction" 
          />
        }
        className="h-full"
      />
    </div>
  );
};

export default BeforeAfterSlider;
