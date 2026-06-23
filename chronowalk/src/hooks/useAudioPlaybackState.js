import { useCallback, useEffect, useState } from 'react';
import { audioOrchestrator, AUDIO_PLAYBACK_STATE_EVENT } from '../audio/AudioOrchestrator';

export const useAudioPlaybackState = () => {
  const [needsResumeAudio, setNeedsResumeAudio] = useState(false);

  const syncFromOrchestrator = useCallback(() => {
    if (typeof audioOrchestrator.syncPlaybackState === 'function') {
      audioOrchestrator.syncPlaybackState();
      return;
    }

    const state = audioOrchestrator.getState();
    setNeedsResumeAudio(Boolean(state.playbackInterrupted));
  }, []);

  useEffect(() => {
    const onPlaybackState = (event) => {
      setNeedsResumeAudio(Boolean(event.detail?.needsResumeAudio ?? event.detail?.interrupted));
    };

    const onReturnToApp = () => {
      syncFromOrchestrator();
    };

    window.addEventListener(AUDIO_PLAYBACK_STATE_EVENT, onPlaybackState);
    document.addEventListener('visibilitychange', onReturnToApp);
    window.addEventListener('focus', onReturnToApp);
    window.addEventListener('pageshow', onReturnToApp);

    syncFromOrchestrator();

    return () => {
      window.removeEventListener(AUDIO_PLAYBACK_STATE_EVENT, onPlaybackState);
      document.removeEventListener('visibilitychange', onReturnToApp);
      window.removeEventListener('focus', onReturnToApp);
      window.removeEventListener('pageshow', onReturnToApp);
    };
  }, [syncFromOrchestrator]);

  return { needsResumeAudio, playbackInterrupted: needsResumeAudio };
};
