import React from 'react';
import BeforeAfterSlider from './BeforeAfterSlider';
import { audioOrchestrator } from '../audio/AudioOrchestrator';
import { JOURNEY_STATE } from '../hooks/useGeoLocation';

const WaypointCard = ({ waypoint, state, onClose }) => {
  if (state !== JOURNEY_STATE.ARRIVAL || !waypoint) return null;

  const startImmersive = () => {
    console.log('DEBUG: Button clicked, URL is:', waypoint.arrival_immersive_url);

    if (!waypoint.arrival_immersive_url) {
      console.error('CRITICAL: Waypoint audio URL is missing from database!');
      return;
    }

    audioOrchestrator.transitionTo('ARRIVAL', {
      arrival: waypoint.arrival_immersive_url,
    });
  };

  return (
    <div className="absolute bottom-0 left-0 z-50 h-[60vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl">
      <button
        type="button"
        onClick={onClose}
        className="mx-auto mb-4 block h-4 w-12 rounded-full bg-gray-300"
        aria-label="Minimize waypoint card"
      />
      <h2 className="text-2xl font-bold">{waypoint.title}</h2>

      {/* Pass the ancient, modern, and depth map URLs here */}
      <BeforeAfterSlider
        modernImg={waypoint.modern_image_url}
        historicImg={waypoint.ancient_image_url}
        depthMap={waypoint.depth_map_url}
      />

      <button
        type="button"
        onClick={startImmersive}
        className="mt-6 w-full rounded-lg bg-blue-600 py-4 font-bold text-white"
      >
        Begin Immersive View
      </button>
    </div>
  );
};

export default WaypointCard;
