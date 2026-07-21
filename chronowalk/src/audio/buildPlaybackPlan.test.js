import { describe, expect, it } from 'vitest';
import { loadRomeManifest, getWaypoint } from '../content/manifest.js';
import {
  buildTransitPlan,
  buildWaypointPlan,
  resolveActiveZone,
} from './buildPlaybackPlan.js';

describe('buildPlaybackPlan', () => {
  const manifest = loadRomeManifest();

  it('builds chapter sequence for w02', () => {
    const plan = buildWaypointPlan(manifest, 'w02', 'a', {});
    expect(plan.map((item) => item.file)).toEqual([
      'w02_ch1.mp3',
      'w02_ch2.mp3',
    ]);
  });

  it('uses path outro variant for w03 path b', () => {
    const plan = buildWaypointPlan(manifest, 'w03', 'b', {});
    expect(plan.at(-1)?.file).toBe('w03_outro_b.mp3');
  });

  it('builds transit with variant for t01 path b', () => {
    const plan = buildTransitPlan(manifest, 't01', 'b', {});
    expect(plan.map((item) => item.file)).toEqual(['t01_fork_b.mp3']);
  });

  it('resolves zone from waypoint', () => {
    expect(resolveActiveZone(getWaypoint(manifest, 'w01'))).toBe('antiquity');
    expect(resolveActiveZone(getWaypoint(manifest, 'w02'))).toBe('antiquity');
    expect(resolveActiveZone(getWaypoint(manifest, 'w04'))).toBe('antiquity');
    expect(resolveActiveZone(getWaypoint(manifest, 'w15'))).toBe('centro');
  });
});

