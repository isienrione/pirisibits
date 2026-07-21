import { describe, expect, it } from 'vitest';
import { loadRomeManifest, getWaypoint } from '../content/manifest.js';
import {
  buildTransitPlan,
  buildWaypointPlan,
  narrationChapterIndexForPlanIndex,
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
    expect(resolveActiveZone(getWaypoint(manifest, 'w02'))).toBe('underworld');
    expect(resolveActiveZone(getWaypoint(manifest, 'w15'))).toBe('centro');
  });

  it('keeps Pantheon on exterior zone for chapter 0, then interior', () => {
    const pantheon = getWaypoint(manifest, 'w17');
    expect(pantheon.interior_zone).toBe('pantheon_interior');
    expect(resolveActiveZone(pantheon)).toBe(pantheon.zone);
    expect(resolveActiveZone(pantheon, { chapterIndex: 0 })).toBe(pantheon.zone);
    expect(resolveActiveZone(pantheon, { chapterIndex: 1 })).toBe('pantheon_interior');
    expect(resolveActiveZone(pantheon, { chapterIndex: 3 })).toBe('pantheon_interior');
  });

  it('maps plan index to narration chapter index', () => {
    const plan = [
      { type: 'narration', file: 'a.mp3' },
      { type: 'insert', file: 'ins.mp3' },
      { type: 'narration', file: 'b.mp3' },
    ];
    expect(narrationChapterIndexForPlanIndex(plan, 0)).toBe(0);
    expect(narrationChapterIndexForPlanIndex(plan, 1)).toBe(0);
    expect(narrationChapterIndexForPlanIndex(plan, 2)).toBe(1);
  });
});
