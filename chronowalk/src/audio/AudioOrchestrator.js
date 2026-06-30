import {
  ARRIVAL_ALERT_VOLUME,
  ARRIVAL_VOLUME,
  FADE_DURATION_MS,
  normalizeAudioUrls,
  VISUAL_SYNC_DELAY_MS,
  waitForCanPlayThrough,
} from './audioMedia';
import { readPlaybackSpeed } from '../utils/appPreferences';

const AUDIO_MODES = {
  AMBIENT: 'AMBIENT',
  TRANSIT: 'TRANSIT',
  ARRIVAL: 'ARRIVAL',
};

export const AUDIO_SYNC_EVENT = 'AUDIO_SYNC_TRIGGER';
export const AUDIO_PLAYBACK_STATE_EVENT = 'AUDIO_PLAYBACK_STATE';
export const AUDIO_PROGRESS_EVENT = 'AUDIO_PROGRESS';

class AudioOrchestrator {
  constructor({ createAudio = () => new Audio(), windowRef = window } = {}) {
    this.windowRef = windowRef;
    this.ambientPlayer = createAudio();
    this.transitPlayer = createAudio();
    this.arrivalPlayer = createAudio();
    this.alertPlayer = createAudio();
    this.ambientPlayer.loop = true;
    this.transitPlayer.loop = true;
    this.arrivalPlayer.loop = true;
    this.alertPlayer.loop = false;
    this.arrivalPlayer.preload = 'auto';

    this.currentMode = AUDIO_MODES.AMBIENT;
    this.audioUrls = normalizeAudioUrls();
    this.syncTriggerTimer = null;
    this.syncGeneration = 0;
    this.visualSyncFired = false;
    this.playingBeforeHidden = false;
    this.prefetchedArrivalUrl = null;
    this.visibilityListenerAttached = false;
    this.wantsArrivalPlayback = false;
    this.playbackInterrupted = false;
    this.suppressPauseDetection = false;

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleArrivalPause = this.handleArrivalPause.bind(this);
    this.handleArrivalPlay = this.handleArrivalPlay.bind(this);

    this.arrivalPlayer.addEventListener('pause', this.handleArrivalPause);
    this.arrivalPlayer.addEventListener('play', this.handleArrivalPlay);

    this.handleProgressUpdate = this.handleProgressUpdate.bind(this);
    this.attachProgressListeners();
    this.applyPlaybackRate(readPlaybackSpeed());
  }

  attachProgressListeners() {
    [this.transitPlayer, this.arrivalPlayer].forEach((player) => {
      player.addEventListener('timeupdate', this.handleProgressUpdate);
      player.addEventListener('loadedmetadata', this.handleProgressUpdate);
      player.addEventListener('durationchange', this.handleProgressUpdate);
      player.addEventListener('seeked', this.handleProgressUpdate);
    });
  }

  handleProgressUpdate() {
    const player = this.getNarrationPlayer();
    if (!player) return;

    this.windowRef.dispatchEvent(
      new CustomEvent(AUDIO_PROGRESS_EVENT, {
        detail: {
          currentTime: player.currentTime ?? 0,
          duration: Number.isFinite(player.duration) ? player.duration : 0,
          playbackRate: player.playbackRate ?? 1,
        },
      })
    );
  }

  getNarrationPlayer() {
    if (this.currentMode === AUDIO_MODES.ARRIVAL && this.wantsArrivalPlayback) {
      return this.arrivalPlayer;
    }
    if (this.currentMode === AUDIO_MODES.TRANSIT && this.transitPlayer.src) {
      return this.transitPlayer;
    }
    return null;
  }

  getCurrentTime() {
    const player = this.getNarrationPlayer();
    return player?.currentTime ?? 0;
  }

  getDuration() {
    const player = this.getNarrationPlayer();
    const duration = player?.duration;
    return Number.isFinite(duration) ? duration : 0;
  }

  getPlaybackRate() {
    const player = this.getNarrationPlayer();
    if (player) return player.playbackRate ?? 1;
    return this.arrivalPlayer.playbackRate ?? readPlaybackSpeed();
  }

