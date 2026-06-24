import { describe, expect, it } from 'vitest';
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum';
import { PANTHEON_WAYPOINT } from '../../data/pantheon';
import { PIAZZA_NAVONA_WAYPOINT } from '../../data/piazza-navona';
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
    expect(pantheon?.viewpoint?.heading).toBe(3);
    expect(pantheon?.viewpoint?.pitch).toBe(18);
    expect(pantheon?.modern_image_url).toContain('/waypoints/pantheon/');
  });

  it('prefers local camera POV over stale Supabase viewpoint rows', () => {
    const remote = {
      id: 'pantheon',
      title: 'Remote Pantheon',
      lat: 41.8986108,
      lng: 12.4768729,
      viewpoint: { lat: 41.8986108, lng: 12.4768729, heading: 3.07, pitch: 10.52 },
    };

    const merged = mergeWaypointWithLocalDefaults(remote, PANTHEON_WAYPOINT);

    expect(merged.title).toBe('Remote Pantheon');
    expect(merged.lat).toBe(PANTHEON_WAYPOINT.lat);
    expect(merged.viewpoint.pitch).toBe(18);
    expect(merged.framingProfile).toBe('compact_piazza');
  });

  it('resolves piazza-navona from local seed registry', () => {
    const navona = getLocalWaypoint('piazza-navona');

    expect(navona?.id).toBe('piazza-navona');
    expect(navona?.viewpoint?.pitch).toBe(18);
    expect(navona?.framingProfile).toBe('compact_piazza');
    expect(navona?.modern_image_url).toContain('/waypoints/piazza-navona/');
  });
});
