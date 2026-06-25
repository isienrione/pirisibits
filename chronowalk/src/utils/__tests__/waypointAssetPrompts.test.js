import { describe, expect, it } from 'vitest';
import {
  buildAncientStillPrompt,
  buildModernAnimatedVideoPrompt,
  buildStreetViewUrl,
  buildWaypointAssetPromptPack,
} from '../waypointAssetPrompts';

const sampleWaypoint = {
  id: 'colosseum',
  title: 'The Colosseum',
  lat: 41.8902,
  lng: 12.4922,
  viewpoint: {
    lat: 41.891275,
    lng: 12.491202,
    heading: 153.2,
    pitch: 18.1,
  },
  immersive_orientation_hint: 'Stand facing the Colosseum facade.',
  modern_image_url: '/waypoints/colosseum/modern-exterior.jpg',
  slider_poster_at_sec: 3,
};

describe('waypointAssetPrompts', () => {
  it('builds a Street View URL from viewpoint metadata', () => {
    const url = buildStreetViewUrl(sampleWaypoint);
    expect(url).toContain('map_action=pano');
    expect(url).toContain('41.891275');
    expect(url).toContain('heading=153.2');
  });

  it('includes landmark title and camera coords in modern video prompt', () => {
    const prompt = buildModernAnimatedVideoPrompt(sampleWaypoint);
    expect(prompt).toContain('The Colosseum');
    expect(prompt).toContain('41.891275');
    expect(prompt).toContain('locked');
  });

  it('asks for era swap only in ancient still prompt', () => {
    const prompt = buildAncientStillPrompt(sampleWaypoint);
    expect(prompt).toContain('Ancient Rome');
    expect(prompt).toContain('same camera position');
    expect(prompt).toContain('No modern buildings');
  });

  it('returns a full prompt pack with modern reference URL', () => {
    const pack = buildWaypointAssetPromptPack(sampleWaypoint, 'https://chronowalk.test');
    expect(pack.modernReferenceUrl).toBe(
      'https://chronowalk.test/waypoints/colosseum/modern-exterior.jpg'
    );
    expect(pack.prompts.ancientAnimatedVideo).toContain('Ancient Rome');
    expect(pack.fileManifest).toContain('public/waypoints/colosseum/moderncolosseum.mp4');
  });
});