  applyPlaybackRate(rate) {
    const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1;
    this.transitPlayer.playbackRate = safeRate;
    this.arrivalPlayer.playbackRate = safeRate;
    this.handleProgressUpdate();
  }

  setPlaybackRate(rate) {
    this.applyPlaybackRate(rate);
    this.emitPlaybackState();
  }

  seekTo(seconds) {
    const player = this.getNarrationPlayer();
    if (!player) return false;

    const duration = Number.isFinite(player.duration) ? player.duration : null;
    const clamped = Math.max(0, duration != null ? Math.min(seconds, duration) : seconds);
    player.currentTime = clamped;
    this.handleProgressUpdate();
    return true;
  }

  skipBy(deltaSeconds) {
    return this.seekTo(this.getCurrentTime() + deltaSeconds);
  }

  handleArrivalPause() {
    if (this.suppressPauseDetection) return;
    if (this.currentMode !== AUDIO_MODES.ARRIVAL || !this.wantsArrivalPlayback) return;
    this.setPlaybackInterrupted(true);
  }

  handleArrivalPlay() {
    if (this.currentMode === AUDIO_MODES.ARRIVAL && this.wantsArrivalPlayback) {
      this.setPlaybackInterrupted(false);
    }
  }

  syncPlaybackState() {
    const needsResume =
      this.currentMode === AUDIO_MODES.ARRIVAL &&
      this.wantsArrivalPlayback &&
      this.arrivalPlayer.paused;

    this.playbackInterrupted = needsResume;
    this.emitPlaybackState();
    return needsResume;
  }

  emitPlaybackState() {
    const isArrivalAudioPlaying =
      this.currentMode === AUDIO_MODES.ARRIVAL &&
      this.wantsArrivalPlayback &&
      !this.arrivalPlayer.paused;

    const needsResumeAudio =
      this.currentMode === AUDIO_MODES.ARRIVAL &&
      this.wantsArrivalPlayback &&
      this.arrivalPlayer.paused;

    const isTourNarrationPlaying = this.isTourNarrationPlaying();
    const isTourNarrationActive = this.isTourNarrationActive();

    this.windowRef.dispatchEvent(
      new CustomEvent(AUDIO_PLAYBACK_STATE_EVENT, {
        detail: {
          interrupted: this.playbackInterrupted,
          needsResumeAudio,
          isArrivalAudioPlaying,
          hasArrivalAudioSession:
            this.currentMode === AUDIO_MODES.ARRIVAL && this.wantsArrivalPlayback,
          currentMode: this.currentMode,
          wantsArrivalPlayback: this.wantsArrivalPlayback,
          isTourNarrationPlaying,
          isTourNarrationActive,
        },
      })
    );
  }

  isTourNarrationPlaying() {
    if (this.currentMode === AUDIO_MODES.ARRIVAL && this.wantsArrivalPlayback) {
      return !this.arrivalPlayer.paused;
    }
    if (this.currentMode === AUDIO_MODES.TRANSIT) {
      return !this.transitPlayer.paused;
    }
    return false;
  }

  isTourNarrationActive() {
    if (this.currentMode === AUDIO_MODES.ARRIVAL && this.wantsArrivalPlayback) {
      return true;
    }
    if (this.currentMode === AUDIO_MODES.TRANSIT && this.transitPlayer.src) {
      return true;
    }
    return false;
  }

  toggleTourNarration() {
    if (this.currentMode === AUDIO_MODES.ARRIVAL && this.wantsArrivalPlayback) {
      return this.toggleArrivalPlayback();
    }

    if (this.currentMode === AUDIO_MODES.TRANSIT) {
      if (this.transitPlayer.paused) {
        void this.transitPlayer.play();
      } else {
        this.transitPlayer.pause();
      }
      this.emitPlaybackState();
      return true;
    }

    return false;
  }

  setPlaybackInterrupted(interrupted) {
    this.playbackInterrupted = interrupted;
    this.emitPlaybackState();
  }

