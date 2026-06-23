import React from 'react';

const WaypointCard = ({ waypoint, onClose }) => {
  if (!waypoint) return null;

  return (
    <div className="absolute bottom-0 left-0 w-full h-[60vh] bg-white rounded-t-3xl shadow-2xl p-6 transition-transform duration-500 z-50">
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
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
