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
    await expect(engine.playWaypoint('w01')).resolves.toBeUndefined();
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
});

function manifestFromEngine(engine) {
  return engine.manifest;
}
