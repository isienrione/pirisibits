import { describe, expect, it } from 'vitest';
import { isInsertEligible } from './insertEligibility.js';

function ctx(completedWaypointIds = [], completedTransitIds = []) {
  return {
    completedWaypointIds: new Set(completedWaypointIds),
    completedTransitIds: new Set(completedTransitIds),
  };
}

describe('isInsertEligible', () => {
  it('plays when no requirements', () => {
    expect(isInsertEligible({ id: 'x' }, ctx())).toBe(true);
  });

  it('requires all ids in requires', () => {
    const insert = { id: 'i', requires: ['w01', 'w02'] };
    expect(isInsertEligible(insert, ctx(['w01']))).toBe(false);
    expect(isInsertEligible(insert, ctx(['w01', 'w02']))).toBe(true);
  });

  it('requiresAny when at least one completed', () => {
    const insert = { id: 'i', requiresAny: ['w03', 'w04'] };
    expect(isInsertEligible(insert, ctx())).toBe(false);
    expect(isInsertEligible(insert, ctx(['w04']))).toBe(true);
  });

  it('requiresHeard when prerequisite waypoint or transit completed', () => {
    const insert = { id: 'i', requiresHeard: ['w01'] };
    expect(isInsertEligible(insert, ctx())).toBe(false);
    expect(isInsertEligible(insert, ctx(['w01']))).toBe(true);
  });

  it('playIfMissing plays when required waypoint not completed', () => {
    const insert = { id: 'i', playIfMissing: ['w05'] };
    expect(isInsertEligible(insert, ctx())).toBe(true);
    expect(isInsertEligible(insert, ctx(['w05']))).toBe(false);
  });
});
