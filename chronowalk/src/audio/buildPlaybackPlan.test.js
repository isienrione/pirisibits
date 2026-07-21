import { describe, expect, it } from 'vitest';
import { loadRomeManifest, getWaypoint } from '../content/manifest.js';
import { buildImmersivePlayerProps } from '../redesign/lib/waypointImmersiveProps.js';
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

  it('builds w03 immersive threshold props on path b', () => {
    const waypoint = getWaypoint(manifest, 'w03');
    const props = buildImmersivePlayerProps({
      waypoint,
      waypointId: 'w03',
      manifest,
      audio: { audioAvailable: true },
    });
    expect(props.hasReconstruction).toBe(true);
    expect(props.thenLoop).toBe(
      '/waypoints/forum-cluster/forum-arch-titus/ancient-reconstruction.mp4',
    );
  });

  it('plays Palatine forum intro only on path b', () => {
    const pathA = buildWaypointPlan(manifest, 'w04', 'a', {}).map((item) => item.file);
    const pathB = buildWaypointPlan(manifest, 'w04', 'b', {}).map((item) => item.file);
    expect(pathA).toEqual(['w04_ch1.mp3', 'w04_ch2.mp3']);
    expect(pathB).toEqual(['w04_ch1.mp3', 'w04_ch2.mp3', 'forum_intro_above.mp3']);
  });

  it('builds transit with variant for t01 path b', () => {
    const plan = buildTransitPlan(manifest, 't01', 'b', {});
    expect(plan.map((item) => item.file)).toEqual(['t01_fork_b.mp3']);
  });

  it('resolves zone from waypoint', () => {
    expect(resolveActiveZone(getWaypoint(manifest, 'w02'))).toBe('underworld');
    expect(resolveActiveZone(getWaypoint(manifest, 'w15'))).toBe('centro');
  });
});
