import { useEffect } from 'react';
import { audioOrchestrator } from '../audio/AudioOrchestrator';

/** Resume arrival audio after Safari / iOS steals the audio session. */
export const useAudioPageVisibility = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return undefined;

    audioOrchestrator.attachVisibilityListener();

    const onFocus = () => {
      void audioOrchestrator.onPageVisible();
    };

    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      audioOrchestrator.detachVisibilityListener();
    };
  }, [enabled]);
};
