import { describe, expect, it } from 'vitest';
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum';
import { PANTHEON_WAYPOINT } from '../../data/pantheon';
import { PIAZZA_NAVONA_WAYPOINT } from '../../data/piazza-navona';
import {
  assessModernFraming,
  COLOSSEUM_FRAMING_REFERENCE,
  getViewpointOffsetM,
} from '../modernFramingGuide';

describe('modernFramingGuide', () => {
  it('shows Colosseum viewpoint offset from landmark center', () => {
    const offset = getViewpointOffsetM(COLOSSEUM_WAYPOINT);
    expect(offset).toBeGreaterThan(80);
    expect(offset).toBeLessThan(150);
    expect(COLOSSEUM_FRAMING_REFERENCE.viewpointOffsetM).toBe(Math.round(offset));
  });

  it('flags Pantheon when viewpoint equals landmark center (too far framing risk)', () => {
    const assessment = assessModernFraming({
      ...PANTHEON_WAYPOINT,
      lat: 41.8986108,
      lng: 12.4768729,
      viewpoint: { lat: 41.8986108, lng: 12.4768729, heading: 3.07, pitch: 10.52 },
    });
    expect(assessment.offsetM).toBeLessThan(5);
    expect(assessment.warnings.length).toBeGreaterThan(0);
    expect(assessment.passes).toBe(false);
  });

  it('passes Pantheon after close-approach viewpoint rescout', () => {
    const assessment = assessModernFraming(PANTHEON_WAYPOINT);
    expect(assessment.offsetM).toBeGreaterThan(12);
    expect(assessment.pitch).toBe(18);
    expect(assessment.passes).toBe(true);
  });

  it('passes Colosseum framing assessment', () => {
    const assessment = assessModernFraming(COLOSSEUM_WAYPOINT);
    expect(assessment.passes).toBe(true);
  });

  it('passes Piazza Navona compact-piazza framing', () => {
    const assessment = assessModernFraming(PIAZZA_NAVONA_WAYPOINT);
    expect(assessment.offsetM).toBeGreaterThan(12);
    expect(assessment.pitch).toBe(18);
    expect(assessment.passes).toBe(true);
  });
});
