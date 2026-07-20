import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRomeManifest } from '../content/manifest.js';
import { buildWaypointPlan } from './buildPlaybackPlan.js';
import { AudioEngine } from './AudioEngine.js';

function createMockContext() {
  const gainNode = () => ({
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  });

  return {
    state: 'running',
    currentTime: 0,
    destination: {},
    createGain: vi.fn(gainNode),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    })),
    resume: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
  };
}

describe('AudioEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new AudioEngine({
      manifest: loadRomeManifest(),
      createContext: () => createMockContext(),
      loadBuffer: vi.fn(async () => null),
    });
    engine.init();
  });

  afterEach(() => {
    engine.teardown();
  });

  it('initializes Web Audio graph nodes', () => {
    expect(engine.context).toBeTruthy();
    expect(engine.masterGain).toBeTruthy();
    expect(engine.narrationGain).toBeTruthy();
    expect(engine.bedGain).toBeTruthy();
    expect(engine.systemGain).toBeTruthy();
  });

  it('plays waypoint narration plan without throwing', async () => {
    await expect(engine.playWaypoint('w01')).resolves.toEqual(expect.any(Boolean));
  });

  it('marks waypoint complete for insert eligibility', () => {
    engine.markWaypointComplete('w01');
    expect(engine.completedWaypointIds.has('w01')).toBe(true);
  });

  it('stops narration and clears playing state', () => {
    engine.setNarrationPlaying(true);
    engine.stopNarration();
    expect(engine.isNarrationPlaying()).toBe(false);
  });

  it('builds the same plan shape as buildWaypointPlan', () => {
    const plan = buildWaypointPlan(manifestFromEngine(engine), 'w01', 'a', engine.getPlaybackContext());
    expect(plan.length).toBeGreaterThan(0);
    expect(plan[0]).toMatchObject({ type: 'narration', file: 'w01.mp3' });
  });

  it('clearTransitSession resets transit timers and flags', () => {
    engine.activeTransitId = 't01';
    engine.transitStartedAt = Date.now();
    engine.longwalkPlayed = true;
    engine.longwalkTimer = setTimeout(() => {}, 60_000);

    engine.clearTransitSession();

    expect(engine.activeTransitId).toBeNull();
    expect(engine.transitStartedAt).toBeNull();
    expect(engine.longwalkPlayed).toBe(false);
    expect(engine.longwalkTimer).toBeNull();
  });

  it('playArrivalChime and playCompletionChime resolve UI system cues', async () => {
    const manifest = manifestFromEngine(engine);
    const arrivalSpy = vi.spyOn(engine, 'playUiCue');

    await engine.playArrivalChime();
    await engine.playCompletionChime();

    expect(arrivalSpy).toHaveBeenCalledWith('arrival');
    expect(arrivalSpy).toHaveBeenCalledWith('completion');
    expect(manifest.system.ui.arrival).toBeTruthy();
    expect(manifest.system.ui.completion).toBeTruthy();
  });

  it('playOneShot applies per-cue gain from levelDb', async () => {
    const loadBuffer = vi.fn(async () => ({
      duration: 0.5,
      numberOfChannels: 1,
      length: 1,
      sampleRate: 44100,
      getChannelData: () => new Float32Array(1),
    }));
    const ctx = createMockContext();
    const cueEngine = new AudioEngine({
      manifest: loadRomeManifest(),
      createContext: () => ctx,
      loadBuffer,
    });
    cueEngine.init();

    await cueEngine.playOneShot('https://example.com/cue.mp3', -18);

    const cueGain = ctx.createGain.mock.results.at(-1)?.value;
    expect(cueGain.gain.value).toBeCloseTo(10 ** (-18 / 20), 5);
    cueEngine.teardown();
  });

  it('schedules longwalk cue after transit threshold even when narration ended', async () => {
    vi.useFakeTimers();

    const systemSpy = vi.spyOn(engine, 'playSystemCue').mockResolvedValue();
    const shortTransit = { id: 't-test', duration_s: 2, zone: 'forum' };
    engine.manifest.transits = [...(engine.manifest.transits ?? []), shortTransit];

    await engine.playTransit('t-test');
    engine.setNarrationPlaying(false);

    await vi.advanceTimersByTimeAsync(3000);

    expect(systemSpy).toHaveBeenCalledWith(engine.manifest.system.longwalk, {
      levelDb: engine.mix.longwalk.levelDb,
    });

    vi.useRealTimers();
  });

  it('marks playback interrupted after returning from background without auto-resuming', async () => {
    const interruptedStates = [];
    engine.onInterruptionChange = (interrupted) => interruptedStates.push(interrupted);
    engine.activePlayback = { kind: 'waypoint', id: 'w01' };
    engine.setNarrationPlaying(true);

    engine.onPageHidden();
    engine.setNarrationPlaying(false);

    await engine.onPageVisible();

    expect(interruptedStates.at(-1)).toBe(true);
    expect(engine.isPlaybackInterrupted()).toBe(true);
    expect(engine.interruptedPlayback).toEqual({ kind: 'waypoint', id: 'w01' });
  });

  it('does not mark interruption when narration was not playing before hide', async () => {
    engine.activePlayback = { kind: 'waypoint', id: 'w01' };
    engine.setNarrationPlaying(false);

    engine.onPageHidden();
    await engine.onPageVisible();

    expect(engine.isPlaybackInterrupted()).toBe(false);
  });

  it('resumes interrupted playback from the saved waypoint', async () => {
    const playWaypoint = vi.spyOn(engine, 'playWaypoint').mockResolvedValue(undefined);
    engine.interruptedPlayback = { kind: 'waypoint', id: 'w01' };
    engine.setPlaybackInterrupted(true);

    await engine.resumeInterruptedPlayback();

    expect(playWaypoint).toHaveBeenCalledWith('w01');
    expect(engine.isPlaybackInterrupted()).toBe(false);
  });
});

function manifestFromEngine(engine) {
  return engine.manifest;
}
