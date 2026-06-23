import {
  ARRIVAL_ALERT_VOLUME,
  ARRIVAL_VOLUME,
  FADE_DURATION_MS,
  normalizeAudioUrls,
  VISUAL_SYNC_DELAY_MS,
  waitForCanPlayThrough,
} from './audioMedia';

const AUDIO_MODES = {
  AMBIENT: 'AMBIENT',
  TRANSIT: 'TRANSIT',
  ARRIVAL: 'ARRIVAL',
};

export const AUDIO_SYNC_EVENT = 'AUDIO_SYNC_TRIGGER';
export const AUDIO_PLAYBACK_STATE_EVENT = 'AUDIO_PLAYBACK_STATE';

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

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  emitPlaybackState() {
    this.windowRef.dispatchEvent(
      new CustomEvent(AUDIO_PLAYBACK_STATE_EVENT, {
        detail: {
          interrupted: this.playbackInterrupted,
          currentMode: this.currentMode,
          wantsArrivalPlayback: this.wantsArrivalPlayback,
        },
      })
    );
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
    if (this.currentMode !== AUDIO_MODES.ARRIVAL || !this.wantsArrivalPlayback) {
      this.playingBeforeHidden = false;
      return;
    }

    if (!this.arrivalPlayer.paused) {
      this.setPlaybackInterrupted(false);
      this.playingBeforeHidden = false;
      return;
    }

    try {
      await this.arrivalPlayer.play();
      this.setPlaybackInterrupted(false);
    } catch (error) {
      console.warn('AudioOrchestrator: could not resume after returning to foreground.', error);
      this.setPlaybackInterrupted(true);
    } finally {
      this.playingBeforeHidden = false;
    }
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
      } else {
        this.transitPlayer.pause();
        this.arrivalPlayer.pause();
        this.ambientPlayer.volume = 1;
        this.ambientPlayer.src = this.audioUrls.ambient;
        await this.ambientPlayer.play();
      }
    } catch (error) {
      console.warn('Audio playback blocked. User needs to interact first.', error);
    }
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
      return true;
    } catch (error) {
      console.warn('AudioOrchestrator: manual resume blocked.', error);
      this.setPlaybackInterrupted(true);
      return false;
    }
  }

  stop() {
    this.clearPendingSync();
    this.syncGeneration += 1;
    this.visualSyncFired = false;
    this.playingBeforeHidden = false;
    this.wantsArrivalPlayback = false;
    this.setPlaybackInterrupted(false);

    [this.ambientPlayer, this.transitPlayer, this.arrivalPlayer, this.alertPlayer].forEach((player) => {
      player.pause();
      player.currentTime = 0;
      player.volume = 1;
    });

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
