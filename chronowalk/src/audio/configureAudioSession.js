/**
 * Route tour audio through the iOS media channel so hardware silent mode
 * does not mute narration (Safari / installed PWA).
 *
 * Primary: navigator.audioSession.type = 'playback' (iOS 16.4+).
 * Fallback: loop a silent HTMLAudioElement on iOS when AudioSession is unavailable.
 */

const SILENT_MP3_DATA_URI =
  'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+1DEAAA/wAAB/oAAABYQAAAAAAAAAAAAAAAAAAAA//tQxAADwAAB/oAAABYQAAAAAAAAAAAAAAAAAAAA';

let playbackSessionConfigured = false;
let silentKeeper = null;
let silentKeeperActive = false;
let silentKeeperUses = 0;

export const isIOSDevice = () => {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent ?? '';
  const isClassicIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadDesktopUa =
    navigator.platform === 'MacIntel' && Number(navigator.maxTouchPoints) > 1;

  return isClassicIOS || isIPadDesktopUa;
};

export const supportsAudioSessionApi = () =>
  typeof navigator !== 'undefined' && navigator.audioSession != null;

const trySetPlaybackSessionType = () => {
  if (!supportsAudioSessionApi()) return false;

  try {
    navigator.audioSession.type = 'playback';
    return navigator.audioSession.type === 'playback';
  } catch (error) {
    console.warn('ChronoWalk: navigator.audioSession.type = playback failed.', error);
    return false;
  }
};

const ensureSilentKeeper = () => {
  if (typeof Audio === 'undefined') return null;

  if (!silentKeeper) {
    silentKeeper = new Audio(SILENT_MP3_DATA_URI);
    silentKeeper.loop = true;
    silentKeeper.preload = 'auto';
    silentKeeper.volume = 0.001;
    silentKeeper.setAttribute('playsinline', '');
    silentKeeper.setAttribute('webkit-playsinline', '');
  }

  return silentKeeper;
};

const startSilentKeeper = async () => {
  if (!isIOSDevice() || supportsAudioSessionApi()) return;

  const keeper = ensureSilentKeeper();
  if (!keeper || silentKeeperActive) return;

  try {
    silentKeeperActive = true;
    await keeper.play();
  } catch (error) {
    silentKeeperActive = false;
    console.warn('ChronoWalk: silent media-channel keeper could not start.', error);
  }
};

const stopSilentKeeper = () => {
  if (!silentKeeper || !silentKeeperActive) return;

  silentKeeper.pause();
  silentKeeper.currentTime = 0;
  silentKeeperActive = false;
};

/**
 * Configure the page for media-style playback (ignores iOS hardware mute switch).
 * Safe to call repeatedly; only applies platform workarounds once.
 */
export const configurePlaybackAudioSession = () => {
  if (playbackSessionConfigured) return true;

  const configured = trySetPlaybackSessionType();
  playbackSessionConfigured = configured || isIOSDevice();
  return configured;
};

/**
 * Call on a user gesture before starting tour audio. Ensures iOS routes sound
 * through the media channel even when the ringer/mute switch is on.
 */
export const primePlaybackAudioSession = async () => {
  configurePlaybackAudioSession();

  if (supportsAudioSessionApi()) {
    trySetPlaybackSessionType();
    return;
  }

  if (isIOSDevice()) {
    await startSilentKeeper();
  }
};

/** Keep the silent keeper alive while tour players are active (legacy iOS only). */
export const retainMediaChannelPlayback = () => {
  if (!isIOSDevice() || supportsAudioSessionApi()) return;

  silentKeeperUses += 1;
  void startSilentKeeper();
};

export const releaseMediaChannelPlayback = (all = false) => {
  if (!isIOSDevice() || supportsAudioSessionApi()) return;

  if (all) {
    silentKeeperUses = 0;
  } else {
    silentKeeperUses = Math.max(0, silentKeeperUses - 1);
  }

  if (silentKeeperUses === 0) {
    stopSilentKeeper();
  }
};

export const resetMediaChannelPlayback = () => {
  releaseMediaChannelPlayback(true);
};

/** Test helper */
export const resetAudioSessionStateForTests = () => {
  playbackSessionConfigured = false;
  silentKeeperUses = 0;
  silentKeeperActive = false;
  silentKeeper = null;
};
