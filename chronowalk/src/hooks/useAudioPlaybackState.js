import { useEffect, useState } from 'react';
import { AUDIO_PLAYBACK_STATE_EVENT } from '../audio/AudioOrchestrator';

export const useAudioPlaybackState = () => {
  const [playbackInterrupted, setPlaybackInterrupted] = useState(false);

  useEffect(() => {
    const onPlaybackState = (event) => {
      setPlaybackInterrupted(Boolean(event.detail?.interrupted));
    };

    window.addEventListener(AUDIO_PLAYBACK_STATE_EVENT, onPlaybackState);
    return () => window.removeEventListener(AUDIO_PLAYBACK_STATE_EVENT, onPlaybackState);
  }, []);

  return { playbackInterrupted };
};
