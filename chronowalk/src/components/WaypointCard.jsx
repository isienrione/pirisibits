import React, { useEffect, useRef, useState } from 'react';
import BeforeAfterSlider from './BeforeAfterSlider';
import { audioOrchestrator, AUDIO_MODES } from '../audio/AudioOrchestrator';
import { JOURNEY_STATE } from '../hooks/useGeoLocation';

const WaypointCard = ({ waypoint, state, onClose }) => {
  const [showSlider, setShowSlider] = useState(false);
  const sliderRef = useRef(null);

  useEffect(() => {
    setShowSlider(false);
  }, [waypoint?.id]);

  useEffect(() => {
    if (showSlider) {
      sliderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showSlider]);

  if (state !== JOURNEY_STATE.ARRIVAL || !waypoint) return null;

  const handleOpenSlider = () => {
    if (!waypoint.modern_image_url || !waypoint.ancient_image_url) {
      alert('Image URLs missing for this waypoint. Run git pull to get the latest code.');
      return;
    }
    setShowSlider(true);
  };

  const handlePlayAudio = () => {
    audioOrchestrator.transitionTo(AUDIO_MODES.ARRIVAL, {
      ambient_url: waypoint.ambient_url,
      transit_narrative_url: waypoint.transit_narrative_url,
      arrival_immersive_url: waypoint.arrival_immersive_url,
    });
  };

  return (
    <div className="absolute bottom-0 left-0 z-50 h-[70vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl transition-all duration-500 ease-in-out">
      <button
        type="button"
        onClick={onClose}
        className="mx-auto mb-6 block h-4 w-12 rounded-full bg-gray-300"
        aria-label="Minimize waypoint card"
      />
      <h2 className="text-2xl font-bold mb-2">{waypoint.title}</h2>
      <p className="text-gray-600 mb-6">You&apos;ve arrived! Prepare to step back in time.</p>

      {showSlider && (
        <div ref={sliderRef} className="mb-4">
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
        <button
          type="button"
          onClick={handlePlayAudio}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold"
        >
          Play Audio Guide
        </button>
        {!showSlider && (
          <button
            type="button"
            onClick={handleOpenSlider}
            className="flex-1 border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold"
          >
            Begin Immersive View
          </button>
        )}
      </div>
    </div>
  );
};

export default WaypointCard;
