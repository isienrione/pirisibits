import React from 'react';

const WaypointCard = ({ waypoint, onClose }) => {
  if (!waypoint) return null;

  return (
    <div className="absolute bottom-0 left-0 z-50 h-[60vh] w-full rounded-t-3xl bg-white p-6 shadow-2xl transition-transform duration-500">
      <button
        type="button"
        onClick={onClose}
        className="mx-auto mb-6 block h-4 w-12 rounded-full bg-gray-300"
        aria-label="Close waypoint card"
      />
      <h2 className="text-2xl font-bold mb-2">{waypoint.title}</h2>
      <p className="text-gray-600 mb-6">Discover the ancient secrets of this site...</p>
      
      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">
          Play Audio Guide
        </button>
        <button className="flex-1 border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold">
          Open Visual Slider
        </button>
      </div>
    </div>
  );
};

export default WaypointCard;
