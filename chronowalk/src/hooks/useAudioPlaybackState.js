import { useCallback, useEffect, useState } from 'react';
import { audioOrchestrator, AUDIO_PLAYBACK_STATE_EVENT } from '../audio/AudioOrchestrator';

export const useAudioPlaybackState = () => {
  const [needsResumeAudio, setNeedsResumeAudio] = useState(false);
  const [isArrivalAudioPlaying, setIsArrivalAudioPlaying] = useState(false);
  const [hasArrivalAudioSession, setHasArrivalAudioSession] = useState(false);

  const applyDetail = useCallback((detail = {}) => {
    setNeedsResumeAudio(Boolean(detail.needsResumeAudio ?? detail.interrupted));
    setIsArrivalAudioPlaying(Boolean(detail.isArrivalAudioPlaying));
    setHasArrivalAudioSession(Boolean(detail.hasArrivalAudioSession));
  }, []);

  const syncFromOrchestrator = useCallback(() => {
    if (typeof audioOrchestrator.syncPlaybackState === 'function') {
      audioOrchestrator.syncPlaybackState();
      return;
    }

    const state = audioOrchestrator.getState();
    setNeedsResumeAudio(Boolean(state.playbackInterrupted));
    setHasArrivalAudioSession(Boolean(state.wantsArrivalPlayback));
    setIsArrivalAudioPlaying(
      Boolean(state.wantsArrivalPlayback && !audioOrchestrator.arrivalPlayer?.paused)
    );
  }, []);

  useEffect(() => {
    const onPlaybackState = (event) => {
      applyDetail(event.detail);
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
  }, [applyDetail, syncFromOrchestrator]);

  return {
    needsResumeAudio,
    playbackInterrupted: needsResumeAudio,
    isArrivalAudioPlaying,
    hasArrivalAudioSession,
  };
};
