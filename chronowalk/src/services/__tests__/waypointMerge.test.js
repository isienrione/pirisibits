import { describe, expect, it } from 'vitest';
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum';
import { getLocalWaypoint, mergeWaypointWithLocalDefaults } from '../waypointMerge';

describe('mergeWaypointWithLocalDefaults', () => {
  it('fills missing Supabase media fields from the local seed', () => {
    const remote = {
      id: 'colosseum',
      title: 'Remote title',
      arrival_immersive_url: '/remote/arrival.mp3',
    };

    const merged = mergeWaypointWithLocalDefaults(remote, COLOSSEUM_WAYPOINT);

    expect(merged.title).toBe('Remote title');
    expect(merged.arrival_immersive_url).toBe('/remote/arrival.mp3');
    expect(merged.ancient_video_url).toBe(COLOSSEUM_WAYPOINT.ancient_video_url);
    expect(merged.modern_video_url).toBe(COLOSSEUM_WAYPOINT.modern_video_url);
    expect(merged.immersive_orientation_hint).toBe(COLOSSEUM_WAYPOINT.immersive_orientation_hint);
  });

  it('resolves pantheon from local seed registry', () => {
    const pantheon = getLocalWaypoint('pantheon');

    expect(pantheon?.id).toBe('pantheon');
    expect(pantheon?.viewpoint?.heading).toBe(3.07);
    expect(pantheon?.modern_image_url).toContain('/waypoints/pantheon/');
  });
});
