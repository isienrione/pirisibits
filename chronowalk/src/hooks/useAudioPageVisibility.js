import { useEffect } from 'react';
import { audioOrchestrator } from '../audio/AudioOrchestrator';

/** Resume arrival audio after the browser backgrounds the tab (mobile Safari). */
export const useAudioPageVisibility = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return undefined;

    audioOrchestrator.attachVisibilityListener();
    return () => audioOrchestrator.detachVisibilityListener();
  }, [enabled]);
};
