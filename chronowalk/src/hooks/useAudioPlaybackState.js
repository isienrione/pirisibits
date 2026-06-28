import { useCallback, useEffect, useState } from 'react';
import { audioOrchestrator, AUDIO_MODES, AUDIO_PLAYBACK_STATE_EVENT } from '../audio/AudioOrchestrator';

export const useAudioPlaybackState = () => {
  const [needsResumeAudio, setNeedsResumeAudio] = useState(false);
  const [isArrivalAudioPlaying, setIsArrivalAudioPlaying] = useState(false);
  const [hasArrivalAudioSession, setHasArrivalAudioSession] = useState(false);
  const [currentMode, setCurrentMode] = useState(AUDIO_MODES.AMBIENT);
  const [isTourNarrationPlaying, setIsTourNarrationPlaying] = useState(false);
  const [isTourNarrationActive, setIsTourNarrationActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const applyDetail = useCallback((detail = {}) => {
    setNeedsResumeAudio(Boolean(detail.needsResumeAudio ?? detail.interrupted));
    setIsArrivalAudioPlaying(Boolean(detail.isArrivalAudioPlaying));
    setHasArrivalAudioSession(Boolean(detail.hasArrivalAudioSession));
    setCurrentMode(detail.currentMode ?? AUDIO_MODES.AMBIENT);
    setIsTourNarrationPlaying(Boolean(detail.isTourNarrationPlaying));
    setIsTourNarrationActive(Boolean(detail.isTourNarrationActive));
    setCurrentTime(Number.isFinite(detail.currentTime) ? detail.currentTime : 0);
    setDuration(Number.isFinite(detail.duration) ? detail.duration : 0);
    setPlaybackRate(Number.isFinite(detail.playbackRate) ? detail.playbackRate : 1);
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
    setCurrentMode(state.currentMode ?? AUDIO_MODES.AMBIENT);
    setIsTourNarrationPlaying(Boolean(audioOrchestrator.isTourNarrationPlaying?.()));
    setIsTourNarrationActive(Boolean(audioOrchestrator.isTourNarrationActive?.()));
    setCurrentTime(state.currentTime ?? 0);
    setDuration(state.duration ?? 0);
    setPlaybackRate(state.playbackRate ?? 1);
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

  const seekTo = useCallback((seconds) => audioOrchestrator.seekTo(seconds), []);
  const setRate = useCallback((rate) => audioOrchestrator.setPlaybackRate(rate), []);
  const cycleRate = useCallback(() => audioOrchestrator.cyclePlaybackRate(), []);

  return {
    needsResumeAudio,
    playbackInterrupted: needsResumeAudio,
    isArrivalAudioPlaying,
    hasArrivalAudioSession,
    currentMode,
    isTourNarrationPlaying,
    isTourNarrationActive,
    currentTime,
    duration,
    playbackRate,
    seekTo,
    setPlaybackRate: setRate,
    cyclePlaybackRate: cycleRate,
  };
};
