import React, { useEffect, useState } from 'react';
import BeforeAfterSlider from './BeforeAfterSlider';

const WaypointCard = ({ waypoint, onClose }) => {
  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    setShowSlider(false);
  }, [waypoint?.id]);

  if (!waypoint) return null;

  return (
    <div className="absolute bottom-0 left-0 z-50 h-[60vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl transition-transform duration-500">
      <button
        type="button"
        onClick={onClose}
        className="mx-auto mb-6 block h-4 w-12 rounded-full bg-gray-300"
        aria-label="Minimize waypoint card"
      />
      <h2 className="text-2xl font-bold mb-2">{waypoint.title}</h2>
      <p className="text-gray-600 mb-6">Discover the ancient secrets of this site...</p>

      {showSlider && (
        <div className="mb-4">
          <BeforeAfterSlider
            modernImg={waypoint.modern_image_url}
            historicImg={waypoint.ancient_image_url}
          />
          <button
            type="button"
            onClick={() => setShowSlider(false)}
            className="mt-3 w-full text-sm font-medium text-blue-600"
          >
            Hide Visual Slider
          </button>
        </div>
      )}
      
      <div className="flex gap-4">
        <button type="button" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">
          Play Audio Guide
        </button>
        {!showSlider && (
          <button
            type="button"
            onClick={() => setShowSlider(true)}
            className="flex-1 border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold"
          >
            Open Visual Slider
          </button>
        )}
      </div>
    </div>
  );
};

export default WaypointCard;