  attachVisibilityListener() {
    if (this.visibilityListenerAttached || typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.visibilityListenerAttached = true;
  }

  detachVisibilityListener() {
    if (!this.visibilityListenerAttached || typeof document === 'undefined') return;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.visibilityListenerAttached = false;
  }

  handleVisibilityChange() {
    if (typeof document === 'undefined') return;

    if (document.hidden) {
      this.onPageHidden();
      return;
    }

    void this.onPageVisible();
  }

  onPageHidden() {
    this.playingBeforeHidden =
      this.currentMode === AUDIO_MODES.ARRIVAL && this.wantsArrivalPlayback;
  }

  async onPageVisible() {
    this.syncPlaybackState();
    this.playingBeforeHidden = false;
  }

  applyAudioSources(audioUrls = {}) {
    this.audioUrls = normalizeAudioUrls(audioUrls);
  }

  clearPendingSync() {
    if (this.syncTriggerTimer) {
      clearTimeout(this.syncTriggerTimer);
      this.syncTriggerTimer = null;
    }
  }

  scheduleVisualSync(generation) {
    if (this.visualSyncFired) return;

    this.clearPendingSync();
    this.syncTriggerTimer = setTimeout(() => {
      if (generation !== this.syncGeneration) return;
      if (this.visualSyncFired) return;

      this.syncTriggerTimer = null;
      this.visualSyncFired = true;
      this.windowRef.dispatchEvent(
        new CustomEvent(AUDIO_SYNC_EVENT, { detail: { generation } })
      );
    }, VISUAL_SYNC_DELAY_MS);
  }

  async fadeVolume(player, to, duration = FADE_DURATION_MS) {
    const steps = 10;
    const stepDuration = duration / steps;
    const startVolume = player.volume;
    const delta = (to - startVolume) / steps;

    for (let i = 0; i < steps; i++) {
      player.volume = Math.min(Math.max(player.volume + delta, 0), 1);
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }

    player.volume = to;
  }

  async playArrivalAlert(alertUrl) {
    if (!alertUrl) {
      console.warn('AudioOrchestrator: missing arrival alert URL.');
      return;
    }

    try {
      this.alertPlayer.pause();
      this.alertPlayer.currentTime = 0;
      this.alertPlayer.volume = ARRIVAL_ALERT_VOLUME;
      this.alertPlayer.src = alertUrl;
      await this.alertPlayer.play();
    } catch (error) {
      console.warn('Arrival alert playback blocked.', error);
    }
  }

  prefetchArrival(arrivalUrl = this.audioUrls.arrival) {
    if (!arrivalUrl) return;

    if (this.prefetchedArrivalUrl === arrivalUrl && this.arrivalPlayer.src === arrivalUrl) {
      return;
    }

    this.prefetchedArrivalUrl = arrivalUrl;
    this.arrivalPlayer.preload = 'auto';
    this.arrivalPlayer.src = arrivalUrl;
    this.arrivalPlayer.load();
  }

  async transitionToArrival({ syncVisual = false } = {}) {
    this.clearPendingSync();

    if (syncVisual) {
      this.visualSyncFired = false;
    }

    const generation = ++this.syncGeneration;

    this.ambientPlayer.pause();
    void this.fadeVolume(this.transitPlayer, 0, FADE_DURATION_MS);

    try {
      this.arrivalPlayer.volume = 0;

      if (this.arrivalPlayer.src !== this.audioUrls.arrival) {
        this.arrivalPlayer.src = this.audioUrls.arrival;
      }

      await waitForCanPlayThrough(this.arrivalPlayer);
      if (generation !== this.syncGeneration) return;

      await this.arrivalPlayer.play();
      if (generation !== this.syncGeneration) return;

      this.wantsArrivalPlayback = true;
      this.setPlaybackInterrupted(false);
      this.handleProgressUpdate();

      await this.fadeVolume(this.arrivalPlayer, ARRIVAL_VOLUME, FADE_DURATION_MS);
      if (generation !== this.syncGeneration) return;

      if (syncVisual) {
        this.scheduleVisualSync(generation);
      }
    } catch (error) {
      console.warn('Audio playback blocked. User needs to interact first.', error);
    }
  }

  async transitionTo(mode, audioUrls, options = {}) {
    if (audioUrls) {
      this.applyAudioSources(audioUrls);
    }

    const targetUrl =
      mode === AUDIO_MODES.ARRIVAL
        ? this.audioUrls.arrival
        : mode === AUDIO_MODES.TRANSIT
          ? this.audioUrls.transit
          : this.audioUrls.ambient;

    if (!targetUrl) {
      console.warn(
        `AudioOrchestrator: missing audio URL for mode "${mode}". ` +
          'Check Supabase waypoints table or local seed data.'
      );
      return;
    }

    if (this.currentMode === mode && !options.syncVisual && !options.force) {
      const player =
        mode === AUDIO_MODES.ARRIVAL
          ? this.arrivalPlayer
          : mode === AUDIO_MODES.TRANSIT
            ? this.transitPlayer
            : this.ambientPlayer;

      if (!player.paused) return;
    }

    this.currentMode = mode;

    try {
      if (mode === AUDIO_MODES.ARRIVAL) {
        await this.transitionToArrival(options);
        return;
      }

      this.clearPendingSync();
      this.visualSyncFired = false;

      if (mode === AUDIO_MODES.TRANSIT) {
        this.arrivalPlayer.pause();
        this.ambientPlayer.pause();
        this.transitPlayer.volume = 1;
        this.transitPlayer.src = this.audioUrls.transit;
        await this.transitPlayer.play();
        this.handleProgressUpdate();
        this.emitPlaybackState();
      } else {
        this.transitPlayer.pause();
        this.arrivalPlayer.pause();
        this.ambientPlayer.volume = 1;
        this.ambientPlayer.src = this.audioUrls.ambient;
        await this.ambientPlayer.play();
        this.emitPlaybackState();
      }
    } catch (error) {
      console.warn('Audio playback blocked. User needs to interact first.', error);
    }
  }

  pauseArrival() {
    if (this.currentMode !== AUDIO_MODES.ARRIVAL || !this.wantsArrivalPlayback) {
      return false;
    }

    this.suppressPauseDetection = true;
    this.arrivalPlayer.pause();
    this.suppressPauseDetection = false;
    this.syncPlaybackState();
    return true;
  }

  async resumeArrival() {
    if (this.currentMode !== AUDIO_MODES.ARRIVAL || !this.audioUrls.arrival) {
      return false;
    }

    try {
      if (!this.arrivalPlayer.src) {
        this.arrivalPlayer.src = this.audioUrls.arrival;
      }

      await waitForCanPlayThrough(this.arrivalPlayer);
      await this.arrivalPlayer.play();
      this.wantsArrivalPlayback = true;
      this.setPlaybackInterrupted(false);
      this.handleProgressUpdate();
      return true;
    } catch (error) {
      console.warn('AudioOrchestrator: manual resume blocked.', error);
      this.setPlaybackInterrupted(true);
      return false;
    }
  }

  async toggleArrivalPlayback() {
    if (
      this.currentMode === AUDIO_MODES.ARRIVAL &&
      this.wantsArrivalPlayback &&
      !this.arrivalPlayer.paused
    ) {
      return this.pauseArrival();
    }

    return this.resumeArrival();
  }

  stop() {
    this.clearPendingSync();
    this.syncGeneration += 1;
    this.visualSyncFired = false;
    this.playingBeforeHidden = false;
    this.wantsArrivalPlayback = false;
    this.suppressPauseDetection = true;

    [this.ambientPlayer, this.transitPlayer, this.arrivalPlayer, this.alertPlayer].forEach((player) => {
      player.pause();
      player.currentTime = 0;
      player.volume = 1;
    });

    this.applyPlaybackRate(readPlaybackSpeed());

    this.suppressPauseDetection = false;
    this.setPlaybackInterrupted(false);

    this.currentMode = AUDIO_MODES.AMBIENT;
  }

  getState() {
    return {
      currentMode: this.currentMode,
      visualSyncFired: this.visualSyncFired,
      syncGeneration: this.syncGeneration,
      prefetchedArrivalUrl: this.prefetchedArrivalUrl,
      playbackInterrupted: this.playbackInterrupted,
      wantsArrivalPlayback: this.wantsArrivalPlayback,
    };
  }
}

export const audioOrchestrator = new AudioOrchestrator();
audioOrchestrator.attachVisibilityListener();

export { AudioOrchestrator, AUDIO_MODES };
