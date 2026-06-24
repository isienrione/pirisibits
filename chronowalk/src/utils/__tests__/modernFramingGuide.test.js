import { describe, expect, it } from 'vitest';
import { COLOSSEUM_WAYPOINT } from '../../data/colosseum';
import { PANTHEON_WAYPOINT } from '../../data/pantheon';
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
    const assessment = assessModernFraming(PANTHEON_WAYPOINT);
    expect(assessment.offsetM).toBeLessThan(5);
    expect(assessment.warnings.length).toBeGreaterThan(0);
    expect(assessment.passes).toBe(false);
  });

  it('passes Colosseum framing assessment', () => {
    const assessment = assessModernFraming(COLOSSEUM_WAYPOINT);
    expect(assessment.passes).toBe(true);
  });
});
